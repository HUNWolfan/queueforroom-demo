import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useOutletContext, useFetcher } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { query } from "~/db.server";
import { getUserId } from "~/utils/session.server";
import Header from "~/components/layout/Header";
import AnimatedBackground from "~/components/layout/AnimatedBackground";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const token = params.token;
  
  if (!token) {
    throw new Response("Token not provided", { status: 400 });
  }

  // Get reservation by share token
  const result = await query(
    `SELECT 
      r.id, r.start_time, r.end_time, r.purpose, r.status, r.attendees,
      r.user_id,
      rm.name as room_name, rm.name_en, rm.name_hu, 
      rm.capacity, rm.floor,
      u.first_name || ' ' || u.last_name as owner_name,
      u.email as owner_email
     FROM reservations r
     JOIN rooms rm ON r.room_id = rm.id
     JOIN users u ON r.user_id = u.id
     WHERE r.share_token = $1 AND r.status != 'cancelled'`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new Response("Reservation not found or has been cancelled", { status: 404 });
  }

  const reservation = result.rows[0];

  // Check if user is logged in
  const userId = await getUserId(request);
  
  if (!userId) {
    // Redirect to login with return URL
    return redirect(`/login?redirectTo=/reservations/join/${token}`);
  }

  // Check if reservation is in the future
  const now = new Date();
  const startTime = new Date(reservation.start_time);
  const endTime = new Date(reservation.end_time);
  const isPast = endTime < now;
  const isOngoing = startTime <= now && endTime >= now;
  
  // Check if user already confirmed attendance
  const attendanceCheck = await query(
    `SELECT id FROM reservation_attendees 
     WHERE reservation_id = $1 AND user_id = $2`,
    [reservation.id, userId]
  );

  return json({ 
    reservation,
    token,
    userId,
    hasConfirmed: attendanceCheck.rows.length > 0,
    isPast,
    isOngoing
  });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const token = params.token;
  const userId = await getUserId(request);
  
  if (!userId) {
    return json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get reservation
  const result = await query(
    `SELECT r.id, r.user_id, u.first_name || ' ' || u.last_name as joiner_name
     FROM reservations r
     JOIN users u ON u.id = $2
     WHERE r.share_token = $1 AND r.status != 'cancelled'`,
    [token, userId]
  );

  if (result.rows.length === 0) {
    return json({ error: "Reservation not found" }, { status: 404 });
  }

  const reservation = result.rows[0];
  const reservationId = reservation.id;
  const ownerId = reservation.user_id;
  const joinerName = reservation.joiner_name;

  // Don't let owner confirm their own reservation
  if (userId === ownerId) {
    return json({ success: true, message: "You are the organizer" });
  }

  // Check if already confirmed
  const existing = await query(
    `SELECT id FROM reservation_attendees 
     WHERE reservation_id = $1 AND user_id = $2`,
    [reservationId, userId]
  );

  if (existing.rows.length > 0) {
    return json({ success: true, message: "Already confirmed" });
  }

  // Add attendee record
  await query(
    `INSERT INTO reservation_attendees (reservation_id, user_id, status)
     VALUES ($1, $2, 'confirmed')`,
    [reservationId, userId]
  );

  // Send notification to owner
  await query(
    `INSERT INTO notifications (user_id, type, title, message, reservation_id)
     VALUES ($1, 'attendee_joined', $2, $3, $4)`,
    [
      ownerId,
      'New Attendee Joined',
      `${joinerName} has joined your reservation`,
      reservationId
    ]
  );

  return json({ success: true, message: "Attendance confirmed" });
}

