import { query } from './db.server';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Jelszó visszaállítási oszlopok hozzáadása a users táblához
 */
async function migratePasswordResetColumns() {
  console.log('🔐 Jelszó visszaállítási oszlopok migráció futtatása...\n');

  try {
    // Add password_reset_token column
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
    `);
    console.log('✅ Added password_reset_token column to users table');

    // Add password_reset_expires column
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
    `);
    console.log('✅ Added password_reset_expires column to users table');

    // Add unique index on password_reset_token
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_token 
      ON users(password_reset_token) 
      WHERE password_reset_token IS NOT NULL;
    `);
    console.log('✅ Created unique index on password_reset_token');

    console.log('\n✅ Jelszó visszaállítási migráció sikeresen befejezve!');
    console.log('\n📊 Új oszlopok:');
    console.log('   - password_reset_token: Visszaállítási token tárolása');
    console.log('   - password_reset_expires: Token lejárati idő');
    console.log('\n💡 Használat:');
    console.log('   - Beállítások → Jelszó visszaállítás küldése');
    console.log('   - Email-ben küldött link → token validálás → új jelszó');
    
  } catch (error) {
    console.error('❌ Jelszó visszaállítási migráció sikertelen:', error);
    throw error;
  }

  process.exit(0);
}

migratePasswordResetColumns();
