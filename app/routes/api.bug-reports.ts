import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUserId } from "~/utils/session.server";
import { query } from "~/db.server";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "submitReport") {
    const title = formData.get("title");
    const description = formData.get("description");
    const severity = formData.get("severity");

    if (!title || !description) {
      return json({ error: "Title and description are required" }, { status: 400 });
    }

    // Get user info for notification
    const userResult = await query(
      `SELECT first_name || ' ' || last_name as name, email FROM users WHERE id = $1`,
      [userId]
    );

    const reporter = userResult.rows[0];
    const reporterName = reporter?.name || reporter?.email || 'Unknown User';

    // Store bug report in database (you can create a bug_reports table if needed)
    // For now, we'll just send notifications to admins

    // Get all admin users
    const adminsResult = await query(
      `SELECT id FROM users WHERE role = 'admin'`
    );

    // Send notification to each admin
    for (const admin of adminsResult.rows) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, created_at)
         VALUES ($1, 'bug_report', $2, $3, NOW())`,
        [
          admin.id,
          `🐛 Bug Report: ${title}`,
          `${reporterName} reported: ${description} (Severity: ${severity})`
        ]
      );
    }

    return json({ 
      success: true, 
      message: "Bug report submitted successfully"
    });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
}
