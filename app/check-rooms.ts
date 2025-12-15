import { query } from './db.server';

async function checkRooms() {
  const result = await query(`
    SELECT name, name_hu, capacity, position_x, position_y, width, height, floor 
    FROM rooms 
    WHERE name IN ('D001/1', 'D002', 'C006', 'Staff Room') 
       OR name_hu LIKE '%Tanári%' 
       OR name_hu LIKE '%NATO%'
    ORDER BY floor, position_y, position_x
  `);
  
  console.log(JSON.stringify(result.rows, null, 2));
  process.exit(0);
}

checkRooms();
