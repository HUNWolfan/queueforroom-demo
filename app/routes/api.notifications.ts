import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUserId } from "~/utils/session.server";
import { query } from "~/db.server";

/**
 * GET: Fetch notifications for the current user
 * Query params:
 *   - unreadOnly=true: csak olvasatlan értesítések
 *   - limit=N: maximum N értesítés (default: 50)
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unreadOnly") === "true";
  const limit = parseInt(url.searchParams.get("limit") || "50");

  let sql = `
    SELECT 
      n.id, n.type, n.title, n.message, n.reservation_id, 
      n.is_read, n.created_at,
      r.start_time as reservation_start,
      r.end_time as reservation_end,
      rm.name as room_name, rm.name_en, rm.name_hu
    FROM notifications n
    LEFT JOIN reservations r ON n.reservation_id = r.id
    LEFT JOIN rooms rm ON r.room_id = rm.id
    WHERE n.user_id = $1
  `;

  const params: any[] = [userId];

  if (unreadOnly) {
    sql += ` AND n.is_read = false`;
  }

  sql += ` ORDER BY n.created_at DESC LIMIT $2`;
  params.push(limit);

  const result = await query(sql, params);

  // Get unread count
  const countResult = await query(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
    [userId]
  );

  return json({
    notifications: result.rows,
    unreadCount: parseInt(countResult.rows[0].count),
  });
}

/**
 * POST: Mark notifications as read or delete
 * Actions:
 *   - markAsRead: Mark one or all notifications as read
 *   - delete: Delete a notification
 */
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Mark notification(s) as read
  if (intent === "markAsRead") {
    const notificationId = formData.get("notificationId");

    if (notificationId && notificationId !== "all") {
      // Mark single notification as read
      await query(
        `UPDATE notifications 
         SET is_read = true 
         WHERE id = $1 AND user_id = $2`,
        [notificationId, userId]
      );
    } else {
      // Mark all notifications as read
      await query(
        `UPDATE notifications 
         SET is_read = true 
         WHERE user_id = $1 AND is_read = false`,
        [userId]
      );
    }

    return json({ success: true });
  }

  // Delete notification
  if (intent === "delete") {
    const notificationId = formData.get("notificationId");

    if (!notificationId) {
      return json({ error: "Notification ID required" }, { status: 400 });
    }

    await query(
      `DELETE FROM notifications 
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    return json({ success: true });
  }

  // Delete all notifications
  if (intent === "deleteAll") {
    await query(
      `DELETE FROM notifications 
       WHERE user_id = $1`,
      [userId]
    );

    return json({ success: true });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
}
