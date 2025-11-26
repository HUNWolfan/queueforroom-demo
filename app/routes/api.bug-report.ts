import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUserId } from "~/utils/session.server";
import { query } from "~/db.server";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
  const title = formData.get("title");
  const description = formData.get("description");
  const severity = formData.get("severity");

  if (typeof title !== "string" || typeof description !== "string" || typeof severity !== "string") {
    return json({ error: "Invalid form data" }, { status: 400 });
  }

  try {
    // Save bug report to database
    await query(
      `INSERT INTO bug_reports (user_id, title, description, severity, status, created_at)
       VALUES ($1, $2, $3, $4, 'open', NOW())`,
      [userId, title, description, severity]
    );

    return json({ success: true, message: "Bug report submitted successfully" });
  } catch (error) {
    console.error("Error saving bug report:", error);
    return json({ error: "Failed to submit bug report" }, { status: 500 });
  }
}
