import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Form, useFetcher, Link, useOutletContext } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { query } from "~/db.server";
import { requireUserId } from "~/utils/session.server";
import { sendReservationConfirmation, sendPermissionRejected } from "~/services/email.server";
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

  // Get all permission requests with user and room info
  const requestsResult = await query(
    `SELECT rr.*, 
            u.first_name || ' ' || u.last_name as student_name,
            u.email as student_email,
            r.name as room_name,
            r.name_en,
            r.name_hu,
            reviewer.first_name || ' ' || reviewer.last_name as reviewer_name
     FROM reservation_requests rr
     JOIN users u ON rr.user_id = u.id
     JOIN rooms r ON rr.room_id = r.id
     LEFT JOIN users reviewer ON rr.reviewed_by = reviewer.id
     ORDER BY 
       CASE rr.status 
         WHEN 'pending' THEN 1 
         WHEN 'approved' THEN 2 
         WHEN 'rejected' THEN 3 
         ELSE 4 
       END,
       rr.created_at DESC`
  );

  return json({ requests: requestsResult.rows });
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
  const requestId = formData.get("requestId");

  if (!requestId) {
    return json({ success: false, error: "Request ID required" }, { status: 400 });
  }

  if (intent === "approve") {
    const reviewNote = formData.get("reviewNote") || null;

    // Get request details
    const requestResult = await query(
      `SELECT * FROM reservation_requests WHERE id = $1 AND status = 'pending'`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return json({ success: false, error: "Request not found or already processed" }, { status: 404 });
    }

    const req = requestResult.rows[0];

    // Check for conflicts again
    const conflictResult = await query(
      `SELECT id FROM reservations 
       WHERE room_id = $1 
       AND status != 'cancelled'
       AND (
         (start_time <= $2 AND end_time > $2) OR
         (start_time < $3 AND end_time >= $3) OR
         (start_time >= $2 AND end_time <= $3)
       )`,
      [req.room_id, req.start_time, req.end_time]
    );

    if (conflictResult.rows.length > 0) {
      return json({
        success: false,
        error: "Time slot is now occupied. Cannot approve.",
      }, { status: 400 });
    }

    // Update request status
    await query(
      `UPDATE reservation_requests 
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), review_note = $2
       WHERE id = $3`,
      [userId, reviewNote, requestId]
    );

    // Create the actual reservation
    const reservationResult = await query(
      `INSERT INTO reservations (user_id, room_id, start_time, end_time, purpose, attendees, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING id`,
      [req.user_id, req.room_id, req.start_time, req.end_time, req.purpose, req.attendees]
    );

    const reservationId = reservationResult.rows[0].id;

    // Get user and room details for email notification
    const detailsResult = await query(
      `SELECT 
        u.email, u.first_name, u.last_name, u.preferred_language,
        r.name as room_name, r.name_en, r.name_hu
       FROM users u, rooms r
       WHERE u.id = $1 AND r.id = $2`,
      [req.user_id, req.room_id]
    );

    if (detailsResult.rows.length > 0) {
      const details = detailsResult.rows[0];
      const userName = `${details.first_name} ${details.last_name}`;
      const language = details.preferred_language || 'en';
      
      // Get language-appropriate room name
      const roomName = language === 'hu' && details.name_hu ? details.name_hu :
                       language === 'en' && details.name_en ? details.name_en :
                       details.room_name;

      // Send confirmation email
      sendReservationConfirmation(
        details.email,
        userName,
        {
          roomName,
          startTime: new Date(req.start_time),
          endTime: new Date(req.end_time),
          purpose: req.purpose || undefined,
        }
      ).catch(err => console.error('Failed to send reservation confirmation email:', err));

      // Create notification
      await query(
        `INSERT INTO notifications (user_id, type, title, message, reservation_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user_id,
          'reservation_confirmed',
          language === 'hu' ? 'Foglalási kérelem jóváhagyva' : 'Reservation Request Approved',
          language === 'hu' 
            ? `Foglalási kérelmed jóváhagyva: ${roomName}`
            : `Your reservation request has been approved: ${roomName}`,
          reservationId
        ]
      );
    }

    return json({ success: true, message: "Request approved and reservation created" });
  }

  if (intent === "reject") {
    const reviewNote = formData.get("reviewNote");

    if (!reviewNote) {
      return json({ success: false, error: "Review note required for rejection" }, { status: 400 });
    }

    // Get request details before updating
    const requestResult = await query(
      `SELECT rr.*, u.email, u.first_name, u.last_name, u.preferred_language
       FROM reservation_requests rr
       JOIN users u ON rr.user_id = u.id
       WHERE rr.id = $1 AND rr.status = 'pending'`,
      [requestId]
    );

    if (requestResult.rows.length > 0) {
      const req = requestResult.rows[0];
      const userName = `${req.first_name} ${req.last_name}`;
      const language = req.preferred_language || 'en';

      // Update request status
      await query(
        `UPDATE reservation_requests 
         SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), review_note = $2
         WHERE id = $3`,
        [userId, reviewNote, requestId]
      );

      // Send rejection email
      sendPermissionRejected(
        req.email,
        userName,
        reviewNote as string,
        language as 'en' | 'hu'
      ).catch(err => console.error('Failed to send rejection email:', err));

      // Create notification
      await query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, $2, $3, $4)`,
        [
          req.user_id,
          'permission_rejected',
          language === 'hu' ? 'Foglalási kérelem elutasítva' : 'Reservation Request Rejected',
          language === 'hu' 
            ? `Foglalási kérelmed elutasításra került: ${reviewNote}`
            : `Your reservation request has been rejected: ${reviewNote}`
        ]
      );
    } else {
      await query(
        `UPDATE reservation_requests 
         SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), review_note = $2
         WHERE id = $3 AND status = 'pending'`,
        [userId, reviewNote, requestId]
      );
    }

    return json({ success: true, message: "Request rejected" });
  }

  return json({ success: false, error: "Invalid intent" }, { status: 400 });
}

