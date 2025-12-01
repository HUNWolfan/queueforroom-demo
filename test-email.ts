import { config } from 'dotenv';
config();

import { Resend } from 'resend';

async function testEmail() {
  console.log('Testing Resend email...');
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('FROM_EMAIL:', process.env.FROM_EMAIL);
  console.log('TEST_EMAIL_OVERRIDE:', process.env.TEST_EMAIL_OVERRIDE);
  console.log('SEND_REAL_EMAILS:', process.env.SEND_REAL_EMAILS);
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set!');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    const data = await resend.emails.send({
      from: `QueueForRoom <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: [process.env.TEST_EMAIL_OVERRIDE || 'wrabl.marcell@gmail.com'],
      subject: 'Test Email from QueueForRoom',
      html: '<h1>Test Email</h1><p>If you received this, the email configuration is working!</p>',
    });

    console.log('✅ Email sent successfully!');
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data && typeof data === 'object' && 'id' in data) {
      console.log('Message ID:', data.id);
    } else if (data && typeof data === 'object' && 'error' in data) {
      console.error('API returned error:', (data as any).error);
    } else {
      console.log('Unexpected response format:', data);
    }
  } catch (error: any) {
    console.error('❌ Email sending failed:');
    console.error('Error:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}

testEmail();
