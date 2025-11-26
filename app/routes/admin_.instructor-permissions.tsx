import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Form, useFetcher, Link, useOutletContext } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { query } from "~/db.server";
import { requireUserId } from "~/utils/session.server";
import { sendPermissionGranted } from "~/services/email.server";
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

  // Get all instructors with their permission status
  const instructorsResult = await query(
    `SELECT 
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.role,
      ip.can_reserve_rooms,
      ip.can_override_reservations,
      ip.granted_at,
      ip.revoked,
      granter.first_name || ' ' || granter.last_name as granted_by_name
     FROM users u
     LEFT JOIN instructor_permissions ip ON u.id = ip.user_id
     LEFT JOIN users granter ON ip.granted_by = granter.id
     WHERE u.role IN ('instructor', 'superuser')
     ORDER BY u.last_name, u.first_name`
  );

  return json({ instructors: instructorsResult.rows });
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
  const intent = formData.get("intent");
  const instructorId = formData.get("instructorId");
  const permissionType = formData.get("permissionType") as string; // 'reserve' or 'override'

  if (!instructorId) {
    return json({ success: false, error: "Instructor ID required" }, { status: 400 });
  }

  // Verify the user is actually an instructor or superuser
  const instructorCheck = await query(
    "SELECT role FROM users WHERE id = $1",
    [instructorId]
  );

  if (instructorCheck.rows.length === 0 || 
      !['instructor', 'superuser'].includes(instructorCheck.rows[0].role)) {
    return json({ success: false, error: "User is not an instructor or superuser" }, { status: 400 });
  }

  if (intent === "grant") {
    // Get instructor details for email notification
    const instructorResult = await query(
      `SELECT email, first_name, last_name, preferred_language
       FROM users WHERE id = $1`,
      [instructorId]
    );

    if (instructorResult.rows.length === 0) {
      return json({ success: false, error: "Instructor not found" }, { status: 404 });
    }

    const instructor = instructorResult.rows[0];
    const instructorName = `${instructor.first_name} ${instructor.last_name}`;
    const language = instructor.preferred_language || 'en';

    // Check if permission already exists
    const existingPermission = await query(
      "SELECT id, revoked, can_reserve_rooms, can_override_reservations FROM instructor_permissions WHERE user_id = $1",
      [instructorId]
    );

    let permissionGranted = false;

    if (existingPermission.rows.length > 0) {
      // Permission record exists, update it
      const perm = existingPermission.rows[0];
      
      if (permissionType === 'reserve') {
        await query(
          `UPDATE instructor_permissions 
           SET can_reserve_rooms = true, revoked = false, revoked_at = NULL, granted_by = $1, granted_at = NOW()
           WHERE user_id = $2`,
          [userId, instructorId]
        );
        permissionGranted = true;
      } else if (permissionType === 'override') {
        await query(
          `UPDATE instructor_permissions 
           SET can_override_reservations = true, granted_by = $1, granted_at = NOW()
           WHERE user_id = $2`,
          [userId, instructorId]
        );
        permissionGranted = true;
      }
    } else {
      // Create new permission record
      if (permissionType === 'reserve') {
        await query(
          `INSERT INTO instructor_permissions (user_id, can_reserve_rooms, can_override_reservations, granted_by, granted_at)
           VALUES ($1, true, false, $2, NOW())`,
          [instructorId, userId]
        );
        permissionGranted = true;
      } else if (permissionType === 'override') {
        await query(
          `INSERT INTO instructor_permissions (user_id, can_reserve_rooms, can_override_reservations, granted_by, granted_at)
           VALUES ($1, false, true, $2, NOW())`,
          [instructorId, userId]
        );
        permissionGranted = true;
      }
    }

    if (permissionGranted) {
      const permissionTypeText = permissionType === 'reserve' ? 'can_reserve_rooms' : 'can_override_reservations';
      
      // Send permission granted email
      sendPermissionGranted(
        instructor.email,
        instructorName,
        permissionTypeText,
        language as 'en' | 'hu'
      ).catch(err => console.error('Failed to send permission granted email:', err));

      // Create notification
      await query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, $2, $3, $4)`,
        [
          instructorId,
          'permission_granted',
          language === 'hu' ? 'Új jogosultság' : 'New Permission',
          language === 'hu' 
            ? `Új jogosultságot kaptál: ${permissionType === 'reserve' ? 'Termek foglalása' : 'Foglalások felülírása'}`
            : `You have been granted a new permission: ${permissionType === 'reserve' ? 'Reserve Rooms' : 'Override Reservations'}`
        ]
      );

      return json({ 
        success: true, 
        message: permissionType === 'reserve' ? "Reservation permission granted" : "Override permission granted" 
      });
    }
  }

  if (intent === "revoke") {
    if (permissionType === 'reserve') {
      // Revoke reservation permission
      const result = await query(
        `UPDATE instructor_permissions 
         SET can_reserve_rooms = false, revoked = true, revoked_at = NOW()
         WHERE user_id = $1 AND can_reserve_rooms = true
         RETURNING id`,
        [instructorId]
      );

      if (result.rows.length === 0) {
        return json({ success: false, error: "No active reservation permission found" }, { status: 404 });
      }

      return json({ success: true, message: "Reservation permission revoked" });
    } else if (permissionType === 'override') {
      // Revoke override permission
      const result = await query(
        `UPDATE instructor_permissions 
         SET can_override_reservations = false
         WHERE user_id = $1 AND can_override_reservations = true
         RETURNING id`,
        [instructorId]
      );

      if (result.rows.length === 0) {
        return json({ success: false, error: "No active override permission found" }, { status: 404 });
      }

      return json({ success: true, message: "Override permission revoked" });
    }
  }

  return json({ success: false, error: "Invalid intent or permission type" }, { status: 400 });
}

export default function AdminInstructorPermissions() {
  const { instructors } = useLoaderData<typeof loader>();
  const { user } = useOutletContext<any>();
  const { t } = useTranslation();
  const fetcher = useFetcher();

  const hasReservePermission = (instructor: any) => {
    return instructor.can_reserve_rooms === true && instructor.revoked === false;
  };

  const hasOverridePermission = (instructor: any) => {
    return instructor.can_override_reservations === true;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="app-container">
      <AnimatedBackground />
      <Header user={user} />
      
      <main className="main-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--text-primary)', margin: 0 }}>
            ⭐ {t('permissions.instructorPermissions')}
          </h1>
          <Link to="/admin" className="btn-secondary">
            ← {t('common.back') || 'Back to Admin'}
          </Link>
        </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ color: 'var(--text-primary)', marginTop: 0 }}>
          ℹ️ {t('admin.permissionTypes') || 'Permission Types'}
        </h3>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          <li><strong>{t('admin.canReserveRooms') || 'Can Reserve Rooms'}:</strong> {t('admin.canReserveRoomsDesc') || 'Allows instructor to create their own room reservations'}</li>
          <li><strong>{t('admin.canOverrideReservations') || 'Can Override Reservations'}:</strong> {t('admin.canOverrideReservationsDesc') || 'Allows instructor to cancel or modify other users\' reservations'}</li>
        </ul>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {t('permissions.instructorPermissionsDescription') || 
           'Grant or revoke room reservation permissions for instructors.'}
        </p>

        {instructors.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            {t('admin.noInstructors') || 'No instructors found'}
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {instructors.map((instructor: any) => {
              const canReserve = hasReservePermission(instructor);
              const canOverride = hasOverridePermission(instructor);
              
              return (
                <div 
                  key={instructor.id} 
                  className="glass-card" 
                  style={{ 
                    padding: '1.5rem',
                    borderLeft: (canReserve || canOverride)
                      ? '4px solid #66bb6a' 
                      : '4px solid #ef5350'
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                      👨‍🏫 {instructor.first_name} {instructor.last_name}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                      📧 {instructor.email}
                    </p>
                    
                    {instructor.granted_at && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                        {t('admin.lastUpdated') || 'Last updated'}: {formatDate(instructor.granted_at)}
                        {instructor.granted_by_name && ` ${t('admin.by') || 'by'} ${instructor.granted_by_name}`}
                      </p>
                    )}
                  </div>

                  {/* Permission badges and controls */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    {/* Reserve Permission */}
                    <div className="glass-card" style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.95rem' }}>
                          🏫 {t('admin.reservePermission') || 'Reserve Rooms'}
                        </h4>
                        {canReserve ? (
                          <span style={{
                            background: '#66bb6a',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            ✅ {t('admin.granted') || 'Granted'}
                          </span>
                        ) : (
                          <span style={{
                            background: '#ef5350',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            🚫 {t('admin.revoked') || 'Revoked'}
                          </span>
                        )}
                      </div>
                      <fetcher.Form method="post">
                        <input type="hidden" name="instructorId" value={instructor.id} />
                        <input type="hidden" name="permissionType" value="reserve" />
                        {canReserve ? (
                          <button
                            type="submit"
                            name="intent"
                            value="revoke"
                            className="btn-secondary"
                            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}
                          >
                            🚫 {t('admin.revoke') || 'Revoke'}
                          </button>
                        ) : (
                          <button
                            type="submit"
                            name="intent"
                            value="grant"
                            className="btn-primary"
                            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}
                          >
                            ✅ {t('admin.grant') || 'Grant'}
                          </button>
                        )}
                      </fetcher.Form>
                    </div>

                    {/* Override Permission */}
                    <div className="glass-card" style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.95rem' }}>
                          ⚡ {t('admin.overridePermission') || 'Override Others'}
                        </h4>
                        {canOverride ? (
                          <span style={{
                            background: '#ff9800',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            ✅ {t('admin.granted') || 'Granted'}
                          </span>
                        ) : (
                          <span style={{
                            background: '#757575',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            🚫 {t('admin.notGranted') || 'Not Granted'}
                          </span>
                        )}
                      </div>
                      <fetcher.Form method="post">
                        <input type="hidden" name="instructorId" value={instructor.id} />
                        <input type="hidden" name="permissionType" value="override" />
                        {canOverride ? (
                          <button
                            type="submit"
                            name="intent"
                            value="revoke"
                            className="btn-secondary"
                            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}
                          >
                            🚫 {t('admin.revoke') || 'Revoke'}
                          </button>
                        ) : (
                          <button
                            type="submit"
                            name="intent"
                            value="grant"
                            className="btn-primary"
                            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem', background: '#ff9800' }}
                          >
                            ✅ {t('admin.grant') || 'Grant'}
                          </button>
                        )}
                      </fetcher.Form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
