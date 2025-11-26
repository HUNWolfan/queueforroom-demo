/**
 * Cloudflare Cron Trigger Handler
 * Runs every 5 minutes to check and send reservation reminders
 * 
 * Configure in wrangler.toml:
 * [triggers]
 * crons = ["0/5 * * * *"]
 */

import type { ScheduledController } from '@cloudflare/workers-types';
import { query } from '../../app/db.server';
import { sendReservationReminder } from '../../app/services/email.server';

interface Env {
  DATABASE_URL: string;
  RESEND_API_KEY: string;
  FROM_EMAIL?: string;
  SEND_REAL_EMAILS?: string;
  TEST_EMAIL_OVERRIDE?: string;
}

/**
 * Check for upcoming reservations and send reminders
 */
async function checkAndSendReminders() {
  console.log('\n🔍 [CRON] Checking for upcoming reservations...');
  
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
    return;
  }

  console.log(`   📬 Found ${result.rows.length} reservation(s) to remind`);

  for (const reservation of result.rows) {
    const userName = `${reservation.first_name} ${reservation.last_name}`;
    const language = (reservation.preferred_language || 'en') as 'en' | 'hu';
    const roomName = language === 'hu' && reservation.name_hu ? reservation.name_hu :
                     language === 'en' && reservation.name_en ? reservation.name_en :
                     reservation.room_name;

    try {
      // Send reminder email
      await sendReservationReminder(
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
    } catch (error) {
      console.error(`   ❌ Failed to send reminder for reservation #${reservation.id}:`, error);
    }
  }

  console.log(`   🎉 Completed sending ${result.rows.length} reminder(s)\n`);
}

/**
 * Cloudflare Cron Trigger Handler
 * This function is called automatically by Cloudflare at the scheduled time
 */
export async function scheduled(
  controller: ScheduledController,
  env: Env,
  ctx: any
): Promise<void> {
  console.log('⏰ [CRON] Scheduled task triggered at', new Date().toISOString());
  console.log('   Cron:', controller.cron);
  console.log('   Scheduled time:', new Date(controller.scheduledTime).toISOString());
  
  try {
    // Set environment variables for database and email
    process.env.DATABASE_URL = env.DATABASE_URL;
    process.env.RESEND_API_KEY = env.RESEND_API_KEY;
    if (env.FROM_EMAIL) process.env.FROM_EMAIL = env.FROM_EMAIL;
    if (env.SEND_REAL_EMAILS) process.env.SEND_REAL_EMAILS = env.SEND_REAL_EMAILS;
    if (env.TEST_EMAIL_OVERRIDE) process.env.TEST_EMAIL_OVERRIDE = env.TEST_EMAIL_OVERRIDE;

    await checkAndSendReminders();
    console.log('✅ [CRON] Task completed successfully');
  } catch (error) {
    console.error('❌ [CRON] Task failed:', error);
    throw error; // Re-throw to mark the cron execution as failed
  }
}

/**
 * Export as default for Cloudflare Workers
 */
export default {
  scheduled,
};
