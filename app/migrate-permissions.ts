import { query } from './db.server';

/**
 * Permission rendszer migrációja
 * Új szerepkörök: student (hallgató), instructor (előadó), admin
 * Új funkciók: engedélykérés, időintervallum beállítások
 */
async function migratePermissions() {
  console.log('Permission rendszer migráció futtatása...');

  // 1. Reservation requests tábla létrehozása (engedélykérések)
  await query(`
    CREATE TABLE IF NOT EXISTS reservation_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      purpose TEXT,
      attendees INTEGER DEFAULT 1,
      status VARCHAR(50) DEFAULT 'pending',
      reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMP,
      review_note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Instructor permissions tábla (előadói jogosultságok)
  await query(`
    CREATE TABLE IF NOT EXISTS instructor_permissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      can_reserve_rooms BOOLEAN DEFAULT true,
      granted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      revoked BOOLEAN DEFAULT false,
      revoked_at TIMESTAMP
    );
  `);

  // 3. System settings tábla (rendszerbeállítások)
  await query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id SERIAL PRIMARY KEY,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      description TEXT,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Alapértelmezett beállítások beszúrása
  await query(`
    INSERT INTO system_settings (setting_key, setting_value, description)
    VALUES 
      ('min_reservation_minutes', '30', 'Minimum foglalási idő percben'),
      ('max_reservation_minutes', '120', 'Maximum foglalási idő percben')
    ON CONFLICT (setting_key) DO NOTHING;
  `);

  // 5. Frissítsük a meglévő szerepköröket
  // user -> student, superuser -> instructor, admin -> admin
  await query(`
    UPDATE users 
    SET role = CASE 
      WHEN role = 'user' THEN 'student'
      WHEN role = 'superuser' THEN 'instructor'
      WHEN role = 'admin' THEN 'admin'
      ELSE role
    END
    WHERE role IN ('user', 'superuser', 'admin');
  `);

  // 6. Frissítsük a termek min_role értékeit
  await query(`
    UPDATE rooms 
    SET min_role = CASE 
      WHEN min_role = 'user' THEN 'student'
      WHEN min_role = 'superuser' THEN 'instructor'
      WHEN min_role = 'admin' THEN 'admin'
      ELSE min_role
    END
    WHERE min_role IN ('user', 'superuser', 'admin');
  `);

  // 7. Minden instructor automatikusan megkapja a foglalási jogosultságot
  await query(`
    INSERT INTO instructor_permissions (user_id, can_reserve_rooms, granted_by)
    SELECT id, true, NULL
    FROM users
    WHERE role = 'instructor'
    ON CONFLICT (user_id) DO NOTHING;
  `);

  // 8. Indexek létrehozása a jobb teljesítményért
  await query(`CREATE INDEX IF NOT EXISTS idx_reservation_requests_user ON reservation_requests(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_reservation_requests_status ON reservation_requests(status);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_instructor_permissions_user ON instructor_permissions(user_id);`);

  console.log('✅ Permission rendszer migráció sikeresen befejezve!');
  console.log('📊 Szerepkörök átnevezve:');
  console.log('   - user → student (hallgató)');
  console.log('   - superuser → instructor (előadó)');
  console.log('   - admin → admin (adminisztrátor)');
  console.log('⚙️  Rendszerbeállítások:');
  console.log('   - Minimum foglalás: 30 perc');
  console.log('   - Maximum foglalás: 120 perc');
  
  process.exit(0);
}

migratePermissions().catch((err) => {
  console.error('❌ Permission migráció sikertelen:', err);
  process.exit(1);
});
