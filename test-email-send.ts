import 'dotenv/config';
import { sendPasswordResetEmail, sendWelcomeEmail } from './app/services/email.server';

async function testEmailSending() {
  console.log('\n🧪 Testing Email Service...\n');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Send Real Emails:', process.env.SEND_REAL_EMAILS);
  console.log('Resend API Key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
  console.log('Test Email Override:', process.env.TEST_EMAIL_OVERRIDE);
  console.log('\n');

  // Test 1: Password Reset Email
  console.log('📧 Test 1: Sending password reset email...\n');
  const resetResult = await sendPasswordResetEmail(
    'test@example.com',
    'test-token-123456',
    'http://localhost:5173'
  );
  
  console.log('\nResult:', resetResult.success ? '✅ SUCCESS' : '❌ FAILED');
  if (resetResult.error) {
    console.error('Error:', resetResult.error);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Welcome Email
  console.log('📧 Test 2: Sending welcome email...\n');
  const welcomeResult = await sendWelcomeEmail(
    'newuser@example.com',
    'Test User',
    'verification-token-789',
    'http://localhost:5173',
    'en'
  );
  
  console.log('\nResult:', welcomeResult.success ? '✅ SUCCESS' : '❌ FAILED');
  if (welcomeResult.error) {
    console.error('Error:', welcomeResult.error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Email testing complete!');
  console.log('\nIf SEND_REAL_EMAILS=true, check your inbox at:', process.env.TEST_EMAIL_OVERRIDE);
  console.log('\n');
}

testEmailSending().catch(console.error);
