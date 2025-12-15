import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { query } from "~/db.server";
import { sendWelcomeEmail } from "~/services/email.server";
import crypto from "crypto";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");

  if (typeof email !== "string") {
    return json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    // Check if user exists
    const userResult = await query(
      "SELECT id, first_name, email_verified, preferred_language FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return json({ 
        error: "Email already verified",
        message: "Az email címed már meg van erősítve. Most már bejelentkezhetsz."
      }, { status: 400 });
    }

    // Check rate limiting - max 1 email per 60 seconds
    const recentEmailCheck = await query(
      `SELECT created_at FROM email_verifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [user.id]
    );

    if (recentEmailCheck.rows.length > 0) {
      const lastSent = new Date(recentEmailCheck.rows[0].created_at);
      const now = new Date();
      const secondsSinceLastSent = (now.getTime() - lastSent.getTime()) / 1000;

      if (secondsSinceLastSent < 60) {
        const waitTime = Math.ceil(60 - secondsSinceLastSent);
        return json({ 
          error: "Rate limit",
          message: `Kérlek várj még ${waitTime} másodpercet mielőtt újra kérsz email-t.`,
          waitTime
        }, { status: 429 });
      }
    }

    // Delete old verification tokens for this user
    await query("DELETE FROM email_verifications WHERE user_id = $1", [user.id]);

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save new verification token
    await query(
      `INSERT INTO email_verifications (user_id, token, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [user.id, verificationToken, expiresAt]
    );

    // Get base URL
    const baseUrl = new URL(request.url).origin;

    // Send welcome email with verification link
    const emailResult = await sendWelcomeEmail(
      email, 
      user.first_name, 
      verificationToken, 
      baseUrl, 
      user.preferred_language as 'en' | 'hu'
    );

    if (emailResult.success) {
      return json({ 
        success: true,
        message: "Megerősítő email elküldve! Ellenőrizd a bejövő leveleid között."
      });
    } else {
      return json({ 
        error: "Email sending failed",
        message: "Nem sikerült elküldeni az email-t. Próbáld újra később."
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Resend verification error:", error);
    return json({ 
      error: "Server error",
      message: "Hiba történt. Próbáld újra később."
    }, { status: 500 });
  }
}
