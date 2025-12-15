import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/utils/session.server";
import { 
  generateTwoFactorSecret, 
  enableTwoFactorAuth, 
  disableTwoFactorAuth,
  enableEmailTwoFactor 
} from "~/services/twoFactor.server";
import { query } from "~/db.server";

/**
 * GET - Generate 2FA setup data (QR code, secret, etc.)
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Get user email
  const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    return json({ error: 'User not found' }, { status: 404 });
  }
  
  const email = userResult.rows[0].email;
  
  // Generate 2FA secret and QR code
  const setupData = await generateTwoFactorSecret(userId, email);
  
  return json(setupData);
}

/**
 * POST - Enable/disable 2FA
 */
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  try {
    if (intent === "enable-authenticator") {
      const secret = formData.get("secret")?.toString();
      const code = formData.get("code")?.toString();

      if (!secret || !code) {
        return json({ success: false, error: "Missing secret or verification code" }, { status: 400 });
      }

      const result = await enableTwoFactorAuth(userId, secret, code);
      
      if (!result.success) {
        return json({ success: false, error: result.error || "Verification failed" }, { status: 400 });
      }

      return json({ success: true, message: "2FA enabled successfully" });
      
    } else if (intent === "enable-email") {
      await enableEmailTwoFactor(userId);
      return json({ success: true, message: "Email 2FA enabled successfully" });
      
    } else if (intent === "disable") {
      await disableTwoFactorAuth(userId);
      return json({ success: true, message: "2FA disabled successfully" });
      
    } else {
      return json({ success: false, error: "Invalid intent" }, { status: 400 });
    }
  } catch (error) {
    console.error("2FA action error:", error);
    return json({ success: false, error: "An error occurred" }, { status: 500 });
  }
}
