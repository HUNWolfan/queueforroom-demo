import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { query } from "~/db.server";

/**
 * DEV ONLY: List all users for debugging
 * ⚠️ THIS SHOULD BE REMOVED IN PRODUCTION!
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Only allow in development or if specifically enabled
  const isDev = process.env.NODE_ENV === "development";
  const allowDebug = process.env.ALLOW_DEBUG_ENDPOINTS === "true";

  if (!isDev && !allowDebug) {
    return json({ error: "This endpoint is disabled in production" }, { status: 403 });
  }

  try {
    // Fetch all users
    const result = await query(`
      SELECT 
        id,
        email,
        first_name || ' ' || last_name as name,
        role,
        email_verified,
        two_factor_enabled,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    return json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      totalUsers: result.rows.length,
      users: result.rows,
      testAccounts: {
        note: "Default test account passwords (if database was seeded with npm run db:seed)",
        accounts: [
          {
            email: "admin@test.com",
            password: "Admin123!",
            role: "admin",
            description: "Full admin access"
          },
          {
            email: "instructor@test.com",
            password: "Instructor123!",
            role: "instructor",
            description: "Can create reservations"
          },
          {
            email: "student@test.com",
            password: "Student123!",
            role: "student",
            description: "Basic user access"
          }
        ]
      },
      loginUrl: "/login",
      healthCheckUrl: "/api/health"
    });
  } catch (error: any) {
    return json({
      error: "Database query failed",
      message: error.message,
      hint: "Make sure to run: npm run db:migrate && npm run db:seed"
    }, { status: 500 });
  }
}
