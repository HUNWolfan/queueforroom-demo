import { query } from './db.server';
import dotenv from 'dotenv';

dotenv.config();

async function migrateNotificationSettings() {
  console.log('🔧 Adding notification settings table...\n');

  try {
    // Create notification_settings table
    await query(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        email_notifications BOOLEAN DEFAULT true,
        reservation_reminders BOOLEAN DEFAULT true,
        reservation_confirmed BOOLEAN DEFAULT true,
        reservation_cancelled BOOLEAN DEFAULT true,
        reservation_updated BOOLEAN DEFAULT true,
        permission_granted BOOLEAN DEFAULT true,
        permission_rejected BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created notification_settings table');

    // Create index on user_id
    await query(`
      CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id 
      ON notification_settings(user_id);
    `);
    console.log('✅ Created index on user_id');

    // Insert default settings for existing users
    await query(`
      INSERT INTO notification_settings (user_id, email_notifications, reservation_reminders)
      SELECT id, true, true FROM users
      WHERE id NOT IN (SELECT user_id FROM notification_settings WHERE user_id IS NOT NULL);
    `);
    console.log('✅ Added default notification settings for existing users');

    console.log('\n✅ Migration completed successfully!');
    console.log('\nℹ️  Notification settings:');
    console.log('   - email_notifications: Master switch for all email notifications');
    console.log('   - reservation_reminders: Reminders before reservation time');
    console.log('   - reservation_confirmed: When reservation is confirmed');
    console.log('   - reservation_cancelled: When reservation is cancelled');
    console.log('   - reservation_updated: When reservation is modified');
    console.log('   - permission_granted: When permission request is approved');
    console.log('   - permission_rejected: When permission request is rejected');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }

  process.exit(0);
}

migrateNotificationSettings();
