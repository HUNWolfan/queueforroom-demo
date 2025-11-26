import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext, useFetcher } from "@remix-run/react";
import { requireUserId } from "~/utils/session.server";
import { query } from "~/db.server";
import { sendReservationInvite, sendReservationCancelled, sendReservationUpdated } from "~/services/email.server";
import Header from "~/components/layout/Header";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import DateTimePicker from "~/components/common/DateTimePicker";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Get current user's role
  const currentUserResult = await query(
    `SELECT role FROM users WHERE id = $1`,
    [userId]
  );
  const currentUserRole = currentUserResult.rows[0]?.role;

  // Foglalások lekérése - kiszűrjük a 24 órán túl befejezett és az 1 órán túl törölt foglalásokat
  const result = await query(
    `SELECT 
      r.id, r.start_time, r.end_time, r.purpose, r.status, r.created_at, 
      r.attendees, r.canceled_at, r.room_id, r.share_token,
      rm.name as room_name, rm.name_en as room_name_en, rm.name_hu as room_name_hu, 
      rm.capacity, rm.floor,
      (1 + (SELECT COUNT(*) FROM reservation_attendees ra WHERE ra.reservation_id = r.id AND ra.status = 'confirmed')) as confirmed_count,
      (SELECT COUNT(*) FROM reservation_invites ri WHERE ri.reservation_id = r.id) as invited_count
     FROM reservations r
     JOIN rooms rm ON r.room_id = rm.id
     WHERE r.user_id = $1
     AND (
       (r.status != 'cancelled' OR r.canceled_at IS NULL OR r.canceled_at > NOW() - INTERVAL '1 hour')
       AND (r.end_time > NOW() - INTERVAL '24 hours')
     )
     ORDER BY r.start_time DESC`,
    [userId]
  );

  // Permission requests lekérése (csak student/user role-ok számára)
  let permissionRequests = [];
  if (currentUserRole === 'student' || currentUserRole === 'user') {
    const requestsResult = await query(
      `SELECT 
        rr.id, rr.start_time, rr.end_time, rr.purpose, rr.status, rr.created_at,
        rr.attendees, rr.room_id, rr.reviewed_at,
        rm.name as room_name, rm.name_en as room_name_en, rm.name_hu as room_name_hu,
        rm.capacity, rm.floor,
        u.first_name || ' ' || u.last_name as reviewed_by_name
       FROM reservation_requests rr
       JOIN rooms rm ON rr.room_id = rm.id
       LEFT JOIN users u ON rr.reviewed_by = u.id
       WHERE rr.user_id = $1
       ORDER BY rr.created_at DESC`,
      [userId]
    );
    permissionRequests = requestsResult.rows;
  }

  // Felhasználók lekérése meghíváshoz (jelenlegi felhasználó nélkül)
  // Admin-ok csak adminok számára láthatók
  let userQuery = `SELECT id, first_name, last_name, email, role 
                   FROM users 
                   WHERE id != $1`;
  
  if (currentUserRole !== 'admin') {
    userQuery += ` AND role != 'admin'`;
  }
  
  userQuery += ` ORDER BY first_name, last_name`;
  
  const usersResult = await query(userQuery, [userId]);

  return json({ 
    reservations: result.rows,
    permissionRequests,
    currentUserRole,
    users: usersResult.rows 
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Foglalás törlése
  if (intent === "cancel") {
    const reservationId = formData.get("reservationId");

    // Foglalás tulajdonosának ellenőrzése
    const checkResult = await query(
      'SELECT user_id FROM reservations WHERE id = $1',
      [reservationId]
    );

    if (checkResult.rows.length === 0) {
      return json({ error: "Foglalás nem található" }, { status: 404 });
    }

    const isOwner = checkResult.rows[0].user_id === userId;

    // Ha nem a tulajdonos, akkor ellenőrizzük a jogosultságokat
    if (!isOwner) {
      // Get user role and permissions
      const userResult = await query(
        `SELECT u.role, ip.can_override_reservations 
         FROM users u
         LEFT JOIN instructor_permissions ip ON u.id = ip.user_id
         WHERE u.id = $1`,
        [userId]
      );

      const user = userResult.rows[0];

      // Admin can always cancel
      if (user.role !== 'admin') {
        // Instructor needs override permission
        if (user.role === 'instructor') {
          if (!user.can_override_reservations) {
            return json({ 
              error: "Nincs jogosultságod más foglalásainak törléséhez" 
            }, { status: 403 });
          }
        } else {
          // Regular users cannot cancel others' reservations
          return json({ 
            error: "Nincs jogosultság" 
          }, { status: 403 });
        }
      }
    }

    await query(
      `UPDATE reservations 
       SET status = 'cancelled', canceled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [reservationId]
    );

    // Get reservation and user details for email notification
    const detailsResult = await query(
      `SELECT 
        u.email, u.first_name, u.last_name, u.preferred_language,
        r.name as room_name, r.name_en, r.name_hu,
        res.start_time, res.end_time, res.purpose
       FROM reservations res
       JOIN users u ON res.user_id = u.id
       JOIN rooms r ON res.room_id = r.id
       WHERE res.id = $1`,
      [reservationId]
    );

    if (detailsResult.rows.length > 0) {
      const details = detailsResult.rows[0];
      const userName = `${details.first_name} ${details.last_name}`;
      const language = details.preferred_language || 'en';
      
      // Get language-appropriate room name
      const roomName = language === 'hu' && details.name_hu ? details.name_hu :
                       language === 'en' && details.name_en ? details.name_en :
                       details.room_name;

      // Csak akkor küldünk emailt és értesítést, ha a foglalás még nem ért véget
      const hasEnded = new Date(details.end_time) < new Date();
      
      if (!hasEnded) {
        // Send cancellation email
        sendReservationCancelled(
          details.email,
          userName,
          {
            roomName,
            startTime: new Date(details.start_time),
            endTime: new Date(details.end_time),
            purpose: details.purpose || undefined,
          },
          language as 'en' | 'hu'
        ).catch(err => console.error('Failed to send cancellation email:', err));

        // Create notification
        await query(
          `INSERT INTO notifications (user_id, type, title, message, reservation_id)
           VALUES ((SELECT user_id FROM reservations WHERE id = $1), $2, $3, $4, $1)`,
          [
            reservationId,
            'reservation_cancelled',
            language === 'hu' ? 'Foglalás törölve' : 'Reservation Cancelled',
            language === 'hu' 
              ? `Foglalásod törölve: ${roomName}`
              : `Your reservation has been cancelled: ${roomName}`
          ]
        );
      }
    }

    return json({ success: true, message: "Foglalás törölve" });
  }

  // Felhasználók meghívása foglaláshoz
  if (intent === "invite") {
    const reservationId = formData.get("reservationId");
    const userIdsString = formData.get("userIds");

    if (!userIdsString || !reservationId) {
      return json({ error: "Hiányzó adatok" }, { status: 400 });
    }

    const userIds = (userIdsString as string).split(',').map(id => parseInt(id.trim()));

    // Get reservation details
    const resResult = await query(
      `SELECT r.*, rm.name as room_name, rm.name_en, rm.name_hu, 
              u.first_name as owner_first_name, u.last_name as owner_last_name,
              u.preferred_language as owner_language
       FROM reservations r
       JOIN rooms rm ON r.room_id = rm.id
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [reservationId]
    );

    if (resResult.rows.length === 0) {
      return json({ error: "Foglalás nem található" }, { status: 404 });
    }

    const reservation = resResult.rows[0];
    const ownerName = `${reservation.owner_first_name} ${reservation.owner_last_name}`;
    const baseUrl = new URL(request.url).origin;

    // Get invited users' details
    const usersResult = await query(
      `SELECT id, first_name, last_name, email, preferred_language
       FROM users
       WHERE id = ANY($1::int[])`,
      [userIds]
    );

    // Send emails and create notifications for each invited user
    for (const invitee of usersResult.rows) {
      const inviteeName = `${invitee.first_name} ${invitee.last_name}`;
      const language = invitee.preferred_language || 'en';
      
      // Send invitation email
      sendReservationInvite(
        invitee.email,
        ownerName,
        inviteeName,
        {
          roomName: language === 'hu' && reservation.name_hu ? reservation.name_hu : 
                    language === 'en' && reservation.name_en ? reservation.name_en : 
                    reservation.room_name,
          startTime: new Date(reservation.start_time),
          endTime: new Date(reservation.end_time),
          purpose: reservation.purpose,
        },
        baseUrl,
        language as 'en' | 'hu'
      ).catch(err => console.error('Failed to send invitation email:', err));

      // Create notification
      await query(
        `INSERT INTO notifications (user_id, type, title, message, reservation_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          invitee.id,
          'reservation_invite',
          language === 'hu' ? 'Új foglalási meghívó' : 'New Reservation Invitation',
          language === 'hu' 
            ? `${ownerName} meghívott téged egy teremfoglaláshoz` 
            : `${ownerName} invited you to a room reservation`,
          reservationId
        ]
      );
    }
    
    return json({ 
      success: true, 
      message: `${userIds.length} felhasználó sikeresen meghívva` 
    });
  }

  // Foglalás módosítása
  if (intent === "update") {
    const reservationId = formData.get("reservationId");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");
    const purpose = formData.get("purpose");
    const attendees = formData.get("attendees");

    // Tulajdonjog ellenőrzése
    const checkResult = await query(
      'SELECT user_id, room_id FROM reservations WHERE id = $1',
      [reservationId]
    );

    if (checkResult.rows.length === 0) {
      return json({ error: "Foglalás nem található" }, { status: 404 });
    }

    const isOwner = checkResult.rows[0].user_id === userId;

    // Ha nem a tulajdonos, ellenőrizzük a jogosultságokat
    if (!isOwner) {
      // Get user role and permissions
      const userResult = await query(
        `SELECT u.role, ip.can_override_reservations 
         FROM users u
         LEFT JOIN instructor_permissions ip ON u.id = ip.user_id
         WHERE u.id = $1`,
        [userId]
      );

      const user = userResult.rows[0];

      // Admin can always modify
      if (user.role !== 'admin') {
        // Instructor needs override permission
        if (user.role === 'instructor') {
          if (!user.can_override_reservations) {
            return json({ 
              error: "Nincs jogosultságod más foglalásainak módosításához" 
            }, { status: 403 });
          }
        } else {
          // Regular users cannot modify others' reservations
          return json({ 
            error: "Nincs jogosultság" 
          }, { status: 403 });
        }
      }
    }

    // Ütközés ellenőrzése (kivéve a jelenlegi foglalást)
    const conflicts = await query(
      `SELECT * FROM reservations 
       WHERE room_id = $1 
       AND id != $2
       AND status != 'cancelled'
       AND (
         (start_time <= $3 AND end_time > $3)
         OR (start_time < $4 AND end_time >= $4)
         OR (start_time >= $3 AND end_time <= $4)
       )`,
      [checkResult.rows[0].room_id, reservationId, startTime, endTime]
    );

    if (conflicts.rows.length > 0) {
      return json({
        error: "A terem már foglalt ebben az időszakban"
      }, { status: 400 });
    }

    await query(
      `UPDATE reservations 
       SET start_time = $1, end_time = $2, purpose = $3, attendees = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5`,
      [startTime, endTime, purpose, attendees, reservationId]
    );

    // Get reservation and user details for email notification
    const detailsResult = await query(
      `SELECT 
        u.email, u.first_name, u.last_name, u.preferred_language,
        r.name as room_name, r.name_en, r.name_hu,
        res.start_time, res.end_time, res.purpose
       FROM reservations res
       JOIN users u ON res.user_id = u.id
       JOIN rooms r ON res.room_id = r.id
       WHERE res.id = $1`,
      [reservationId]
    );

    if (detailsResult.rows.length > 0) {
      const details = detailsResult.rows[0];
      const userName = `${details.first_name} ${details.last_name}`;
      const language = details.preferred_language || 'en';
      
      // Get language-appropriate room name
      const roomName = language === 'hu' && details.name_hu ? details.name_hu :
                       language === 'en' && details.name_en ? details.name_en :
                       details.room_name;

      // Send update email
      sendReservationUpdated(
        details.email,
        userName,
        {
          roomName,
          startTime: new Date(details.start_time),
          endTime: new Date(details.end_time),
          purpose: details.purpose || undefined,
        },
        language as 'en' | 'hu'
      ).catch(err => console.error('Failed to send update email:', err));

      // Create notification
      await query(
        `INSERT INTO notifications (user_id, type, title, message, reservation_id)
         VALUES ((SELECT user_id FROM reservations WHERE id = $1), $2, $3, $4, $1)`,
        [
          reservationId,
          'reservation_updated',
          language === 'hu' ? 'Foglalás módosítva' : 'Reservation Updated',
          language === 'hu' 
            ? `Foglalásod módosítva: ${roomName}`
            : `Your reservation has been updated: ${roomName}`
        ]
      );
    }

    return json({ success: true, message: "Foglalás sikeresen módosítva" });
  }

  return json({ error: "Érvénytelen művelet" }, { status: 400 });
}

export default function Reservations() {
  const { reservations, permissionRequests, currentUserRole, users } = useLoaderData<typeof loader>();
  const { user } = useOutletContext<any>();
  const { t, i18n } = useTranslation();
  const fetcher = useFetcher();
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [editDetails, setEditDetails] = useState({
    startTime: "",
    endTime: "",
    purpose: "",
    attendees: 1,
  });

  // Helper function to get room name based on current language
  const getRoomName = (reservation: any) => {
    const isHungarian = i18n.language === 'hu';
    if (isHungarian && reservation.room_name_hu) {
      return reservation.room_name_hu;
    }
    if (!isHungarian && reservation.room_name_en) {
      return reservation.room_name_en;
    }
    return reservation.room_name; // Fallback to default name
  };

  // Helper function to check if reservation has ended
  const hasReservationEnded = (reservation: any) => {
    return new Date(reservation.end_time) < new Date();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const currentLang = i18n.language;
    
    if (currentLang === 'hu') {
      // Hungarian: 24-hour format
      return date.toLocaleString('hu-HU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      // English: AM/PM format
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  // Round time to nearest 15-minute interval
  const roundToQuarterHour = (date: Date) => {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    const newDate = new Date(date);
    newDate.setMinutes(roundedMinutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    return newDate;
  };

  // Get minimum datetime (current time rounded to next 15-min interval) for date inputs
  const getMinDateTime = () => {
    const now = roundToQuarterHour(new Date());
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleCancelReservation = (reservationId: number) => {
    if (confirm(t("reservation.confirmCancel") || "Are you sure you want to cancel this reservation?")) {
      fetcher.submit(
        { intent: "cancel", reservationId: reservationId.toString() },
        { method: "post" }
      );
    }
  };

  const handleInviteUser = (reservation: any) => {
    setSelectedReservation(reservation);
    setSelectedUserIds(new Set()); // Reset selection
    setSearchTerm(""); // Reset search
    setShowInviteModal(true);
  };

  // Filter users based on search term
  const filteredUsers = users.filter((u: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    const email = u.email.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const submitInvites = () => {
    if (selectedUserIds.size === 0) {
      setAlertMessage(t("reservation.selectAtLeastOne") || "Please select at least one user to invite");
      setShowAlertModal(true);
      return;
    }

    fetcher.submit(
      { 
        intent: "invite", 
        reservationId: selectedReservation.id.toString(),
        userIds: Array.from(selectedUserIds).join(',')
      },
      { method: "post" }
    );
    setShowInviteModal(false);
    setSelectedUserIds(new Set());
  };

  const handleGenerateLink = (reservation: any) => {
    // Ellenőrizzük, hogy létezik-e a share_token
    if (!reservation.share_token) {
      setAlertMessage(t("reservation.noShareToken") || "Ez a foglalás nem rendelkezik megosztási linkkel. Kérjük, frissítse az oldalt!");
      setShowAlertModal(true);
      return;
    }
    
    // Biztonságos, titkosított link generálása share_token alapján
    const link = `${window.location.origin}/reservations/join/${reservation.share_token}`;
    setInviteLink(link);
    setSelectedReservation(reservation);
    setShowLinkModal(true);
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setAlertMessage(t("reservation.linkCopied") || "Link copied to clipboard!");
    setShowAlertModal(true);
  };

  const handleEditReservation = (reservation: any) => {
    setSelectedReservation(reservation);
    
    // Format datetime for input with 15-minute rounding
    const formatForInput = (dateString: string) => {
      const date = new Date(dateString);
      
      // Round to 15-minute intervals
      const minutes = date.getMinutes();
      const roundedMinutes = Math.ceil(minutes / 15) * 15;
      date.setMinutes(roundedMinutes);
      date.setSeconds(0);
      date.setMilliseconds(0);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${mins}`;
    };

    setEditDetails({
      startTime: formatForInput(reservation.start_time),
      endTime: formatForInput(reservation.end_time),
      purpose: reservation.purpose || "",
      attendees: reservation.attendees || 1,
    });
    setShowEditModal(true);
  };

  const submitEdit = () => {
    fetcher.submit(
      {
        intent: "update",
        reservationId: selectedReservation.id.toString(),
        startTime: editDetails.startTime,
        endTime: editDetails.endTime,
        purpose: editDetails.purpose,
        attendees: editDetails.attendees.toString(),
      },
      { method: "post" }
    );
    setShowEditModal(false);
  };

  return (
    <div className="app-container">
      <Header user={user} />
      
      <main className="main-content">
        <div className="reservations-container">
          <h1>{t("nav.reservations")}</h1>
          
          {/* Permission Requests Section - csak student/user role-oknak */}
          {(currentUserRole === 'student' || currentUserRole === 'user') && permissionRequests && permissionRequests.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                📋 {t("permissions.myRequests") || "My Permission Requests"}
              </h2>
              <div className="reservations-grid">
                {permissionRequests.map((request: any) => (
                  <div key={`request-${request.id}`} className="reservation-card">
                    <h3>{getRoomName(request)}</h3>
                    <p><strong>{t("map.floor") || "Floor"}:</strong> {request.floor}</p>
                    <p><strong>{t("map.capacity") || "Capacity"}:</strong> {request.capacity}</p>
                    <p><strong>{t("reservation.startTime") || "Start"}:</strong> {formatDateTime(request.start_time)}</p>
                    <p><strong>{t("reservation.endTime") || "End"}:</strong> {formatDateTime(request.end_time)}</p>
                    {request.attendees && (
                      <p><strong>{t("reservation.attendees") || "Attendees"}:</strong> {request.attendees}</p>
                    )}
                    {request.purpose && (
                      <p><strong>{t("reservation.purpose") || "Purpose"}:</strong> {request.purpose}</p>
                    )}
                    
                    {/* Status Badge with Colors */}
                    <span 
                      className={`reservation-status`}
                      style={{
                        background: request.status === 'approved' 
                          ? '#4ade80' 
                          : request.status === 'rejected' 
                          ? '#ef4444' 
                          : '#fbbf24',
                        color: '#ffffff',
                        fontWeight: 'bold'
                      }}
                    >
                      {request.status === 'pending' && '⏳ '}
                      {request.status === 'approved' && '✅ '}
                      {request.status === 'rejected' && '❌ '}
                      {t(`permissions.${request.status}`) || request.status.toUpperCase()}
                    </span>
                    
                    {request.reviewed_by_name && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        <strong>{t("admin.reviewedBy") || "Reviewed by"}:</strong> {request.reviewed_by_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmed Reservations Section */}
          {reservations.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                ✅ {t("dashboard.myReservations") || "My Reservations"}
              </h2>
              <div className="reservations-grid">
                {reservations.map((reservation: any) => (
                <div key={reservation.id} className="reservation-card">
                  <h3>{getRoomName(reservation)}</h3>
                  <p><strong>{t("map.floor") || "Floor"}:</strong> {reservation.floor}</p>
                  <p><strong>{t("map.capacity") || "Capacity"}:</strong> {reservation.capacity}</p>
                  <p><strong>{t("reservation.startTime") || "Start"}:</strong> {formatDateTime(reservation.start_time)}</p>
                  <p><strong>{t("reservation.endTime") || "End"}:</strong> {formatDateTime(reservation.end_time)}</p>
                  {reservation.attendees && (
                    <p><strong>{t("reservation.attendees") || "Attendees"}:</strong> {reservation.attendees}</p>
                  )}
                  
                  {/* Show confirmed attendees and invites */}
                  <p style={{ 
                    background: 'rgba(103, 126, 234, 0.1)', 
                    padding: '0.5rem', 
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    marginTop: '0.5rem'
                  }}>
                    <strong>👥 {t("reservation.participation") || "Participation"}:</strong><br/>
                    <span style={{ color: '#4ade80' }}>
                      ✓ {reservation.confirmed_count} {t("reservation.confirmed") || "confirmed"}
                    </span>
                    {" • "}
                    <span style={{ color: '#fbbf24' }}>
                      ✉️ {reservation.invited_count || 0} {t("reservation.invited") || "invited"}
                    </span>
                  </p>
                  
                  {reservation.purpose && (
                    <p><strong>{t("reservation.purpose") || "Purpose"}:</strong> {reservation.purpose}</p>
                  )}
                  
                  {/* Status badge */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`reservation-status ${reservation.status}`}>
                      {t(`reservation.status.${reservation.status}`) || reservation.status}
                    </span>
                    
                    {/* Ended badge */}
                    {hasReservationEnded(reservation) && (
                      <span 
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: 'rgba(156, 163, 175, 0.3)',
                          color: 'rgba(156, 163, 175, 1)',
                          border: '1px solid rgba(156, 163, 175, 0.5)',
                        }}
                      >
                        ⏱️ {t("reservation.ended") || "Ended"}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {reservation.status !== 'cancelled' && (
                    <div className="reservation-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        className="btn-secondary"
                        onClick={() => handleEditReservation(reservation)}
                        disabled={hasReservationEnded(reservation)}
                        style={{ 
                          fontSize: '0.875rem', 
                          padding: '0.4rem 0.8rem',
                          opacity: hasReservationEnded(reservation) ? 0.5 : 1,
                          cursor: hasReservationEnded(reservation) ? 'not-allowed' : 'pointer',
                          filter: hasReservationEnded(reservation) ? 'grayscale(100%)' : 'none',
                        }}
                      >
                        ✏️ {t("reservation.edit") || "Edit"}
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={() => handleInviteUser(reservation)}
                        disabled={hasReservationEnded(reservation)}
                        style={{ 
                          fontSize: '0.875rem', 
                          padding: '0.4rem 0.8rem',
                          opacity: hasReservationEnded(reservation) ? 0.5 : 1,
                          cursor: hasReservationEnded(reservation) ? 'not-allowed' : 'pointer',
                          filter: hasReservationEnded(reservation) ? 'grayscale(100%)' : 'none',
                        }}
                      >
                        👥 {t("reservation.inviteUser") || "Invite User"}
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={() => handleGenerateLink(reservation)}
                        disabled={hasReservationEnded(reservation)}
                        style={{ 
                          fontSize: '0.875rem', 
                          padding: '0.4rem 0.8rem',
                          opacity: hasReservationEnded(reservation) ? 0.5 : 1,
                          cursor: hasReservationEnded(reservation) ? 'not-allowed' : 'pointer',
                          filter: hasReservationEnded(reservation) ? 'grayscale(100%)' : 'none',
                        }}
                      >
                        🔗 {t("reservation.generateLink") || "Get Link"}
                      </button>
                      <button 
                        className="btn-danger"
                        onClick={() => handleCancelReservation(reservation.id)}
                        style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}
                      >
                        ❌ {t("reservation.cancel") || "Cancel"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              </div>
            </>
          )}

          {/* Empty state - csak ha nincs semmi */}
          {reservations.length === 0 && (!permissionRequests || permissionRequests.length === 0) && (
            <div className="no-reservations">
              <p>{t("reservations.noReservations") || "You don't have any reservations yet."}</p>
              <a href="/map" className="btn-primary" style={{ marginTop: '1rem' }}>
                {t("reservations.makeReservation") || "Make a Reservation"}
              </a>
            </div>
          )}

          {/* Invite User Modal */}
          {showInviteModal && selectedReservation && (
            <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{t("reservation.inviteUsers") || "Invite Users"}</h2>
                  <button className="modal-close" onClick={() => setShowInviteModal(false)}>
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <p style={{ marginBottom: '1rem' }}>
                    <strong>{t("reservation.inviteTo") || "Invite to"}:</strong> {getRoomName(selectedReservation)}
                  </p>
                  <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                    {formatDateTime(selectedReservation.start_time)} - {formatDateTime(selectedReservation.end_time)}
                  </p>
                  
                  {/* Search box */}
                  <div style={{ marginBottom: '1rem' }}>
                    <input
                      type="text"
                      placeholder={t("reservation.searchUsers") || "Search by name or email..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '1px solid rgba(103, 126, 234, 0.5)';
                        e.target.style.background = 'rgba(255,255,255,0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1px solid rgba(255,255,255,0.2)';
                        e.target.style.background = 'rgba(255,255,255,0.1)';
                      }}
                    />
                  </div>
                  
                  <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                    {t("reservation.selectUsers") || "Select users to invite"} ({selectedUserIds.size} {t("reservation.selected") || "selected"}):
                    {filteredUsers.length < users.length && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        ({filteredUsers.length} / {users.length} {t("reservation.shown") || "shown"})
                      </span>
                    )}
                  </p>
                  
                  <div className="user-list" style={{ 
                    marginBottom: '1rem',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                  }}>
                    {filteredUsers.length === 0 ? (
                      <p style={{ 
                        textAlign: 'center', 
                        padding: '2rem', 
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '0.9rem',
                      }}>
                        {t("reservation.noUsersFound") || "No users found"}
                      </p>
                    ) : (
                      filteredUsers.map((u: any) => {
                      const isSelected = selectedUserIds.has(u.id);
                      return (
                        <div 
                          key={u.id} 
                          className="user-item"
                          style={{
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            background: isSelected ? 'rgba(103, 126, 234, 0.3)' : 'rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: isSelected ? '2px solid rgba(103, 126, 234, 0.8)' : '1px solid rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                          }}
                          onClick={() => toggleUserSelection(u.id)}
                        >
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {}} 
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#677eea',
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500' }}>{u.first_name} {u.last_name}</div>
                            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>{u.email}</div>
                          </div>
                        </div>
                      );
                    })
                    )}
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setShowInviteModal(false)}>
                    {t("common.cancel")}
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={submitInvites}
                    disabled={selectedUserIds.size === 0}
                    style={{
                      opacity: selectedUserIds.size === 0 ? 0.5 : 1,
                      cursor: selectedUserIds.size === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {t("reservation.inviteSelected") || `Invite ${selectedUserIds.size} user(s)`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Share Link Modal */}
          {showLinkModal && inviteLink && (
            <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{t("reservation.shareLink") || "Share Link"}</h2>
                  <button className="modal-close" onClick={() => setShowLinkModal(false)}>
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <p style={{ marginBottom: '1rem' }}>
                    {t("reservation.shareLinkDesc") || "Share this link with others to invite them to your reservation"}:
                  </p>
                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '1rem',
                    borderRadius: '8px',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}>
                    {inviteLink}
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setShowLinkModal(false)}>
                    {t("common.cancel")}
                  </button>
                  <button className="btn-confirm" onClick={copyLinkToClipboard}>
                    📋 {t("reservation.copyLink") || "Copy Link"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Reservation Modal */}
          {showEditModal && selectedReservation && (
            <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{t("reservation.edit") || "Edit Reservation"}</h2>
                  <button className="modal-close" onClick={() => setShowEditModal(false)}>
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <p style={{ marginBottom: '1rem' }}>
                    <strong>{t("map.room") || "Room"}:</strong> {getRoomName(selectedReservation)}
                  </p>
                  <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <strong>{t("map.capacity") || "Capacity"}:</strong> {selectedReservation.capacity}
                  </p>

                  <div className="form-group">
                    <label>{t("reservation.startTime") || "Start Time"}</label>
                    <DateTimePicker
                      value={editDetails.startTime}
                      min={getMinDateTime()}
                      step="900"
                      onChange={(value) => setEditDetails({ ...editDetails, startTime: value })}
                      onBlur={(value) => {
                        const selectedTime = new Date(value);
                        const now = new Date();
                        
                        // Check if selected time is in the past
                        if (selectedTime < now) {
                          // Reset to current time rounded to next 15-min interval
                          const roundedNow = new Date(now);
                          const minutes = roundedNow.getMinutes();
                          const roundedMinutes = Math.ceil(minutes / 15) * 15;
                          roundedNow.setMinutes(roundedMinutes);
                          roundedNow.setSeconds(0);
                          roundedNow.setMilliseconds(0);
                          
                          const year = roundedNow.getFullYear();
                          const month = String(roundedNow.getMonth() + 1).padStart(2, '0');
                          const day = String(roundedNow.getDate()).padStart(2, '0');
                          const hours = String(roundedNow.getHours()).padStart(2, '0');
                          const mins = String(roundedNow.getMinutes()).padStart(2, '0');
                          const resetValue = `${year}-${month}-${day}T${hours}:${mins}`;
                          
                          setEditDetails({ ...editDetails, startTime: resetValue });
                          setAlertMessage(t("reservation.noPastDates") || "Cannot select past dates. Reset to current time.");
                          setShowAlertModal(true);
                        }
                      }}
                      className="modern-datetime-input"
                    />
                    <small style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginTop: '0.25rem' }}>
                      {t("reservation.quarterHourOnly") || "Only 15-minute intervals"}
                    </small>
                  </div>

                  <div className="form-group">
                    <label>{t("reservation.endTime") || "End Time"}</label>
                    <DateTimePicker
                      value={editDetails.endTime}
                      min={editDetails.startTime || getMinDateTime()}
                      step="900"
                      onChange={(value) => setEditDetails({ ...editDetails, endTime: value })}
                      onBlur={(value) => {
                        const selectedTime = new Date(value);
                        const now = new Date();
                        
                        // Check if selected time is in the past
                        if (selectedTime < now) {
                          // Reset to current time + 1 hour, rounded to next 15-min interval
                          const roundedNow = new Date(now.getTime() + 60 * 60 * 1000);
                          const minutes = roundedNow.getMinutes();
                          const roundedMinutes = Math.ceil(minutes / 15) * 15;
                          roundedNow.setMinutes(roundedMinutes);
                          roundedNow.setSeconds(0);
                          roundedNow.setMilliseconds(0);
                          
                          const year = roundedNow.getFullYear();
                          const month = String(roundedNow.getMonth() + 1).padStart(2, '0');
                          const day = String(roundedNow.getDate()).padStart(2, '0');
                          const hours = String(roundedNow.getHours()).padStart(2, '0');
                          const mins = String(roundedNow.getMinutes()).padStart(2, '0');
                          const resetValue = `${year}-${month}-${day}T${hours}:${mins}`;
                          
                          setEditDetails({ ...editDetails, endTime: resetValue });
                          setAlertMessage(t("reservation.noPastDates") || "Cannot select past dates. Reset to current time.");
                          setShowAlertModal(true);
                        }
                      }}
                      className="modern-datetime-input"
                    />
                    <small style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginTop: '0.25rem' }}>
                      {t("reservation.quarterHourOnly") || "Only 15-minute intervals"}
                    </small>
                  </div>

                  <div className="form-group">
                    <label>{t("reservation.attendees") || "Number of Attendees"}</label>
                    <div className="attendees-selector">
                      <button
                        type="button"
                        className="attendees-btn decrease"
                        onClick={() => {
                          const newValue = Math.max(1, editDetails.attendees - 1);
                          setEditDetails({ ...editDetails, attendees: newValue });
                        }}
                        disabled={editDetails.attendees <= 1}
                        aria-label="Decrease attendees"
                      >
                        ➖
                      </button>
                      <div className="attendees-display">
                        <span className="attendees-value">{editDetails.attendees}</span>
                        <small className="attendees-max">/ {selectedReservation.capacity}</small>
                      </div>
                      <button
                        type="button"
                        className="attendees-btn increase"
                        onClick={() => {
                          const newValue = Math.min(selectedReservation.capacity, editDetails.attendees + 1);
                          setEditDetails({ ...editDetails, attendees: newValue });
                        }}
                        disabled={editDetails.attendees >= selectedReservation.capacity}
                        aria-label="Increase attendees"
                      >
                        ➕
                      </button>
                    </div>
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block', textAlign: 'center' }}>
                      {t("reservation.maxCapacity") || "Max"}: {selectedReservation.capacity}
                    </small>
                  </div>

                  <div className="form-group">
                    <label>{t("reservation.purpose") || "Purpose"}</label>
                    <input
                      type="text"
                      value={editDetails.purpose}
                      onChange={(e) => setEditDetails({ ...editDetails, purpose: e.target.value })}
                      placeholder={t("reservation.purposePlaceholder") || "e.g., Team meeting, Study session"}
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setShowEditModal(false)}>
                    {t("common.cancel")}
                  </button>
                  <button className="btn-confirm" onClick={submitEdit}>
                    💾 {t("common.save") || "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Alert Modal */}
          {showAlertModal && (
            <div 
              className="modal-overlay" 
              onClick={() => setShowAlertModal(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001,
                animation: 'fadeIn 0.2s ease-in-out',
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
                  width: '90%',
                  textAlign: 'center',
                  animation: 'slideInDown 0.3s ease-out',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                  {alertMessage.includes('copied') || alertMessage.includes('másol') ? '📋' : '⚠️'}
                </div>
                <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  {alertMessage}
                </p>
                <button 
                  onClick={() => setShowAlertModal(false)}
                  className="btn-primary"
                  style={{ width: '100%' }}
                >
                  {t("common.ok") || "OK"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
