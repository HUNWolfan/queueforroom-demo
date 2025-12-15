import { query } from './db.server';

/**
 * Update existing room names with English and Hungarian translations
 */
async function updateRoomNames() {
  console.log('Updating existing room names with translations...');

  const updates = [
    { name: 'Classroom 101', name_en: 'Classroom 101', name_hu: '101-es Osztályterem' },
    { name: 'Computer Lab', name_en: 'Computer Lab', name_hu: 'Számítógépes Labor' },
    { name: 'Staff Room', name_en: 'Staff Room', name_hu: 'Tanári Szoba' },
    { name: 'Server Room', name_en: 'Server Room', name_hu: 'Szerverterem' },
    { name: 'Library', name_en: 'Library', name_hu: 'Könyvtár' },
    { name: 'Science Lab', name_en: 'Science Lab', name_hu: 'Tudományos Labor' },
    { name: 'Conference Room', name_en: 'Conference Room', name_hu: 'Tárgyalóterem' },
    { name: 'Principal Office', name_en: 'Principal Office', name_hu: 'Igazgatói Iroda' },
  ];

  try {
    for (const room of updates) {
      await query(
        `UPDATE rooms SET name_en = $1, name_hu = $2 WHERE name = $3`,
        [room.name_en, room.name_hu, room.name]
      );
      console.log(`✓ Updated: ${room.name}`);
    }

    console.log('✅ All room names updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating room names:', error);
    process.exit(1);
  }
}

updateRoomNames();
