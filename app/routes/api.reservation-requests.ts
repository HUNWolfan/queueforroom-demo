import { json, type ActionFunctionArgs } from "@remix-run/node";
import { query } from "~/db.server";
import { requireUserId } from "~/utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Get user info to check role
  const userResult = await query(
    "SELECT role FROM users WHERE id = $1",
    [userId]
  );
  const user = userResult.rows[0];

  if (intent === "create") {
    // Only users and students (not instructors or admins) can request permission
    if (user.role !== "user" && user.role !== "student") {
      return json({ 
        success: false, 
        error: "Only regular users can request permission" 
      }, { status: 403 });
    }

    const roomId = formData.get("roomId");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");
    const purpose = formData.get("purpose");
    const attendees = formData.get("attendees");

    if (!roomId || !startTime || !endTime || !purpose) {
      return json({ 
        success: false, 
        error: "Missing required fields" 
      }, { status: 400 });
    }

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

    // Check for conflicts
    const conflictResult = await query(
      `SELECT id FROM reservations 
       WHERE room_id = $1 
       AND status != 'cancelled'
       AND (
         (start_time <= $2 AND end_time > $2) OR
         (start_time < $3 AND end_time >= $3) OR
         (start_time >= $2 AND end_time <= $3)
       )`,
      [roomId, startTime, endTime]
    );

    if (conflictResult.rows.length > 0) {
      return json({
        success: false,
        error: "Time slot already reserved",
      }, { status: 400 });
    }

    // Check for existing pending request
    const existingRequest = await query(
      `SELECT id FROM reservation_requests 
       WHERE user_id = $1 AND room_id = $2 AND status = 'pending'
       AND start_time = $3 AND end_time = $4`,
      [userId, roomId, startTime, endTime]
    );

    if (existingRequest.rows.length > 0) {
      return json({
        success: false,
        error: "You already have a pending request for this time slot",
      }, { status: 400 });
    }

    // Create permission request
    await query(
      `INSERT INTO reservation_requests 
       (user_id, room_id, start_time, end_time, purpose, attendees, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [userId, roomId, startTime, endTime, purpose, attendees || null]
    );

    return json({ 
      success: true, 
      message: "Permission request submitted successfully" 
    });
  }

  if (intent === "cancel") {
    const requestId = formData.get("requestId");
    
    if (!requestId) {
      return json({ 
        success: false, 
        error: "Request ID required" 
      }, { status: 400 });
    }

    // Only allow cancelling your own requests
    const result = await query(
      `UPDATE reservation_requests 
       SET status = 'cancelled' 
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING id`,
      [requestId, userId]
    );

    if (result.rows.length === 0) {
      return json({ 
        success: false, 
        error: "Request not found or cannot be cancelled" 
      }, { status: 404 });
    }

    return json({ 
      success: true, 
      message: "Request cancelled successfully" 
    });
  }

  return json({ 
    success: false, 
    error: "Invalid intent" 
  }, { status: 400 });
}

export async function loader({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Get user's reservation requests
  const result = await query(
    `SELECT rr.*, 
            r.name as room_name, 
            r.name_en, 
            r.name_hu,
            u.first_name || ' ' || u.last_name as reviewed_by_name
     FROM reservation_requests rr
     JOIN rooms r ON rr.room_id = r.id
     LEFT JOIN users u ON rr.reviewed_by = u.id
     WHERE rr.user_id = $1
     ORDER BY rr.created_at DESC`,
    [userId]
  );

  return json({ requests: result.rows });
}
