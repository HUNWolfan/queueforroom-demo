import { query } from './db.server';
import dotenv from 'dotenv';

dotenv.config();

async function migrateOverridePermission() {
  console.log('🔧 Adding override permission to instructor_permissions table...\n');

  try {
    // Add can_override_reservations column to instructor_permissions table
    await query(`
      ALTER TABLE instructor_permissions 
      ADD COLUMN IF NOT EXISTS can_override_reservations BOOLEAN DEFAULT false;
    `);
    console.log('✅ Added can_override_reservations column');

    // Update the column comment
    await query(`
      COMMENT ON COLUMN instructor_permissions.can_override_reservations 
      IS 'Whether the instructor can override/cancel other users reservations';
    `);
    console.log('✅ Added column comment');

    console.log('\n✅ Migration completed successfully!');
    console.log('\nℹ️  Instructors now have separate permissions for:');
    console.log('   - can_reserve_rooms: Can create their own reservations');
    console.log('   - can_override_reservations: Can override/cancel others reservations');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }

  process.exit(0);
}

migrateOverridePermission();
