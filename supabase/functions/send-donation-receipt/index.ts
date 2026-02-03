// Supabase Edge Function: send-donation-receipt
// Sends email receipt for donations using Resend API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface DonationReceiptRequest {
  donationId: string
  recipientEmail: string
  organizationId: string
}

interface Donation {
  id: string
  amount: number
  currency: string
  donation_date: string
  payment_method: string
  donation_type: string
  reference_number: string | null
  is_tax_deductible: boolean
  member: {
    first_name: string
    last_name: string
    email: string
  } | null
  fund: {
    name: string
    fund_type: string
  } | null
}

interface Organization {
  id: string
  name: string
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  website: string | null
  primary_color: string
}

// Helper function to format currency
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount)
}

// Helper function to format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Generate receipt HTML template
function generateReceiptHTML(
  donation: Donation,
  organization: Organization,
  receiptNumber: string
): string {
  const donorName = donation.member
    ? `${donation.member.first_name} ${donation.member.last_name}`
    : 'Anonymous Donor'

  const orgAddress = [
    organization.address_line1,
    organization.address_line2,
    [organization.city, organization.state].filter(Boolean).join(', '),
    organization.postal_code,
  ]
    .filter(Boolean)
    .join('<br>')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donation Receipt - ${organization.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: ${organization.primary_color || '#10B981'};
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header img {
      max-width: 120px;
      max-height: 80px;
      margin-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .receipt-info {
      background: #f8f9fa;
      border-left: 4px solid ${organization.primary_color || '#10B981'};
      padding: 15px;
      margin: 20px 0;
    }
    .receipt-info p {
      margin: 5px 0;
    }
    .amount-box {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 6px;
      margin: 20px 0;
    }
    .amount-box .label {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    .amount-box .amount {
      font-size: 36px;
      font-weight: bold;
      color: ${organization.primary_color || '#10B981'};
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .details-table td {
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    .details-table td:first-child {
      font-weight: 600;
      color: #666;
      width: 40%;
    }
    .tax-notice {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
    }
    .tax-notice strong {
      color: #856404;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .footer a {
      color: ${organization.primary_color || '#10B981'};
      text-decoration: none;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: ${organization.primary_color || '#10B981'};
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${organization.logo_url ? `<img src="${organization.logo_url}" alt="${organization.name} Logo">` : ''}
      <h1>${organization.name}</h1>
      <p>Donation Receipt</p>
    </div>

    <div class="content">
      <p>Dear ${donorName},</p>

      <p>Thank you for your generous donation. May Allah accept your contribution and grant you the best rewards.</p>

      <div class="receipt-info">
        <p><strong>Receipt Number:</strong> ${receiptNumber}</p>
        <p><strong>Date:</strong> ${formatDate(donation.donation_date)}</p>
      </div>

      <div class="amount-box">
        <div class="label">Donation Amount</div>
        <div class="amount">${formatCurrency(donation.amount, donation.currency)}</div>
      </div>

      <table class="details-table">
        <tr>
          <td>Fund</td>
          <td>${donation.fund?.name || 'General Fund'}</td>
        </tr>
        <tr>
          <td>Payment Method</td>
          <td>${donation.payment_method.replace('_', ' ').toUpperCase()}</td>
        </tr>
        <tr>
          <td>Donation Type</td>
          <td>${donation.donation_type.replace('_', ' ').toUpperCase()}</td>
        </tr>
        ${donation.reference_number ? `
        <tr>
          <td>Reference Number</td>
          <td>${donation.reference_number}</td>
        </tr>
        ` : ''}
      </table>

      ${donation.is_tax_deductible ? `
      <div class="tax-notice">
        <strong>Tax Deductible Donation</strong>
        <p>This donation is tax-deductible to the extent allowed by law. Please keep this receipt for your tax records. No goods or services were provided in exchange for this donation.</p>
      </div>
      ` : ''}

      <p style="margin-top: 30px;">
        <strong>Organization Information:</strong><br>
        ${organization.name}<br>
        ${orgAddress ? `${orgAddress}<br>` : ''}
        ${organization.contact_email ? `Email: ${organization.contact_email}<br>` : ''}
        ${organization.contact_phone ? `Phone: ${organization.contact_phone}<br>` : ''}
        ${organization.website ? `Website: <a href="${organization.website}">${organization.website}</a><br>` : ''}
      </p>

      <p style="margin-top: 30px; font-style: italic; color: #666;">
        "The example of those who spend their wealth in the way of Allah is like a seed [of grain] which grows seven spikes; in each spike is a hundred grains. And Allah multiplies [His reward] for whom He wills."<br>
        <strong>— Quran 2:261</strong>
      </p>
    </div>

    <div class="footer">
      <p>This is an automated receipt. Please do not reply to this email.</p>
      ${organization.contact_email ? `<p>For questions, contact us at <a href="mailto:${organization.contact_email}">${organization.contact_email}</a></p>` : ''}
      <p>&copy; ${new Date().getFullYear()} ${organization.name}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { donationId, recipientEmail, organizationId }: DonationReceiptRequest = await req.json()

    if (!donationId || !recipientEmail || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: donationId, recipientEmail, organizationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate RESEND_API_KEY
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch donation details
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .select(`
        *,
        member:members(first_name, last_name, email),
        fund:funds(name, fund_type)
      `)
      .eq('id', donationId)
      .single()

    if (donationError || !donation) {
      console.error('Donation not found:', donationError)
      return new Response(
        JSON.stringify({ error: 'Donation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      console.error('Organization not found:', orgError)
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate receipt number (format: YYYY-MMDD-XXXXX where XXXXX is last 5 chars of donation ID)
    const receiptNumber = `${new Date().getFullYear()}-${
      new Date(donation.donation_date).toISOString().slice(5, 10).replace('-', '')
    }-${donation.id.slice(-5).toUpperCase()}`

    // Generate HTML email
    const htmlContent = generateReceiptHTML(donation as unknown as Donation, organization as unknown as Organization, receiptNumber)

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: organization.contact_email || 'noreply@mosqos.com',
        to: recipientEmail,
        subject: `Donation Receipt - ${organization.name}`,
        html: htmlContent,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: resendData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update donation record to mark receipt as sent
    const { error: updateError } = await supabase
      .from('donations')
      .update({
        receipt_sent: true,
        receipt_sent_at: new Date().toISOString(),
      })
      .eq('id', donationId)

    if (updateError) {
      console.error('Failed to update donation record:', updateError)
      // Don't fail the request since email was sent successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendData.id,
        receiptNumber,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-donation-receipt function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
