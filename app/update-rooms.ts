import { query } from './db.server';

/**
 * Update specific room records with new specifications
 * Rooms: D001/1, D002, C006
 */
async function updateRooms() {
  console.log('Updating room records...');

  try {
    // Update D001/1 - Informatika tanszéki kistárgyaló
    const result1 = await query(
      `UPDATE rooms 
       SET name = $1,
           name_en = $2, 
           name_hu = $3, 
           capacity = $4, 
           description_en = $5, 
           description_hu = $6
       WHERE name = $7 OR name_hu LIKE '%kistárgyaló%'
       RETURNING id, name`,
      [
        'D001/1',
        'Computer Science Dept. Small Meeting Room',
        'Informatika tanszéki kistárgyaló',
        6,
        'Projector available on request',
        'Kivetítő kérhető',
        'D001/1'
      ]
    );
    
    if (result1.rows.length === 0) {
      console.log('Room D001/1 not found, creating new...');
      await query(
        `INSERT INTO rooms (name, name_en, name_hu, capacity, description_en, description_hu, floor, position_x, position_y, width, height, room_type, min_role, is_available)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          'D001/1',
          'Computer Science Department Small Meeting Room',
          'Informatika tanszéki kistárgyaló',
          6,
          'Projector available on request',
          'Kivetítő kérhető',
          1,
          80,
          100,
          180,
          100,
          'meeting',
          'user',
          true
        ]
      );
      console.log('✓ Room D001/1 created');
    } else {
      console.log('✓ Room D001/1 updated:', result1.rows[0]);
    }

    // Update D002 - Informatika tanszéki tárgyaló
    const result2 = await query(
      `UPDATE rooms 
       SET name = $1,
           name_en = $2, 
           name_hu = $3, 
           capacity = $4, 
           description_en = $5, 
           description_hu = $6
       WHERE name = $7 OR (name_hu LIKE '%Informatika%' AND name_hu LIKE '%tárgyaló%' AND capacity = 12)
       RETURNING id, name`,
      [
        'D002',
        'Computer Science Dept. Meeting Room',
        'Informatika tanszéki tárgyaló',
        12,
        'Flipchart, whiteboard',
        'Flipchart, fehér tábla',
        'D002'
      ]
    );
    
    if (result2.rows.length === 0) {
      console.log('Room D002 not found, creating new...');
      await query(
        `INSERT INTO rooms (name, name_en, name_hu, capacity, description_en, description_hu, floor, position_x, position_y, width, height, room_type, min_role, is_available)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          'D002',
          'Computer Science Department Meeting Room',
          'Informatika tanszéki tárgyaló',
          12,
          'Flipchart, whiteboard',
          'Flipchart, fehér tábla',
          1,
          320,
          100,
          180,
          100,
          'meeting',
          'instructor',
          true
        ]
      );
      console.log('✓ Room D002 created');
    } else {
      console.log('✓ Room D002 updated:', result2.rows[0]);
    }

    // Update C006 - NATO sérülékenységvizsgálati labor
    const result3 = await query(
      `UPDATE rooms 
       SET name = $1,
           name_en = $2, 
           name_hu = $3, 
           capacity = $4, 
           description_en = $5, 
           description_hu = $6,
           position_x = $7,
           position_y = $8
       WHERE name = $9 OR name_hu LIKE '%NATO%'
       RETURNING id, name`,
      [
        'C006',
        'NATO Vulnerability Assessment Lab',
        'NATO sérülékenységvizsgálati labor',
        30,
        'Projector',
        'Kivetítő',
        320,
        250,
        'C006'
      ]
    );
    
    if (result3.rows.length === 0) {
      console.log('Room C006 not found, creating new...');
      await query(
        `INSERT INTO rooms (name, name_en, name_hu, capacity, description_en, description_hu, floor, position_x, position_y, width, height, room_type, min_role, is_available)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          'C006',
          'NATO Vulnerability Assessment Laboratory',
          'NATO sérülékenységvizsgálati labor',
          30,
          'Projector',
          'Kivetítő',
          1,
          320,
          250,
          180,
          100,
          'lab',
          'instructor',
          true
        ]
      );
      console.log('✓ Room C006 created');
    } else {
      console.log('✓ Room C006 updated:', result3.rows[0]);
    }

    console.log('\nRoom updates completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating rooms:', error);
    process.exit(1);
  }
}

updateRooms();
