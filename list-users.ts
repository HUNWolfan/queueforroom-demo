import { query } from './app/db.server';

async function listUsers() {
  const result = await query(
    'SELECT id, email, first_name, last_name, role, updated_at FROM users ORDER BY id',
    []
  );

  console.log(`\n📋 Total users: ${result.rows.length}\n`);
  
  result.rows.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Updated: ${user.updated_at || 'N/A'}`);
    console.log('');
  });

  process.exit(0);
}

listUsers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
