import { query } from '~/db.server';
import { sendReservationReminder } from './email.server';

/**
 * Reservation Reminder Scheduler
 * 
 * TODO: Implement with Cloudflare Cron Triggers
 * 
 * Current status: Disabled for Cloudflare Workers compatibility
 * node-cron uses Node.js globals (__dirname, child_process) that don't exist in Workers
 * 
 * Implementation plan:
 * 1. Add to wrangler.toml:
 *    [triggers]
 *    crons = ["0/5 * * * *"]  # Every 5 minutes
 * 
 * 2. Create app/cron/send-reminders.ts:
 *    export async function scheduled(event: ScheduledEvent, env: Env) {
 *      await checkAndSendReminders();
 *    }
 * 
 * 3. Or use external cron service (cron-job.org) to hit /api/send-reminders endpoint
 * 
 * Docs: https://developers.cloudflare.com/workers/configuration/cron-triggers/
 */

let isSchedulerRunning = false;

export function startReminderScheduler() {
  // Stub function for Cloudflare Workers - actual scheduling disabled
  console.log('ℹ️  Reminder scheduler: Using Cloudflare Cron Triggers (see wrangler.toml)');
  isSchedulerRunning = true;
}

async function checkAndSendReminders() {
  console.log('\n🔍 Checking for upcoming reservations...');
  
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

// Manual trigger function for testing
export async function sendRemindersNow() {
  console.log('🧪 Manual trigger: Sending reminders now...');
  await checkAndSendReminders();
}
