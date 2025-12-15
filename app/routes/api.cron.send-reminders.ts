import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { query } from '~/db.server';
import { sendReservationReminder } from '~/services/email.server';

/**
 * API Endpoint for Cron Job - Send Reservation Reminders
 * 
 * This endpoint can be called by external cron services like:
 * - cron-job.org
 * - EasyCron
 * - GitHub Actions
 * - UptimeRobot
 * 
 * Schedule: Every 5 minutes
 * Method: POST
 * URL: https://queueforroom-demo.pages.dev/api/cron/send-reminders
 * 
 * Optional: Add a secret token in headers for security:
 * Authorization: Bearer YOUR_SECRET_TOKEN
 */

/**
 * Check for upcoming reservations and send reminders
 */
async function checkAndSendReminders() {
  console.log('\n🔍 [CRON API] Checking for upcoming reservations...');
  
  // Find reservations starting in 15-30 minutes
  const now = new Date();
  const in15Min = new Date(now.getTime() + 15 * 60 * 1000);
  const in30Min = new Date(now.getTime() + 30 * 60 * 1000);

  const result = await query(
    `SELECT r.id, r.user_id, r.start_time, r.end_time, r.purpose,
            u.email, u.first_name, u.last_name, u.preferred_language,
            rm.name as room_name, rm.name_en, rm.name_hu
     FROM reservations r
     JOIN users u ON r.user_id = u.id
     JOIN rooms rm ON r.room_id = rm.id
     WHERE r.status = 'confirmed'
       AND r.start_time >= $1
       AND r.start_time <= $2
       AND NOT EXISTS (
         SELECT 1 FROM notifications n 
         WHERE n.reservation_id = r.id 
         AND n.type = 'reservation_reminder'
       )
     ORDER BY r.start_time ASC`,
    [in15Min.toISOString(), in30Min.toISOString()]
  );

  if (result.rows.length === 0) {
    console.log('   ℹ️  No upcoming reservations requiring reminders');
    return { sent: 0, message: 'No reminders to send' };
  }

  console.log(`   📬 Found ${result.rows.length} reservation(s) to remind`);

  let sent = 0;
  let failed = 0;

  for (const reservation of result.rows) {
    const userName = `${reservation.first_name} ${reservation.last_name}`;
    const language = (reservation.preferred_language || 'en') as 'en' | 'hu';
    const roomName = language === 'hu' && reservation.name_hu ? reservation.name_hu :
                     language === 'en' && reservation.name_en ? reservation.name_en :
                     reservation.room_name;

    try {
      // Send reminder email
      const emailResult = await sendReservationReminder(
        reservation.email,
        userName,
        {
          roomName,
          startTime: new Date(reservation.start_time),
          endTime: new Date(reservation.end_time),
          purpose: reservation.purpose,
        },
        language
      );

      // Only create notification if email was actually sent (not skipped)
      if (emailResult.success && !('skipped' in emailResult && emailResult.skipped)) {
        // Create notification in database
        await query(
          `INSERT INTO notifications (user_id, type, title, message, reservation_id, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            reservation.user_id,
            'reservation_reminder',
            language === 'hu' ? 'Foglalás emlékeztető' : 'Reservation Reminder',
            language === 'hu' 
              ? `A foglalásod hamarosan kezdődik: ${roomName}`
              : `Your reservation is starting soon: ${roomName}`,
            reservation.id
          ]
        );

        const minutesUntil = Math.round((new Date(reservation.start_time).getTime() - now.getTime()) / (60 * 1000));
        console.log(`   ✅ Reminder sent for reservation #${reservation.id} (starts in ${minutesUntil} min)`);
        sent++;
      } else if ('skipped' in emailResult && emailResult.skipped) {
        console.log(`   ⏭️  Reminder skipped for reservation #${reservation.id} (user preferences)`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to send reminder for reservation #${reservation.id}:`, error);
      failed++;
    }
  }

  console.log(`   🎉 Completed: ${sent} sent, ${failed} failed\n`);
  
  return {
    sent,
    failed,
    total: result.rows.length,
    message: `Sent ${sent} reminders`
  };
}

export async function action({ request }: ActionFunctionArgs) {
  // Security: Check for optional authorization token
  // Uncomment and set CRON_SECRET in environment for production
  /*
  const authHeader = request.headers.get('Authorization');
  const expectedToken = process.env.CRON_SECRET;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  */

  try {
    const result = await checkAndSendReminders();
    
    return json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (error: any) {
    console.error('❌ [CRON API] Task failed:', error);
    
    return json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also support GET for testing (remove in production or add auth)
export async function loader() {
  return json({
    endpoint: '/api/cron/send-reminders',
    method: 'POST',
    description: 'Send reservation reminders for upcoming reservations (15-30 min before start)',
    schedule: 'Every 5 minutes',
    note: 'Call this endpoint from an external cron service',
    services: [
      'cron-job.org',
      'EasyCron',
      'GitHub Actions',
      'UptimeRobot'
    ]
  });
}
