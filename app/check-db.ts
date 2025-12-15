import { query } from './db.server';

/**
 * Ellenőrzi, hogy minden szükséges tábla létezik-e az adatbázisban
 */
async function checkTables() {
  console.log('📋 Adatbázis táblák ellenőrzése...\n');

  const requiredTables = [
    'users',
    'rooms',
    'reservations',
    'reservation_attendees',
    'sessions',
    'password_resets',
    'two_factor_codes',
    'email_verifications',
    'bug_reports',
    'login_attempts',
    'account_lockouts',
    'notifications',
    'instructor_permissions',
    'notification_settings',
    'permission_requests'
  ];

  let allTablesExist = true;

  for (const table of requiredTables) {
    try {
      const result = await query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );

      const exists = result.rows[0].exists;
      
      if (exists) {
        console.log(`✅ ${table}`);
      } else {
        console.log(`❌ ${table} - HIÁNYZIK!`);
        allTablesExist = false;
      }
    } catch (error) {
      console.error(`❌ ${table} - Hiba az ellenőrzés során:`, error);
      allTablesExist = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  
  if (allTablesExist) {
    console.log('✅ Minden tábla létezik!');
    console.log('\nHa továbbra is hibát kapsz, futtasd:');
    console.log('  npm run db:migrate');
  } else {
    console.log('❌ Hiányzó táblák találhatók!');
    console.log('\nFuttasd a migrációt:');
    console.log('  npm run db:migrate');
    console.log('\nVagy Railway-en:');
    console.log('  railway run npm run db:migrate');
  }
  
  process.exit(allTablesExist ? 0 : 1);
}

checkTables().catch((err) => {
  console.error('❌ Ellenőrzés sikertelen:', err);
  process.exit(1);
});
