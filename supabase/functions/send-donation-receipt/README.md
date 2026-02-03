# Send Donation Receipt - Supabase Edge Function

This Edge Function sends email receipts for donations using the Resend API.

## Features

- Professional HTML email template with organization branding
- Tax-deductible donation notice
- Receipt number generation (format: YYYY-MMDD-XXXXX)
- Organization logo and contact information
- Donation details (amount, fund, payment method, date)
- Quranic verse footer
- Automatic update of donation record (receipt_sent, receipt_sent_at)

## Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Configure Resend API

1. Sign up at [Resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Set the environment variable:

**For local development:**
```bash
# Create .env file in supabase/functions/
echo "RESEND_API_KEY=your_api_key_here" > supabase/functions/.env
```

**For production (Supabase Cloud):**
```bash
# Set secret via Supabase CLI
supabase secrets set RESEND_API_KEY=your_api_key_here
```

Or via Supabase Dashboard:
- Go to Project Settings > Edge Functions
- Add secret: `RESEND_API_KEY`

### 3. Deploy the Function

**Deploy to Supabase Cloud:**
```bash
supabase functions deploy send-donation-receipt
```

**Test locally:**
```bash
# Start Supabase local development
supabase start

# Serve function locally
supabase functions serve send-donation-receipt
```

### 4. Test the Function

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-donation-receipt' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"donationId":"uuid-here","recipientEmail":"donor@example.com","organizationId":"org-uuid-here"}'
```

## API Interface

### Request

**Endpoint:** `POST /send-donation-receipt`

**Headers:**
- `Authorization: Bearer <anon_key>` or `apikey: <anon_key>`
- `Content-Type: application/json`

**Body:**
```json
{
  "donationId": "uuid",
  "recipientEmail": "donor@example.com",
  "organizationId": "uuid"
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "messageId": "resend-message-id",
  "receiptNumber": "2026-0203-ABC12"
}
```

**Error (400/404/500):**
```json
{
  "error": "Error message",
  "details": {...}
}
```

## Email Template

The email includes:

1. **Header**
   - Organization logo (if available)
   - Organization name
   - "Donation Receipt" title

2. **Content**
   - Personalized greeting
   - Receipt number and date
   - Donation amount (large, centered)
   - Details table:
     - Fund name
     - Payment method
     - Donation type
     - Reference number (if available)

3. **Tax Notice** (if tax-deductible)
   - Yellow highlighted box
   - Tax-deductible statement

4. **Organization Info**
   - Full address
   - Contact email
   - Contact phone
   - Website

5. **Footer**
   - Quranic verse (2:261)
   - Contact information
   - Copyright notice

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | API key from Resend.com |
| `SUPABASE_URL` | Auto | Provided by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto | Provided by Supabase |

## Security

- Uses service role key for database access (bypasses RLS)
- Validates all required fields
- CORS headers configured for frontend access
- Errors logged but sensitive info not exposed to client

## Error Handling

The function handles:
- Missing required fields (400)
- Donation not found (404)
- Organization not found (404)
- Email service errors (500)
- Database update errors (logged, doesn't fail request)

## Integration

The function is called from the frontend via:

```typescript
import { supabase } from '@/lib/supabase/client'

const { data, error } = await supabase.functions.invoke('send-donation-receipt', {
  body: {
    donationId: 'uuid',
    recipientEmail: 'donor@example.com',
    organizationId: 'uuid'
  }
})
```

## Troubleshooting

**Email not sending:**
1. Check RESEND_API_KEY is set correctly
2. Verify email domain is verified in Resend dashboard
3. Check Supabase function logs: `supabase functions logs send-donation-receipt`

**Receipt not updating:**
1. Check database permissions
2. Verify donation ID is correct
3. Check Supabase logs for errors

**Template not rendering:**
1. Verify organization has valid data
2. Check donation has member and fund data
3. Test HTML template in browser

## Resend Configuration

### Domain Verification

For production, verify your domain in Resend:

1. Go to Resend Dashboard > Domains
2. Add your domain (e.g., `mosqos.com`)
3. Add DNS records (SPF, DKIM, DMARC)
4. Update `from` address in function (line 213)

### Rate Limits

Resend free tier:
- 100 emails/day
- 3,000 emails/month

For production, upgrade to a paid plan.

## Maintenance

- Update HTML template for design changes
- Monitor Resend dashboard for bounce rates
- Check function logs regularly
- Update Quranic verse translations if needed

## Future Improvements

- [ ] PDF attachment generation
- [ ] Multi-language support (AR, TR)
- [ ] Custom branding per organization
- [ ] Email templates library
- [ ] Yearly tax summary emails
- [ ] Retry logic for failed emails
- [ ] Email delivery status webhooks
