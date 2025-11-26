import { query } from './db.server';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Student role eltávolítása és átnevezése user-re
 * Instructor permissions átstrukturálása:
 * - can_reserve_rooms=false: sima instructor (szabadon foglalhat)
 * - can_reserve_rooms=true: privileged instructor (felülírhatja mások foglalását)
 */
async function migrateRemoveStudent() {
  console.log('🔧 Removing student role and restructuring permissions...\n');

  try {
    // 1. Minden student role-t átalakítunk user-re
    const studentUpdateResult = await query(`
      UPDATE users 
      SET role = 'user'
      WHERE role = 'student';
    `);
    console.log(`✅ Updated ${studentUpdateResult.rowCount} student accounts to user role`);

    // 2. A rooms táblában a min_role értékeket frissítjük
    const roomsUpdateResult = await query(`
      UPDATE rooms 
      SET min_role = 'user'
      WHERE min_role = 'student';
    `);
    console.log(`✅ Updated ${roomsUpdateResult.rowCount} room minimum role requirements`);

    // 3. A instructor_permissions logikája most:
    //    - can_reserve_rooms = false -> sima instructor (nincs különleges jog)
    //    - can_reserve_rooms = true -> privileged instructor (override jog)
    // Átnevezzük a can_reserve_rooms oszlopot can_override_reservations-ra a clarity kedvéért
    // De megtartjuk a régi oszlopot is kompatibilitásként
    
    // Minden létező instructor permission-t alapértelmezettre állítunk (sima instructor)
    const permUpdateResult = await query(`
      UPDATE instructor_permissions 
      SET can_reserve_rooms = false
      WHERE can_reserve_rooms = true;
    `);
    console.log(`✅ Reset ${permUpdateResult.rowCount} instructor permissions (all instructors now standard)`);

    // 4. can_override_reservations oszlop frissítése (ha létezik)
    await query(`
      UPDATE instructor_permissions 
      SET can_override_reservations = can_reserve_rooms
      WHERE can_override_reservations IS NOT NULL;
    `);
    console.log(`✅ Synchronized override permissions`);

    console.log('\n📋 Summary of changes:');
    console.log('   1. All "student" roles → "user" roles');
    console.log('   2. Room min_role "student" → "user"');
    console.log('   3. All instructors reset to standard (no special permissions)');
    console.log('\n💡 New permission system:');
    console.log('   - user: must request permission to book rooms');
    console.log('   - instructor (standard): can book freely, cannot override');
    console.log('   - instructor (privileged): can override standard instructor bookings');
    console.log('   - admin: full access');

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }

  process.exit(0);
}

migrateRemoveStudent();
