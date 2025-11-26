import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Form, Link, useActionData, useOutletContext } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { query } from "~/db.server";
import { requireUserId } from "~/utils/session.server";
import Header from "~/components/layout/Header";
import AnimatedBackground from "~/components/layout/AnimatedBackground";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Check if user is admin
  const userResult = await query("SELECT role FROM users WHERE id = $1", [userId]);
  const user = userResult.rows[0];
  
  if (user.role !== 'admin') {
    throw redirect('/');
  }

  // Get current settings
  const settingsResult = await query(
    `SELECT setting_key, setting_value, description 
     FROM system_settings 
     WHERE setting_key IN ('min_reservation_minutes', 'max_reservation_minutes')
     ORDER BY setting_key`
  );

  const settings: Record<string, any> = {};
  settingsResult.rows.forEach(row => {
    settings[row.setting_key] = {
      value: parseInt(row.setting_value),
      description: row.description
    };
  });

  return json({ settings });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Check if user is admin
  const userResult = await query("SELECT role FROM users WHERE id = $1", [userId]);
  const user = userResult.rows[0];
  
  if (user.role !== 'admin') {
    return json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const minMinutes = parseInt(formData.get("minMinutes") as string);
  const maxMinutes = parseInt(formData.get("maxMinutes") as string);

  // Validation
  if (isNaN(minMinutes) || isNaN(maxMinutes)) {
    return json({ 
      success: false, 
      error: "Invalid input: minutes must be numbers" 
    }, { status: 400 });
  }

  if (minMinutes < 15) {
    return json({ 
      success: false, 
      error: "Minimum reservation time cannot be less than 15 minutes" 
    }, { status: 400 });
  }

  if (maxMinutes > 480) {
    return json({ 
      success: false, 
      error: "Maximum reservation time cannot exceed 8 hours (480 minutes)" 
    }, { status: 400 });
  }

  if (minMinutes >= maxMinutes) {
    return json({ 
      success: false, 
      error: "Minimum time must be less than maximum time" 
    }, { status: 400 });
  }

  try {
    // Update settings
    await query(
      `UPDATE system_settings 
       SET setting_value = $1, updated_by = $2, updated_at = NOW()
       WHERE setting_key = 'min_reservation_minutes'`,
      [minMinutes.toString(), userId]
    );

    await query(
      `UPDATE system_settings 
       SET setting_value = $1, updated_by = $2, updated_at = NOW()
       WHERE setting_key = 'max_reservation_minutes'`,
      [maxMinutes.toString(), userId]
    );

    return json({ 
      success: true, 
      message: "Reservation time limits updated successfully" 
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return json({ 
      success: false, 
      error: "Failed to update settings" 
    }, { status: 500 });
  }
}

export default function AdminSystemSettings() {
  const { settings } = useLoaderData<typeof loader>();
  const { user } = useOutletContext<any>();
  const actionData = useActionData<typeof action>();
  const { t } = useTranslation();

  const minMinutes = settings.min_reservation_minutes?.value || 30;
  const maxMinutes = settings.max_reservation_minutes?.value || 120;

  return (
    <div className="app-container">
      <AnimatedBackground />
      <Header user={user} />
      
      <main className="main-content" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--text-primary)', margin: 0 }}>
            ⚙️ {t('admin.systemSettings') || 'System Settings'}
          </h1>
          <Link to="/admin" className="btn-secondary">
            ← {t('common.back') || 'Back to Admin'}
          </Link>
        </div>

      {/* Success/Error Messages */}
      {actionData?.success && (actionData as any).message && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          background: 'rgba(102, 187, 106, 0.2)',
          border: '1px solid rgba(102, 187, 106, 0.5)',
          borderRadius: '8px',
          color: '#66bb6a'
        }}>
          ✅ {(actionData as any).message}
        </div>
      )}

      {!actionData?.success && (actionData as any)?.error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          background: 'rgba(239, 83, 80, 0.2)',
          border: '1px solid rgba(239, 83, 80, 0.5)',
          borderRadius: '8px',
          color: '#ef5350'
        }}>
          ❌ {(actionData as any).error}
        </div>
      )}

      {/* Reservation Time Limits */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
          ⏱️ {t('permissions.reservationTimeLimits') || 'Reservation Time Limits'}
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          {t('admin.timeLimitsDescription') || 'Set the minimum and maximum duration for room reservations. These limits apply to all users.'}
        </p>

        <Form method="post">
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              {t('permissions.minReservationTime')} ({t('permissions.minutes')})
            </label>
            <input
              type="number"
              name="minMinutes"
              defaultValue={minMinutes}
              min="15"
              max="480"
              step="5"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              {t('admin.minTimeLimitHelp') || 'Minimum: 15 minutes'}
            </small>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              {t('permissions.maxReservationTime')} ({t('permissions.minutes')})
            </label>
            <input
              type="number"
              name="maxMinutes"
              defaultValue={maxMinutes}
              min="15"
              max="480"
              step="5"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              {t('admin.maxTimeLimitHelp') || 'Maximum: 480 minutes (8 hours)'}
            </small>
          </div>

          {/* Current Values Display */}
          <div style={{
            padding: '1rem',
            background: 'rgba(103, 126, 234, 0.1)',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <p style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
              <strong>{t('admin.currentSettings') || 'Current Settings'}:</strong>
            </p>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
              📊 {t('permissions.minReservationTime')}: <strong>{minMinutes} {t('permissions.minutes')}</strong>
            </p>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
              📊 {t('permissions.maxReservationTime')}: <strong>{maxMinutes} {t('permissions.minutes')}</strong>
            </p>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
          >
            💾 {t('common.save') || 'Save Changes'}
          </button>
        </Form>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'rgba(255, 193, 7, 0.1)',
        border: '1px solid rgba(255, 193, 7, 0.3)',
        borderRadius: '8px'
      }}>
        <h3 style={{ color: '#ffc107', margin: '0 0 0.75rem 0', fontSize: '1rem' }}>
          ℹ️ {t('admin.importantNote') || 'Important Note'}
        </h3>
        <ul style={{ color: 'var(--text-secondary)', margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            {t('admin.timeLimitNote1') || 'These limits apply to all new reservations'}
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            {t('admin.timeLimitNote2') || 'Existing reservations are not affected'}
          </li>
          <li>
            {t('admin.timeLimitNote3') || 'Recommended: 30-120 minutes for classrooms'}
          </li>
        </ul>
      </div>
      </main>
    </div>
  );
}
