import { query } from './db.server';

/**
 * Adatbázis séma inicializálása és frissítése
 * Idempotens migrációs szkript - többször is futtatható biztonságosan
 */
async function migrate() {
  console.log('Migrációk futtatása...');

  // Felhasználók tábla létrehozása
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Termek tábla létrehozása
  await query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      name_en VARCHAR(100),
      name_hu VARCHAR(100),
      capacity INTEGER NOT NULL,
      description_en TEXT,
      description_hu TEXT,
      floor INTEGER,
      position_x INTEGER,
      position_y INTEGER,
      width INTEGER,
      height INTEGER,
      is_available BOOLEAN DEFAULT true,
      room_type VARCHAR(50) DEFAULT 'standard',
      min_role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Foglalások tábla létrehozása
  await query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      purpose TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      attendees INTEGER DEFAULT 1,
      canceled_at TIMESTAMP,
      share_token VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Session-ök tábla létrehozása
  await query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(255) PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Jelszó visszaállítási tokenek tábla létrehozása
  await query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Kétfaktoros hitelesítési kódok tábla létrehozása (email 2FA)
  await query(`
    CREATE TABLE IF NOT EXISTS two_factor_codes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      code VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Email aktiválási tokenek tábla létrehozása
  await query(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Hibabejelentések tábla létrehozása
  await query(`
    CREATE TABLE IF NOT EXISTS bug_reports (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Login attempts tábla létrehozása (brute force védelem)
  await query(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      ip_address VARCHAR(45),
      success BOOLEAN DEFAULT false,
      attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_agent TEXT
    );
  `);
  
  // Indexek létrehozása a login_attempts táblához
  await query(`CREATE INDEX IF NOT EXISTS idx_email_attempts ON login_attempts(email, attempted_at);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_ip_attempts ON login_attempts(ip_address, attempted_at);`);

  // Account lockouts tábla létrehozása
  await query(`
    CREATE TABLE IF NOT EXISTS account_lockouts (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      locked_until TIMESTAMP NOT NULL,
      reason VARCHAR(255),
      unlock_token VARCHAR(255) UNIQUE,
      token_used BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Értesítések tábla létrehozása
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      reservation_id INTEGER REFERENCES reservations(id) ON DELETE CASCADE,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Index létrehozása a notifications táblához (gyorsabb lekérdezések)
  await query(`CREATE INDEX IF NOT EXISTS idx_user_notifications ON notifications(user_id, is_read, created_at DESC);`);

  // Új oszlopok hozzáadása, ha még nem léteznek (kompatibilitás régi adatbázissal)
  await query(`
    DO $$ 
    BEGIN
      -- Terem típusa oszlop hozzáadása
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='rooms' AND column_name='room_type'
      ) THEN
        ALTER TABLE rooms ADD COLUMN room_type VARCHAR(50) DEFAULT 'standard';
      END IF;
      
      -- Minimális jogosultsági szint oszlop hozzáadása
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='rooms' AND column_name='min_role'
      ) THEN
        ALTER TABLE rooms ADD COLUMN min_role VARCHAR(50) DEFAULT 'user';
      END IF;

      -- Résztvevők száma oszlop hozzáadása
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='reservations' AND column_name='attendees'
      ) THEN
        ALTER TABLE reservations ADD COLUMN attendees INTEGER DEFAULT 1;
      END IF;

      -- Törlés időpontja oszlop hozzáadása
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='reservations' AND column_name='canceled_at'
      ) THEN
        ALTER TABLE reservations ADD COLUMN canceled_at TIMESTAMP;
      END IF;

      -- Biztonságos megosztási token oszlop hozzáadása
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='reservations' AND column_name='share_token'
      ) THEN
        ALTER TABLE reservations ADD COLUMN share_token VARCHAR(255) UNIQUE;
      END IF;

      -- 2FA secret oszlop hozzáadása
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='two_factor_secret'
      ) THEN
        ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255);
      END IF;

      -- 2FA enabled oszlop hozzáadása
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='two_factor_enabled'
      ) THEN
        ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
      END IF;

      -- 2FA method oszlop hozzáadása (authenticator vagy email)
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='two_factor_method'
      ) THEN
        ALTER TABLE users ADD COLUMN two_factor_method VARCHAR(50);
      END IF;

      -- 2FA email oszlop hozzáadása (email-alapú 2FA engedélyezve van-e)
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='two_factor_email'
      ) THEN
        ALTER TABLE users ADD COLUMN two_factor_email BOOLEAN DEFAULT false;
      END IF;

      -- Email verified oszlop hozzáadása
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='email_verified'
      ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
      END IF;

      -- Preferred language oszlop hozzáadása
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='preferred_language'
      ) THEN
        ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en';
      END IF;
    END $$;
  `);

  console.log('Migrációk sikeresen befejezve!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migráció sikertelen:', err);
  process.exit(1);
});
