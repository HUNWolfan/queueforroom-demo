import { query } from './db.server';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to grant override permissions to a specific instructor
 * Usage: node --import tsx -r dotenv/config ./app/grant-instructor-override.ts <email>
 */
async function grantOverridePermission() {
  const instructorEmail = process.argv[2];

  if (!instructorEmail) {
    console.error('❌ Error: Please provide an instructor email address');
    console.log('Usage: node --import tsx -r dotenv/config ./app/grant-instructor-override.ts <email>');
    process.exit(1);
  }

  try {
    // Find the instructor
    const userResult = await query(
      `SELECT id, email, first_name, last_name, role 
       FROM users 
       WHERE LOWER(email) = LOWER($1)`,
      [instructorEmail]
    );

    if (userResult.rows.length === 0) {
      console.error(`❌ Error: No user found with email ${instructorEmail}`);
      process.exit(1);
    }

    const user = userResult.rows[0];

    if (user.role !== 'instructor') {
      console.error(`❌ Error: User ${instructorEmail} is not an instructor (current role: ${user.role})`);
      console.log('💡 Tip: Only instructors can receive override permissions');
      process.exit(1);
    }

    // Check if instructor already has permissions entry
    const permResult = await query(
      `SELECT * FROM instructor_permissions WHERE user_id = $1`,
      [user.id]
    );

    if (permResult.rows.length === 0) {
      // Create new permissions entry with override enabled
      await query(
        `INSERT INTO instructor_permissions (user_id, can_override_reservations, granted_by)
         VALUES ($1, $2, NULL)`,
        [user.id, true]
      );
      console.log(`✅ Created new permissions entry with override enabled for ${user.first_name} ${user.last_name}`);
    } else {
      // Update existing permissions
      await query(
        `UPDATE instructor_permissions 
         SET can_override_reservations = true,
             revoked = false
         WHERE user_id = $1`,
        [user.id]
      );
      console.log(`✅ Updated permissions for ${user.first_name} ${user.last_name}`);
    }

    console.log('\n📋 Current instructor status:');
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Can override standard instructor bookings: YES ✅`);
    
    console.log('\n💡 This instructor can now:');
    console.log('   - Create room reservations freely');
    console.log('   - Override (cancel) standard instructor bookings when needed');
    console.log('   - Receive notifications when overriding others\' bookings');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

grantOverridePermission();
