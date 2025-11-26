import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { query } from "~/db.server";
import { requireUserId } from "~/utils/session.server";
import { generateShareToken } from "~/utils/crypto.server";
import { sendReservationConfirmation } from "~/services/email.server";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  
  const formData = await request.formData();
  const roomId = formData.get("roomId");
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");
  const purpose = formData.get("purpose");
  const attendees = formData.get("attendees") || "1";

  if (!roomId || !startTime || !endTime) {
    return json({ 
      success: false, 
      error: "Hiányzó kötelező mezők" 
    }, { status: 400 });
  }

  try {
    // Check user role and permissions
    const userResult = await query(
      "SELECT role FROM users WHERE id = $1",
      [userId]
    );
    const user = userResult.rows[0];

    // Only regular users must request permission
    // Admins and all instructors can book directly
    if (user.role === 'user') {
      return json({
        success: false,
        error: "You must request permission to book rooms. Please contact an administrator."
      }, { status: 403 });
    }

    // Check if instructor has override permission (can override standard instructor bookings)
    let canOverride = false;
    if (user.role === 'instructor') {
      const permissionResult = await query(
        `SELECT can_override_reservations FROM instructor_permissions 
         WHERE user_id = $1 AND revoked = false`,
        [userId]
      );

      if (permissionResult.rows.length > 0) {
        canOverride = permissionResult.rows[0].can_override_reservations || false;
      }
    }

    // At this point, admins and all instructors can proceed

    // Check time limits
    const settingsResult = await query(
      `SELECT setting_key, setting_value FROM system_settings 
       WHERE setting_key IN ('min_reservation_minutes', 'max_reservation_minutes')`
    );
    
    const settings: Record<string, number> = {};
    settingsResult.rows.forEach(row => {
      settings[row.setting_key] = parseInt(row.setting_value);
    });

    const start = new Date(startTime as string);
    const end = new Date(endTime as string);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    const minMinutes = settings.min_reservation_minutes || 30;
    const maxMinutes = settings.max_reservation_minutes || 120;

    if (durationMinutes < minMinutes) {
      return json({
        success: false,
        error: `Reservation must be at least ${minMinutes} minutes`,
      }, { status: 400 });
    }

    if (durationMinutes > maxMinutes) {
      return json({
        success: false,
        error: `Reservation cannot exceed ${maxMinutes} minutes`,
      }, { status: 400 });
    }

    // Ütközés ellenőrzése - van-e már foglalás a kért időpontban
    const conflicts = await query(
      `SELECT r.*, u.role as booker_role, u.email as booker_email,
              u.first_name || ' ' || u.last_name as booker_name
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE r.room_id = $1 
       AND r.status != 'cancelled'
       AND (
         (r.start_time <= $2 AND r.end_time > $2)
         OR (r.start_time < $3 AND r.end_time >= $3)
         OR (r.start_time >= $2 AND r.end_time <= $3)
       )`,
      [roomId, startTime, endTime]
    );

    // If there's a conflict, check override permissions
    if (conflicts.rows.length > 0) {
      const conflictingReservation = conflicts.rows[0];
      const conflictingRole = conflictingReservation.booker_role;
      
      // Only privileged instructors can override standard instructor bookings
      if (user.role === 'instructor' && canOverride && conflictingRole === 'instructor') {
        // Check if the conflicting instructor has override permission
        const conflictPermResult = await query(
          `SELECT can_override_reservations FROM instructor_permissions 
           WHERE user_id = $1 AND revoked = false`,
          [conflictingReservation.user_id]
        );
        
        const conflictHasOverride = conflictPermResult.rows.length > 0 && 
                                   conflictPermResult.rows[0].can_override_reservations;
        
        // Can only override if the conflicting instructor doesn't have override permission
        if (!conflictHasOverride) {
          // Cancel the conflicting reservation
          await query(
            `UPDATE reservations 
             SET status = 'cancelled', canceled_at = NOW()
             WHERE id = $1`,
            [conflictingReservation.id]
          );
          
          // Notify the original booker about the override
          await query(
            `INSERT INTO notifications (user_id, type, title, message, reservation_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              conflictingReservation.user_id,
              'reservation_overridden',
              'Foglalás felülírva / Reservation Overridden',
              `Your reservation has been overridden by a privileged instructor. Room: ${conflictingReservation.room_id}, Time: ${new Date(conflictingReservation.start_time).toLocaleString()}`,
              conflictingReservation.id
            ]
          );
          
          console.log(`✅ Override: Privileged instructor ${userId} cancelled reservation ${conflictingReservation.id} by standard instructor ${conflictingReservation.user_id}`);
        } else {
          // Cannot override another privileged instructor
          return json({
            success: false,
            error: "A terem már foglalt egy másik jogosult előadó által ebben az időszakban"
          }, { status: 400 });
        }
      } else {
        // No override permission, normal conflict error
        return json({
          success: false,
          error: "A terem már foglalt ebben az időszakban"
        }, { status: 400 });
      }
    }

    // Biztonságos megosztási token generálása
    const shareToken = generateShareToken();

    // Foglalás létrehozása
    const reservationResult = await query(
      `INSERT INTO reservations (user_id, room_id, start_time, end_time, purpose, status, attendees, share_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [userId, roomId, startTime, endTime, purpose || "", "confirmed", attendees, shareToken]
    );

    const reservationId = reservationResult.rows[0].id;

    // Get user and room details for email/notification
    const detailsResult = await query(
      `SELECT 
        u.email, u.first_name, u.last_name, u.preferred_language,
        r.name as room_name, r.name_en, r.name_hu
       FROM users u, rooms r
       WHERE u.id = $1 AND r.id = $2`,
      [userId, roomId]
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
          startTime: new Date(startTime as string),
          endTime: new Date(endTime as string),
          purpose: purpose as string || undefined,
        }
      ).catch(err => console.error('Failed to send reservation confirmation email:', err));

      // Create notification
      await query(
        `INSERT INTO notifications (user_id, type, title, message, reservation_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          'reservation_confirmed',
          language === 'hu' ? 'Foglalás megerősítve' : 'Reservation Confirmed',
          language === 'hu' 
            ? `Foglalásod megerősítve: ${roomName}`
            : `Your reservation has been confirmed: ${roomName}`,
          reservationId
        ]
      );
    }

    return json({ success: true });
  } catch (error) {
    console.error("Foglalási hiba:", error);
    return json({
      success: false,
      error: "Foglalás létrehozása sikertelen"
    }, { status: 500 });
  }
}
