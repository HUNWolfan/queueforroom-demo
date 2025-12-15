import { query } from './db.server';

async function setAdmin() {
  console.log('Setting wrabl.marcell@gmail.com as admin...');
  
  await query(
    `UPDATE users SET role = 'admin' WHERE email = $1`,
    ['wrabl.marcell@gmail.com']
  );
  
  const result = await query(
    `SELECT email, role FROM users WHERE email = $1`,
    ['wrabl.marcell@gmail.com']
  );
  
  if (result.rows.length > 0) {
    console.log('✅ User updated:', result.rows[0]);
  } else {
    console.log('❌ User not found');
  }
  
  process.exit(0);
}

setAdmin().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
