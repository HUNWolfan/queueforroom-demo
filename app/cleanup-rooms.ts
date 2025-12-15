import { query } from './db.server';

/**
 * Clean up duplicate rooms and keep only the correct ones
 */
async function cleanupRooms() {
  console.log('Cleaning up duplicate rooms...');

  try {
    // Delete old rooms that were replaced by D001/1, D002, C006
    await query(`
      DELETE FROM rooms 
      WHERE name IN ('Classroom 101', 'Computer Lab', 'Server Room')
    `);
    
    console.log('✓ Deleted old duplicate rooms (Classroom 101, Computer Lab, Server Room)');
    
    // Verify remaining rooms
    const result = await query(`
      SELECT id, name, name_en, name_hu, capacity, floor, position_x, position_y 
      FROM rooms 
      WHERE floor = 1 
      ORDER BY position_y, position_x
    `);
    
    console.log('\nRemaining rooms on floor 1:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up rooms:', error);
    process.exit(1);
  }
}

cleanupRooms();
