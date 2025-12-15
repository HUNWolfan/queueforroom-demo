import bcrypt from 'bcryptjs';
import { query } from './app/db.server';

async function testPassword() {
  const email = 'HUNGTX2222@gmail.com';
  const testPassword = process.argv[2] || 'test123'; // Get password from command line

  console.log(`\n🔍 Testing password for: ${email}`);
  console.log(`📝 Test password: ${testPassword}\n`);

  // Get user from database (case-insensitive)
  const result = await query(
    'SELECT email, password_hash, updated_at FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  if (result.rows.length === 0) {
    console.log('❌ User not found in database!');
    process.exit(1);
  }

  const user = result.rows[0];
  console.log('✅ User found:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Password Hash: ${user.password_hash}`);
  console.log(`   Last Updated: ${user.updated_at}\n`);

  // Test password
  const isValid = await bcrypt.compare(testPassword, user.password_hash);
  
  if (isValid) {
    console.log('✅ ✅ ✅ PASSWORD IS VALID! ✅ ✅ ✅\n');
  } else {
    console.log('❌ ❌ ❌ PASSWORD IS INVALID! ❌ ❌ ❌');
    console.log('\n💡 Trying to hash the test password to compare:');
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log(`   New hash would be: ${newHash}`);
    console.log(`   Current hash is:   ${user.password_hash}`);
    console.log('\n⚠️  These should be different (bcrypt uses random salt)\n');
  }

  process.exit(0);
}

testPassword().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
