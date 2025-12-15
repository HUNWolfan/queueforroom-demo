import { query } from './db.server';

async function clearRooms() {
  console.log('Clearing all rooms...');
  
  await query('DELETE FROM rooms');
  
  console.log('Rooms cleared successfully!');
  process.exit(0);
}

clearRooms().catch((err) => {
  console.error('Failed to clear rooms:', err);
  process.exit(1);
});