export default function AdminPermissionRequests() {
  const { requests } = useLoaderData<typeof loader>();
  const { user } = useOutletContext<any>();
  const { t, i18n } = useTranslation();
  const fetcher = useFetcher();

  const getRoomName = (request: any) => {
    if (i18n.language === 'hu' && request.name_hu) return request.name_hu;
    if (request.name_en) return request.name_en;
    return request.room_name;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(i18n.language === 'hu' ? 'hu-HU' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingRequests = requests.filter((r: any) => r.status === 'pending');
  const processedRequests = requests.filter((r: any) => r.status !== 'pending');

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: '#ffa726', text: t('permissions.pending') },
      approved: { bg: '#66bb6a', text: t('permissions.approved') },
      rejected: { bg: '#ef5350', text: t('permissions.rejected') },
      cancelled: { bg: '#9e9e9e', text: 'Cancelled' }
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span style={{
        background: badge.bg,
        color: 'white',
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.85rem',
        fontWeight: '500'
      }}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="app-container">
      <AnimatedBackground />
      <Header user={user} />
      
      <main className="main-content" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--text-primary)', margin: 0 }}>
            🎓 {t('permissions.pendingRequests')}
          </h1>
          <Link to="/admin" className="btn-secondary">
            ← {t('common.back') || 'Back to Admin'}
          </Link>
        </div>

      {/* Pending Requests */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          ⏳ {t('permissions.pendingRequests')} ({pendingRequests.length})
        </h2>

        {pendingRequests.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            {t('admin.noData') || 'No pending requests'}
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {pendingRequests.map((request: any) => (
              <div key={request.id} className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                      👤 {request.student_name}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                      📧 {request.student_email}
                    </p>
                    <p style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                      🏢 <strong>{t('admin.room')}:</strong> {getRoomName(request)}
                    </p>
                    <p style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                      📅 <strong>{t('admin.startTime')}:</strong> {formatDateTime(request.start_time)}
                    </p>
                    <p style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                      🕐 <strong>{t('admin.endTime')}:</strong> {formatDateTime(request.end_time)}
                    </p>
                    <p style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                      📝 <strong>{t('admin.purpose')}:</strong> {request.purpose || t('reservation.noPurpose')}
                    </p>
                    {request.attendees && (
                      <p style={{ color: 'var(--text-primary)', margin: 0 }}>
                        👥 <strong>{t('reservation.attendees')}:</strong> {request.attendees}
                      </p>
                    )}
                  </div>
                  <div>
                    {getStatusBadge(request.status)}
                  </div>
                </div>

                <fetcher.Form method="post" style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                  <input type="hidden" name="requestId" value={request.id} />
                  
                  <textarea
                    name="reviewNote"
                    placeholder={t('permissions.reviewNote')}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem'
                    }}
                  />

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      type="submit"
                      name="intent"
                      value="approve"
                      className="btn-primary"
                      style={{ flex: 1, background: '#66bb6a' }}
                    >
                      ✅ {t('permissions.approve')}
                    </button>
                    <button
                      type="submit"
                      name="intent"
                      value="reject"
                      className="btn-secondary"
                      style={{ flex: 1, background: '#ef5350', color: 'white' }}
                    >
                      ❌ {t('permissions.reject')}
                    </button>
                  </div>
                </fetcher.Form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Requests */}
      <div className="glass-card">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          📋 {t('admin.processedRequests') || 'Processed Requests'} ({processedRequests.length})
        </h2>

        {processedRequests.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            {t('admin.noData') || 'No processed requests'}
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {processedRequests.map((request: any) => (
              <div key={request.id} className="glass-card" style={{ padding: '1.5rem', opacity: 0.9 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                      👤 {request.student_name} • 🏢 {getRoomName(request)}
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                      📅 {formatDateTime(request.start_time)} → {formatDateTime(request.end_time)}
                    </p>
                    {request.review_note && (
                      <p style={{ color: 'var(--text-primary)', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                        💬 <strong>{t('permissions.reviewNote')}:</strong> {request.review_note}
                      </p>
                    )}
                    {request.reviewer_name && (
                      <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
                        👨‍💼 {t('admin.reviewedBy') || 'Reviewed by'}: {request.reviewer_name}
                      </p>
                    )}
                  </div>
                  <div>
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
