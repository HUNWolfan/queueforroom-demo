import { query } from './db.server';

/**
 * Create a test reservation for testing dashboard display
 */
async function createTestReservation() {
  console.log('Creating test reservation...');

  try {
    // Get a test user (student@school.com)
    const userResult = await query(`SELECT id FROM users WHERE email = 'student@school.com'`);
    
    if (userResult.rows.length === 0) {
      console.error('❌ Test user not found!');
      process.exit(1);
    }

    const userId = userResult.rows[0].id;

    // Get a test room (Classroom 101)
    const roomResult = await query(`SELECT id FROM rooms WHERE name = 'Classroom 101'`);
    
    if (roomResult.rows.length === 0) {
      console.error('❌ Test room not found!');
      process.exit(1);
    }

    const roomId = roomResult.rows[0].id;

    // Create a reservation for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10:00 AM

    const endTime = new Date(tomorrow);
    endTime.setHours(12, 0, 0, 0); // 12:00 PM

    await query(`
      INSERT INTO reservations (user_id, room_id, start_time, end_time, purpose, status, attendees)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, roomId, tomorrow.toISOString(), endTime.toISOString(), 'Test Meeting', 'confirmed', 5]);

    console.log('✅ Test reservation created successfully!');
    console.log(`   User: student@school.com`);
    console.log(`   Room: Classroom 101`);
    console.log(`   Time: ${tomorrow.toLocaleString()} - ${endTime.toLocaleString()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test reservation:', error);
    process.exit(1);
  }
}

createTestReservation();
