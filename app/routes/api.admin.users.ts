import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { query } from "~/db.server";
import { getUserId } from "~/utils/session.server";

/**
 * Admin endpoint to list all users with their credentials
 * WARNING: This should be protected and only accessible by admins in production!
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Check if user is authenticated and is admin
  const userId = await getUserId(request);
  
  if (!userId) {
    return json({ error: "Unauthorized - Please login first" }, { status: 401 });
  }

  // Check if user is admin
  const adminCheck = await query(
    "SELECT role FROM users WHERE id = $1",
    [userId]
  );

  if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== "admin") {
    return json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  try {
    // Fetch all users with their details
    const result = await query(`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        role,
        email_verified,
        two_factor_enabled,
        created_at,
        last_login_at,
        password_hash
      FROM users
      ORDER BY created_at DESC
    `);

    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      emailVerified: user.email_verified,
      twoFactorEnabled: user.two_factor_enabled,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      passwordHash: user.password_hash,
    }));

    return json({
      success: true,
      count: users.length,
      users,
      testAccounts: [
        {
          email: "admin@test.com",
          password: "Admin123!",
          role: "admin"
        },
        {
          email: "instructor@test.com",
          password: "Instructor123!",
          role: "instructor"
        },
        {
          email: "student@test.com",
          password: "Student123!",
          role: "student"
        }
      ],
      note: "⚠️ Test account passwords are listed above. Password hashes are shown for reference but cannot be reversed."
    });
  } catch (error: any) {
    return json({
      error: "Database query failed",
      message: error.message
    }, { status: 500 });
  }
}
