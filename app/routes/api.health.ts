import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { query } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: {},
    database: {},
    email: {},
  };

  // Check environment variables
  checks.environment = {
    NODE_ENV: process.env.NODE_ENV || "not set",
    DATABASE_URL: process.env.DATABASE_URL ? "✓ Set" : "✗ Not set",
    SESSION_SECRET: process.env.SESSION_SECRET ? "✓ Set" : "✗ Not set",
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "✓ Set" : "✗ Not set",
    FROM_EMAIL: process.env.FROM_EMAIL || "not set",
    SEND_REAL_EMAILS: process.env.SEND_REAL_EMAILS || "not set",
    TEST_EMAIL_OVERRIDE: process.env.TEST_EMAIL_OVERRIDE || "not set",
  };

  // Check database connection
  try {
    const result = await query("SELECT NOW() as time, version() as version");
    checks.database = {
      status: "✓ Connected",
      time: result.rows[0].time,
      version: result.rows[0].version.split(" ")[0] + " " + result.rows[0].version.split(" ")[1],
    };

    // Check if users table exists and has data
    try {
      const userCount = await query("SELECT COUNT(*) as count FROM users");
      const verifiedCount = await query("SELECT COUNT(*) as count FROM users WHERE email_verified = true");
      checks.database.users = {
        total: parseInt(userCount.rows[0].count),
        verified: parseInt(verifiedCount.rows[0].count),
      };
    } catch (e) {
      checks.database.users = "✗ Users table not found or error";
    }
  } catch (error: any) {
    checks.database = {
      status: "✗ Connection failed",
      error: error.message,
    };
  }

  // Check email configuration
  checks.email = {
    apiKeySet: process.env.RESEND_API_KEY ? "✓ Yes" : "✗ No",
    fromEmail: process.env.FROM_EMAIL || "not set",
    sendEnabled: process.env.SEND_REAL_EMAILS === "true" ? "✓ Yes" : "✗ No",
    testEmail: process.env.TEST_EMAIL_OVERRIDE || "not set",
  };

  return json(checks, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