export default function JoinReservation() {
  const { reservation, token, userId, hasConfirmed, isPast, isOngoing } = useLoaderData<typeof loader>();
  const { user } = useOutletContext<any>();
  const { t, i18n } = useTranslation();
  const fetcher = useFetcher();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isOwner = userId === reservation.user_id;

  // Show success modal when attendance is confirmed
  useEffect(() => {
    if (fetcher.data && (fetcher.data as any).success && !isOwner) {
      setShowSuccessModal(true);
    }
  }, [fetcher.data, isOwner]);

  // Auto-confirm attendance when page loads (if not owner and not already confirmed and not past)
  useEffect(() => {
    if (!isOwner && !hasConfirmed && !isPast && fetcher.state === 'idle') {
      fetcher.submit({}, { method: "post" });
    }
  }, [isOwner, hasConfirmed, isPast]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const currentLang = i18n.language;
    
    if (currentLang === 'hu') {
      return date.toLocaleString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      // English with AM/PM
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const getRoomName = () => {
    const currentLang = i18n.language;
    if (currentLang === 'hu' && reservation.name_hu) {
      return reservation.name_hu;
    } else if (currentLang === 'en' && reservation.name_en) {
      return reservation.name_en;
    }
    return reservation.room_name;
  };

  return (
    <div className="app-container">
      <AnimatedBackground />
      <Header user={user} />
      <main className="main-content">
        <div style={{
          maxWidth: '600px',
          margin: '2rem auto',
          padding: '2rem',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-color)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {isOwner 
                ? (t("reservation.yourReservation") || "Your Reservation")
                : (t("reservation.joinInvitation") || "You've Been Invited!")
              }
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              {isOwner
                ? (t("reservation.yourReservationDesc") || "This is your reservation")
                : (t("reservation.joinInvitationDesc") || `${reservation.owner_name} invited you to join this reservation`)
              }
            </p>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                🏢 {getRoomName()}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {t("map.floor") || "Floor"}: {reservation.floor} • {t("map.capacity") || "Capacity"}: {reservation.capacity}
              </p>
            </div>

            <div style={{ 
              background: 'rgba(255,255,255,0.05)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>📅 {t("reservation.startTime") || "Start"}:</strong>
                <div style={{ marginLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                  {formatDateTime(reservation.start_time)}
                </div>
              </div>
              <div>
                <strong>🏁 {t("reservation.endTime") || "End"}:</strong>
                <div style={{ marginLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                  {formatDateTime(reservation.end_time)}
                </div>
              </div>
            </div>

            {reservation.purpose && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>📝 {t("reservation.purpose") || "Purpose"}:</strong>
                <p style={{ marginLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                  {reservation.purpose}
                </p>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <strong>👥 {t("reservation.attendees") || "Attendees"}:</strong>
              <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                {reservation.attendees}
              </span>
            </div>

            <div>
              <strong>👤 {t("reservation.organizer") || "Organized by"}:</strong>
              <p style={{ marginLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                {reservation.owner_name}
              </p>
            </div>
          </div>

          <div style={{
            background: 'rgba(103, 126, 234, 0.2)',
            border: '1px solid rgba(103, 126, 234, 0.4)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {isPast ? (
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#ef5350' }}>
                ⏰ {t("reservation.reservationEnded") || "This reservation has ended"}
              </p>
            ) : isOngoing ? (
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#ff9800' }}>
                ⏳ {t("reservation.reservationOngoing") || "This reservation is currently in progress"}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                {isOwner
                  ? (t("reservation.shareThisLink") || "Share this link with others to invite them")
                  : (t("reservation.saveThisPage") || "Save this page to view reservation details")
                }
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a 
              href="/reservations"
              className="btn-primary"
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              {t("reservation.viewMyReservations") || "View My Reservations"}
            </a>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div 
            className="modal-overlay" 
            onClick={() => setShowSuccessModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div 
              className="modal-content" 
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                padding: '2rem',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                maxWidth: '400px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ marginBottom: '1rem' }}>
                {t("reservation.attendanceConfirmed") || "You're In!"}
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                {t("reservation.attendanceConfirmedDesc") || "You've successfully joined this reservation. The organizer has been notified."}
              </p>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                {t("common.ok") || "OK"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
