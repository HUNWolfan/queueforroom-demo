import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData, useOutletContext } from "@remix-run/react";
import { requireUserId } from "~/utils/session.server";
import { query } from "~/db.server";
import Header from "~/components/layout/Header";
import AnimatedBackground from "~/components/layout/AnimatedBackground";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import bcrypt from "bcryptjs";
import { sendAdminRegistrationEmail } from "~/services/email.server";
import crypto from "crypto";
import { getBaseUrl } from "~/utils/url.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Felhasználó adatainak lekérése és admin jogosultság ellenőrzése
  const userResult = await query(
    'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
    [userId]
  );
  
  const user = userResult.rows[0];
  
  if (user.role !== 'admin') {
    throw new Response("Nincs jogosultság", { status: 403 });
  }

  // Összes felhasználó lekérése
  const usersResult = await query(`
    SELECT id, email, first_name, last_name, role, created_at
    FROM users
    ORDER BY created_at DESC
  `);

  return json({ users: usersResult.rows });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Admin jogosultság ellenőrzése
  const userResult = await query(
    'SELECT role FROM users WHERE id = $1',
    [userId]
  );
  
  if (userResult.rows[0]?.role !== 'admin') {
    return json({ success: false, error: "Nincs jogosultság" }, { status: 403 });
  }

  if (intent === "create") {
    const email = formData.get("email");
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const password = formData.get("password");
    const role = formData.get("role");

    if (!email || !firstName || !lastName || !password || !role) {
      return json({ success: false, error: "Minden mező kitöltése kötelező" });
    }

    try {
      // Email már létezik ellenőrzése
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return json({ success: false, error: "Ez az email cím már használatban van" });
      }

      // Generálj egy ideiglenes jelszót ha nincs megadva
      const tempPassword = password as string;
      
      // Jelszó hash-elése
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // Detect preferred language from Accept-Language header
      const acceptLanguage = request.headers.get("Accept-Language") || "";
      const preferredLanguage = acceptLanguage.toLowerCase().includes("hu") ? "hu" : "en";

      // Felhasználó létrehozása - email már verified, mert admin hozta létre
      await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, preferred_language) 
         VALUES ($1, $2, $3, $4, $5, true, $6)`,
        [email, passwordHash, firstName, lastName, role, preferredLanguage]
      );

      // Send notification email to the new user
      const baseUrl = getBaseUrl(request);
      sendAdminRegistrationEmail(
        email as string,
        firstName as string,
        tempPassword,
        baseUrl,
        preferredLanguage as 'en' | 'hu'
      ).catch(err => console.error('Failed to send admin registration email:', err));

      return json({ success: true, message: "Felhasználó sikeresen létrehozva és értesítő email elküldve" });
    } catch (error) {
      console.error("Felhasználó létrehozási hiba:", error);
      return json({ success: false, error: "Felhasználó létrehozása sikertelen" });
    }
  }

  if (intent === "update") {
    const userIdToUpdate = formData.get("userId");
    const email = formData.get("email");
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const role = formData.get("role");
    const password = formData.get("password");

    if (!userIdToUpdate || !email || !firstName || !lastName || !role) {
      return json({ success: false, error: "Minden mező kitöltése kötelező" });
    }

    try {
      // Ha új jelszót adtak meg, frissítjük azt is
      if (password && (password as string).length > 0) {
        const passwordHash = await bcrypt.hash(password as string, 10);
        await query(
          `UPDATE users 
           SET email = $1, first_name = $2, last_name = $3, role = $4, password_hash = $5, updated_at = CURRENT_TIMESTAMP
           WHERE id = $6`,
          [email, firstName, lastName, role, passwordHash, userIdToUpdate]
        );
      } else {
        // Csak az alapadatokat frissítjük
        await query(
          `UPDATE users 
           SET email = $1, first_name = $2, last_name = $3, role = $4, updated_at = CURRENT_TIMESTAMP
           WHERE id = $5`,
          [email, firstName, lastName, role, userIdToUpdate]
        );
      }

      return json({ success: true, message: "Felhasználó sikeresen frissítve" });
    } catch (error) {
      console.error("Felhasználó frissítési hiba:", error);
      return json({ success: false, error: "Felhasználó frissítése sikertelen" });
    }
  }

  if (intent === "delete") {
    const userIdToDelete = formData.get("userId");

    if (!userIdToDelete) {
      return json({ success: false, error: "Felhasználó azonosító hiányzik" });
    }

    // Saját fiók törlésének megakadályozása
    if (parseInt(userIdToDelete as string) === userId) {
      return json({ success: false, error: "Nem törölheted a saját fiókodat" });
    }

    try {
      await query('DELETE FROM users WHERE id = $1', [userIdToDelete]);
      return json({ success: true, message: "Felhasználó sikeresen törölve" });
    } catch (error) {
      console.error("Felhasználó törlési hiba:", error);
      return json({ success: false, error: "Felhasználó törlése sikertelen" });
    }
  }

  return json({ success: false, error: "Érvénytelen művelet" });
}

export default function AdminUsers() {
  const { users } = useLoaderData<typeof loader>();
  const { user: currentUser } = useOutletContext<any>();
  const actionData = useActionData<typeof action>() as any;
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Close modal when action succeeds
  useEffect(() => {
    if (actionData?.success) {
      setIsModalOpen(false);
      setEditingUser(null);
    }
  }, [actionData]);

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = (user: any) => {
    if (window.confirm(t('admin.confirmDelete', 'Biztosan törölni szeretnéd ezt a felhasználót?'))) {
      const form = document.getElementById('delete-form-' + user.id) as HTMLFormElement;
      if (form) form.submit();
    }
  };

  return (
    <div className="app-container">
      <AnimatedBackground />
      <Header user={currentUser} />
      <main className="main-content">
        <div className="admin-container">
          <div className="admin-header">
            <h1>{t('admin.userManagement', 'Felhasználókezelés')}</h1>
            <button onClick={handleAdd} className="btn-primary">
              + {t('admin.addUser', 'Felhasználó hozzáadása')}
            </button>
          </div>

          {actionData?.success && (
            <div className="alert alert-success">
              {actionData.message}
            </div>
          )}

          {actionData?.error && (
            <div className="alert alert-error">
              {actionData.error}
            </div>
          )}

          <div className="users-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('admin.firstName', 'Keresztnév')}</th>
                  <th>{t('admin.lastName', 'Vezetéknév')}</th>
                  <th>{t('admin.email', 'Email')}</th>
                  <th>{t('admin.role', 'Szerepkör')}</th>
                  <th>{t('admin.actions', 'Műveletek')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id}>
                    <td data-label="ID">{user.id}</td>
                    <td data-label={t('admin.firstName', 'Keresztnév')}>{user.first_name}</td>
                    <td data-label={t('admin.lastName', 'Vezetéknév')}>{user.last_name}</td>
                    <td data-label={t('admin.email', 'Email')}>{user.email}</td>
                    <td data-label={t('admin.role', 'Szerepkör')}>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role === 'admin' && t('admin.roleAdmin', 'Admin')}
                        {user.role === 'instructor' && t('admin.roleInstructor', 'Oktató')}
                        {user.role === 'student' && t('admin.roleStudent', 'Diák')}
                        {user.role === 'user' && t('admin.roleUser', 'Felhasználó')}
                      </span>
                    </td>
                    <td className="actions-cell" data-label={t('admin.actions', 'Műveletek')}>
                      <button 
                        onClick={() => handleEdit(user)} 
                        className="btn-icon btn-edit"
                        title={t('admin.edit', 'Szerkesztés')}
                      >
                        ✏️
                      </button>
                      <Form 
                        id={`delete-form-${user.id}`}
                        method="post" 
                        style={{ display: 'inline' }}
                      >
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="userId" value={user.id} />
                        <button 
                          type="button"
                          onClick={() => handleDelete(user)}
                          className="btn-icon btn-delete"
                          title={t('admin.delete', 'Törlés')}
                          disabled={user.id === currentUser.id}
                        >
                          🗑️
                        </button>
                      </Form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {editingUser 
                    ? `${t('admin.editUser', 'Felhasználó szerkesztése')}: ${editingUser.first_name} ${editingUser.last_name}`
                    : t('admin.addUser', 'Felhasználó hozzáadása')
                  }
                </h2>
                <button className="modal-close" onClick={handleCloseModal}>×</button>
              </div>
              
              <Form method="post" className="user-form">
                <input 
                  type="hidden" 
                  name="intent" 
                  value={editingUser ? "update" : "create"} 
                />
                {editingUser && (
                  <input type="hidden" name="userId" value={editingUser.id} />
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">{t('admin.firstName', 'Keresztnév')}</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      defaultValue={editingUser?.first_name}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">{t('admin.lastName', 'Vezetéknév')}</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      defaultValue={editingUser?.last_name}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">{t('admin.email', 'Email')}</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    defaultValue={editingUser?.email}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">{t('admin.role', 'Szerepkör')}</label>
                  <select
                    id="role"
                    name="role"
                    defaultValue={editingUser?.role || 'student'}
                    required
                  >
                    <option value="student">{t('admin.roleStudent', 'Diák')}</option>
                    <option value="user">{t('admin.roleUser', 'Felhasználó')}</option>
                    <option value="instructor">{t('admin.roleInstructor', 'Oktató')}</option>
                    <option value="admin">{t('admin.roleAdmin', 'Admin')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="password">
                    {editingUser 
                      ? t('admin.passwordOptional', 'Jelszó (Opcionális - csak ha meg akarod változtatni)')
                      : t('admin.password', 'Jelszó')
                    }
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required={!editingUser}
                    minLength={6}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={handleCloseModal} className="btn-secondary">
                    {t('admin.cancel', 'Mégse')}
                  </button>
                  <button type="submit" className="btn-primary">
                    {t('admin.save', 'Mentés')}
                  </button>
                </div>
              </Form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
