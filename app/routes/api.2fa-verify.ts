import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { getSession, commitSession } from "~/utils/session.server";
import { query } from "~/db.server";
import { 
  verifyTOTPCode, 
  verifyEmailCode, 
  generateEmailCode, 
  storeEmailCode 
} from "~/services/twoFactor.server";
import { send2FACode } from "~/services/email.server";

/**
 * POST - Verify 2FA code and create session
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();
  const userIdStr = formData.get("userId")?.toString();

  if (!userIdStr) {
    return json({ success: false, error: "Missing user ID" }, { status: 400 });
  }

  const userId = parseInt(userIdStr);

  try {
    if (intent === "send-code") {
      // Send email 2FA code
      const userResult = await query(
        'SELECT email, first_name, last_name, preferred_language FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return json({ success: false, error: "User not found" }, { status: 404 });
      }

      const user = userResult.rows[0];
      const code = generateEmailCode();
      await storeEmailCode(userId, code);

      // Send email
      await send2FACode(user.email, code);

      return json({ success: true, message: "Code sent" });
      
    } else if (intent === "verify") {
      const code = formData.get("code")?.toString();
      const method = formData.get("method")?.toString();

      console.log('=== 2FA Verify Request ===');
      console.log('userId:', userId);
      console.log('code:', code);
      console.log('method:', method);

      if (!code) {
        return json({ success: false, error: "Missing verification code" }, { status: 400 });
      }

      let isValid = false;

      if (method === 'authenticator') {
        // Verify TOTP code
        const secretResult = await query(
          'SELECT two_factor_secret FROM users WHERE id = $1',
          [userId]
        );

        if (secretResult.rows.length === 0 || !secretResult.rows[0].two_factor_secret) {
          return json({ success: false, error: "2FA not configured" }, { status: 400 });
        }

        isValid = verifyTOTPCode(secretResult.rows[0].two_factor_secret, code);
        
      } else if (method === 'email') {
        // Verify email code
        console.log('Verifying email code...');
        isValid = await verifyEmailCode(userId, code);
        console.log('Email code validation result:', isValid);
      }

      console.log('Final isValid:', isValid);

      if (!isValid) {
        console.log('Verification failed, returning error');
        return json({ success: false, error: "Invalid verification code" }, { status: 400 });
      }

      console.log('Verification successful, creating session...');
      
      // Create session manually
      const session = await getSession(request.headers.get("Cookie"));
      session.set("userId", userId);
      
      const cookie = await commitSession(session, {
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
      
      console.log('Session created, cookie:', cookie);
      
      return json(
        { success: true, redirectTo: "/" },
        { 
          headers: {
            "Set-Cookie": cookie
          }
        }
      );
      
    } else {
      return json({ success: false, error: "Invalid intent" }, { status: 400 });
    }
  } catch (error) {
    console.error("2FA verification error:", error);
    return json({ success: false, error: "An error occurred" }, { status: 500 });
  }
}
