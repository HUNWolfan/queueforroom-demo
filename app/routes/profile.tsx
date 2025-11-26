import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useOutletContext, Form, useActionData } from "@remix-run/react";
import { requireUserId } from "~/utils/session.server";
import { query } from "~/db.server";
import Header from "~/components/layout/Header";
import { useTranslation } from "react-i18next";
import bcrypt from 'bcryptjs';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  const result = await query(
    'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (!result.rows[0]) {
    throw new Response("User not found", { status: 404 });
  }

  const user = result.rows[0];
  
  return json({ 
    profile: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at,
    }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "updateProfile") {
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");

    if (typeof firstName !== "string" || typeof lastName !== "string") {
      return json({ errorKey: "errors.invalidFormData" }, { status: 400 });
    }

    await query(
      'UPDATE users SET first_name = $1, last_name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [firstName, lastName, userId]
    );

    return json({ success: true, messageKey: "profile.updateSuccess" });
  }

  if (intent === "changePassword") {
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || typeof confirmPassword !== "string") {
      return json({ errorKey: "errors.invalidFormData" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return json({ errorKey: "errors.newPasswordsDontMatch" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return json({ errorKey: "errors.passwordTooShort" }, { status: 400 });
    }

    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

    if (!isValid) {
      return json({ errorKey: "errors.currentPasswordIncorrect" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, userId]);

    return json({ success: true, messageKey: "profile.passwordChangeSuccess" });
  }

  return json({ errorKey: "errors.invalidAction" }, { status: 400 });
}

export default function Profile() {
  const { profile } = useLoaderData<typeof loader>();
  const { user } = useOutletContext<any>();
  const actionData = useActionData<typeof action>() as any;
  const { t, i18n } = useTranslation();
  
  const isHungarian = i18n.language === 'hu';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="app-container">
      <Header user={user} />
      
      <main className="main-content">
        <div className="profile-container">
          <h1>{t("profile.title") || "My Profile"}</h1>

          {actionData?.success && actionData?.messageKey && (
            <div className="success-message">
              {t(actionData.messageKey)}
            </div>
          )}

          {actionData?.errorKey && (
            <div className="error-message">
              {t(actionData.errorKey)}
            </div>
          )}

          <div className="profile-grid">
            {/* Profile Information */}
            <div className="profile-card">
              <h2>{t("profile.information") || "Profile Information"}</h2>
              <Form method="post" className="profile-form">
                <input type="hidden" name="intent" value="updateProfile" />
                
                {isHungarian ? (
                  <>
                    {/* Magyar sorrend: Vezetéknév → Keresztnév */}
                    <div className="form-group">
                      <label>{t("register.lastName")}</label>
                      <input
                        type="text"
                        name="lastName"
                        defaultValue={profile.lastName}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>{t("register.firstName")}</label>
                      <input
                        type="text"
                        name="firstName"
                        defaultValue={profile.firstName}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Angol/nemzetközi sorrend: First Name → Last Name */}
                    <div className="form-group">
                      <label>{t("register.firstName")}</label>
                      <input
                        type="text"
                        name="firstName"
                        defaultValue={profile.firstName}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>{t("register.lastName")}</label>
                      <input
                        type="text"
                        name="lastName"
                        defaultValue={profile.lastName}
                        required
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>{t("login.email")}</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                  <small style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                    {t("profile.emailNotEditable") || "Email cannot be changed"}
                  </small>
                </div>

                <div className="form-group">
                  <label>{t("profile.role") || "Role"}</label>
                  <input
                    type="text"
                    value={t(`roles.${profile.role}`) || profile.role}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label>{t("profile.memberSince") || "Member Since"}</label>
                  <input
                    type="text"
                    value={formatDate(profile.createdAt)}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>

                <button type="submit" className="btn-primary">
                  {t("common.save")}
                </button>
              </Form>
            </div>

            {/* Change Password */}
            <div className="profile-card">
              <h2>{t("profile.changePassword") || "Change Password"}</h2>
              <Form method="post" className="profile-form">
                <input type="hidden" name="intent" value="changePassword" />
                
                <div className="form-group">
                  <label>{t("profile.currentPassword") || "Current Password"}</label>
                  <input
                    type="password"
                    name="currentPassword"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t("profile.newPassword") || "New Password"}</label>
                  <input
                    type="password"
                    name="newPassword"
                    minLength={6}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t("profile.confirmNewPassword") || "Confirm New Password"}</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    minLength={6}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary">
                  {t("profile.updatePassword") || "Update Password"}
                </button>
              </Form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
