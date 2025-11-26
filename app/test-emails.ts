/**
 * Email Notification Test Script
 * Run with: npm run test:emails
 * 
 * This script tests all 6 email notification types
 */

import { 
  sendReservationConfirmation,
  sendReservationCancelled,
  sendReservationUpdated,
  sendReservationReminder,
  sendPermissionGranted,
  sendPermissionRejected
} from './services/email.server';

const testEmail = 'wrabl.marcell@gmail.com';
const testUserName = 'Marcell Wrabl';

const mockReservation = {
  roomName: 'Computer Lab 101',
  startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  purpose: 'Team project meeting'
};

async function runTests() {
  console.log('\n🧪 Testing Email Notifications...\n');
  console.log('📧 Target Email:', testEmail);
  console.log('⚙️  Environment:', process.env.NODE_ENV || 'production');
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    // Test 1: Reservation Confirmed
    console.log('1️⃣  Testing RESERVATION CONFIRMED...');
    await sendReservationConfirmation(
      testEmail,
      testUserName,
      mockReservation
    );
    console.log('   ✅ Reservation Confirmed email sent\n');

    // Small delay between emails
    await delay(1000);

    // Test 2: Reservation Cancelled
    console.log('2️⃣  Testing RESERVATION CANCELLED...');
    await sendReservationCancelled(
      testEmail,
      testUserName,
      mockReservation,
      'en'
    );
    console.log('   ✅ Reservation Cancelled email sent\n');

    await delay(1000);

    // Test 3: Reservation Updated
    console.log('3️⃣  Testing RESERVATION UPDATED...');
    await sendReservationUpdated(
      testEmail,
      testUserName,
      mockReservation,
      'en'
    );
    console.log('   ✅ Reservation Updated email sent\n');

    await delay(1000);

    // Test 4: Reservation Reminder
    console.log('4️⃣  Testing RESERVATION REMINDER...');
    await sendReservationReminder(
      testEmail,
      testUserName,
      mockReservation,
      'en'
    );
    console.log('   ✅ Reservation Reminder email sent\n');

    await delay(1000);

    // Test 5: Permission Granted
    console.log('5️⃣  Testing PERMISSION GRANTED...');
    await sendPermissionGranted(
      testEmail,
      testUserName,
      'reserve', // or 'override'
      'en'
    );
    console.log('   ✅ Permission Granted email sent\n');

    await delay(1000);

    // Test 6: Permission Rejected
    console.log('6️⃣  Testing PERMISSION REJECTED...');
    await sendPermissionRejected(
      testEmail,
      testUserName,
      'The room is already booked for another class during this time.',
      'en'
    );
    console.log('   ✅ Permission Rejected email sent\n');

    console.log('='.repeat(60));
    console.log('\n✨ All email tests completed successfully!');
    console.log('\n📬 Check your inbox at:', testEmail);
    console.log('   (If NODE_ENV=development, check console output instead)\n');

  } catch (error) {
    console.error('\n❌ Error during email tests:', error);
    process.exit(1);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run tests
runTests().then(() => {
  console.log('🎉 Test script finished');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
