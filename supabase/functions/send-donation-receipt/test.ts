// Test script for send-donation-receipt Edge Function
// Run with: deno run --allow-net --allow-env test.ts

const FUNCTION_URL = 'http://localhost:54321/functions/v1/send-donation-receipt'
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'your-anon-key'

// Test data
const testRequest = {
  donationId: 'test-donation-id', // Replace with actual donation ID from your database
  recipientEmail: 'test@example.com', // Replace with your test email
  organizationId: 'test-org-id', // Replace with actual organization ID
}

async function testFunction() {
  console.log('Testing send-donation-receipt function...')
  console.log('Request:', JSON.stringify(testRequest, null, 2))

  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest),
    })

    const data = await response.json()

    console.log('\nResponse Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log('\n✅ SUCCESS: Email sent successfully!')
      console.log('Receipt Number:', data.receiptNumber)
      console.log('Message ID:', data.messageId)
    } else {
      console.log('\n❌ ERROR: Failed to send email')
      console.log('Error:', data.error)
    }
  } catch (error) {
    console.error('\n❌ EXCEPTION:', error.message)
  }
}

// Run test
testFunction()
