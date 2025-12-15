import { query } from './db.server';
import bcrypt from 'bcryptjs';

/**
 * Adatbázis feltöltése kezdeti adatokkal
 * Teszt felhasználók és termek létrehozása fejlesztéshez és teszteléshez
 */
async function seed() {
  console.log('Adatbázis feltöltése...');

  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Admin felhasználó létrehozása
  await query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role) 
     VALUES ($1, $2, $3, $4, $5) 
     ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role`,
    ['admin@school.com', hashedPassword, 'Admin', 'Adminisztrátor', 'admin']
  );

  // Előadó felhasználó létrehozása
  await query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role) 
     VALUES ($1, $2, $3, $4, $5) 
     ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role`,
    ['instructor@school.com', hashedPassword, 'Kovács', 'János', 'instructor']
  );

  // Felhasználó létrehozása (user role)
  await query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role) 
     VALUES ($1, $2, $3, $4, $5) 
     ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role`,
    ['user@school.com', hashedPassword, 'Nagy', 'Péter', 'user']
  );

  // Egyszerűsített épület elrendezés - 4 terem emeletenként (2×2 rács)
  const rooms = [
    // 1. emelet - 4 terem
    { name: 'Classroom 101', name_en: 'Classroom 101', name_hu: '101-es Osztályterem', capacity: 30, desc_en: 'Standard classroom', desc_hu: 'Szabványos osztályterem', floor: 1, x: 80, y: 100, w: 180, h: 100, type: 'standard', minRole: 'user' },
    { name: 'Computer Lab', name_en: 'Computer Lab', name_hu: 'Számítógépes Labor', capacity: 25, desc_en: 'Computer laboratory', desc_hu: 'Számítógépes labor', floor: 1, x: 320, y: 100, w: 180, h: 100, type: 'lab', minRole: 'user' },
    { name: 'Staff Room', name_en: 'Staff Room', name_hu: 'Tanári Szoba', capacity: 15, desc_en: 'Staff only area', desc_hu: 'Csak tanároknak', floor: 1, x: 80, y: 250, w: 180, h: 100, type: 'office', minRole: 'instructor' },
    { name: 'Server Room', name_en: 'Server Room', name_hu: 'Szerverterem', capacity: 5, desc_en: 'Admin only', desc_hu: 'Csak adminoknak', floor: 1, x: 320, y: 250, w: 180, h: 100, type: 'restricted', minRole: 'admin' },
    
    // 2. emelet - 4 terem
    { name: 'Library', name_en: 'Library', name_hu: 'Könyvtár', capacity: 50, desc_en: 'School library', desc_hu: 'Iskolai könyvtár', floor: 2, x: 80, y: 100, w: 180, h: 100, type: 'library', minRole: 'user' },
    { name: 'Science Lab', name_en: 'Science Lab', name_hu: 'Tudományos Labor', capacity: 20, desc_en: 'Science laboratory', desc_hu: 'Tudományos labor', floor: 2, x: 320, y: 100, w: 180, h: 100, type: 'lab', minRole: 'user' },
    { name: 'Conference Room', name_en: 'Conference Room', name_hu: 'Tárgyalóterem', capacity: 30, desc_en: 'Instructor access', desc_hu: 'Előadói hozzáférés', floor: 2, x: 80, y: 250, w: 180, h: 100, type: 'meeting', minRole: 'instructor' },
    { name: 'Principal Office', name_en: 'Principal Office', name_hu: 'Igazgatói Iroda', capacity: 10, desc_en: 'Admin only', desc_hu: 'Csak adminoknak', floor: 2, x: 320, y: 250, w: 180, h: 100, type: 'restricted', minRole: 'admin' },
  ];

  // Termek beszúrása az adatbázisba
  for (const room of rooms) {
    await query(
      `INSERT INTO rooms (name, name_en, name_hu, capacity, description_en, description_hu, floor, position_x, position_y, width, height, room_type, min_role, is_available) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (name) DO NOTHING`,
      [room.name, room.name_en, room.name_hu, room.capacity, room.desc_en, room.desc_hu, room.floor, room.x, room.y, room.w, room.h, room.type, room.minRole, true]
    );
  }

  console.log('Adatbázis feltöltés sikeresen befejezve!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Adatbázis feltöltés sikertelen:', err);
  process.exit(1);
});
