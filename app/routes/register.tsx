import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { register } from "~/services/auth.server";
import { createUserSession, getUserId } from "~/utils/session.server";
import RegisterForm from "~/components/auth/RegisterForm";
import { sendWelcomeEmail } from "~/services/email.server";
import { validatePasswordStrength } from "~/services/security.server";
import crypto from "crypto";
import { query } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");

  // Get language from Accept-Language header
  const acceptLanguage = request.headers.get("Accept-Language") || "";
  const preferredLanguage = acceptLanguage.toLowerCase().includes("hu") ? "hu" : "en";

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string" ||
    typeof firstName !== "string" ||
    typeof lastName !== "string"
  ) {
    return json({ errorKey: "errors.invalidFormData" }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return json({ errorKey: "errors.passwordsDoNotMatch" }, { status: 400 });
  }

  // Validate password strength using shared validation function
  const strengthCheck = validatePasswordStrength(password);
  if (!strengthCheck.valid) {
    // Map the first error to appropriate translation key
    const firstError = strengthCheck.errors[0];
    if (firstError.includes('8 characters')) {
      return json({ errorKey: "errors.passwordTooShort" }, { status: 400 });
    }
    if (firstError.includes('lowercase')) {
      return json({ errorKey: "errors.passwordNeedsLowercase" }, { status: 400 });
    }
    if (firstError.includes('uppercase')) {
      return json({ errorKey: "errors.passwordNeedsUppercase" }, { status: 400 });
    }
    if (firstError.includes('number')) {
      return json({ errorKey: "errors.passwordNeedsNumber" }, { status: 400 });
    }
    if (firstError.includes('special character')) {
      return json({ errorKey: "errors.passwordNeedsSpecialChar" }, { status: 400 });
    }
    // Fallback for common passwords or other errors
    return json({ errorKey: "errors.passwordWeak" }, { status: 400 });
  }

  const user = await register({ email, password, firstName, lastName, preferredLanguage });

  if (!user) {
    return json({ errorKey: "errors.emailAlreadyExists" }, { status: 400 });
  }

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Save verification token to database
  await query(
    `INSERT INTO email_verifications (user_id, token, expires_at, created_at)
     VALUES ($1, $2, $3, NOW())`,
    [user.id, verificationToken, expiresAt]
  );

  // Get base URL
  const baseUrl = new URL(request.url).origin;

  // Send welcome email with verification link (non-blocking)
  sendWelcomeEmail(email, firstName, verificationToken, baseUrl, preferredLanguage as 'en' | 'hu')
    .catch(err => console.error('Failed to send welcome email:', err));

  // Redirect to a page telling user to verify email
  return redirect("/verify-email-sent");
}

export default function Register() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="auth-container">
      <RegisterForm errorKey={actionData?.errorKey} />
    </div>
  );
}
