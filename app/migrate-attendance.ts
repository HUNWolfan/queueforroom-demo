import { query } from './db.server';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Foglalási részvétel és meghívók migrációja
 * Új táblák: reservation_attendees, reservation_invites
 */
async function migrateAttendance() {
  console.log('🎫 Foglalási részvétel migráció futtatása...\n');

  try {
    // 1. Reservation attendees tábla (visszaigazolt résztvevők)
    await query(`
      CREATE TABLE IF NOT EXISTS reservation_attendees (
        id SERIAL PRIMARY KEY,
        reservation_id INTEGER REFERENCES reservations(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        confirmed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(reservation_id, user_id)
      );
    `);
    console.log('✅ Created reservation_attendees table');

    // 2. Reservation invites tábla (meghívottak)
    await query(`
      CREATE TABLE IF NOT EXISTS reservation_invites (
        id SERIAL PRIMARY KEY,
        reservation_id INTEGER REFERENCES reservations(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(reservation_id, user_id)
      );
    `);
    console.log('✅ Created reservation_invites table');

    // 3. Indexek létrehozása a jobb teljesítményért
    await query(`
      CREATE INDEX IF NOT EXISTS idx_attendees_reservation 
      ON reservation_attendees(reservation_id);
    `);
    console.log('✅ Created index on reservation_attendees.reservation_id');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_attendees_user 
      ON reservation_attendees(user_id);
    `);
    console.log('✅ Created index on reservation_attendees.user_id');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_invites_reservation 
      ON reservation_invites(reservation_id);
    `);
    console.log('✅ Created index on reservation_invites.reservation_id');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_invites_user 
      ON reservation_invites(user_id);
    `);
    console.log('✅ Created index on reservation_invites.user_id');

    console.log('\n✅ Részvétel migráció sikeresen befejezve!');
    console.log('\n📊 Új táblák létrehozva:');
    console.log('   - reservation_attendees: Visszaigazolt résztvevők követése');
    console.log('   - reservation_invites: Meghívott felhasználók követése');
    console.log('\n💡 Használat:');
    console.log('   - Megosztott link → auto-confirm → reservation_attendees');
    console.log('   - Felhasználó meghívása → reservation_invites');
    console.log('   - Foglalási kártyákon megjelenik: X confirmed + Y invited');
    
  } catch (error) {
    console.error('❌ Részvétel migráció sikertelen:', error);
    throw error;
  }

  process.exit(0);
}

migrateAttendance();
