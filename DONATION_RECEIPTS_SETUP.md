# Donation Email Receipts Setup Guide

This guide explains how to set up and use the email receipt functionality for donations.

## Overview

When an admin clicks "Send Receipt" for a donation, the system:
1. Calls a Supabase Edge Function
2. Edge Function fetches donation and organization details
3. Generates a professional HTML email using the data
4. Sends email via Resend API
5. Updates the donation record (receipt_sent = true)

## Architecture

```
Frontend (donations.service.ts)
    ↓
Supabase Edge Function (send-donation-receipt)
    ↓
Resend API (email delivery)
```

## Setup Instructions

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Sign up for Resend

1. Go to [Resend.com](https://resend.com)
2. Create an account
3. Get your API key from the dashboard

### 3. Configure Environment Variables

#### For Local Development:

Create `supabase/functions/.env`:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

#### For Production (Supabase Cloud):

Set secrets via CLI:
```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

Or via Supabase Dashboard:
1. Go to your project
2. Navigate to: Project Settings > Edge Functions
3. Add secret: `RESEND_API_KEY`

### 4. Deploy Edge Function

#### To Supabase Cloud:
```bash
supabase functions deploy send-donation-receipt
```

#### Test Locally:
```bash
# Start local Supabase
supabase start

# Serve function locally
supabase functions serve send-donation-receipt

# In another terminal, test the function
cd supabase/functions/send-donation-receipt
deno run --allow-net --allow-env test.ts
```

### 5. Verify Domain (Production Only)

For production emails, verify your domain in Resend:

1. Go to Resend Dashboard > Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `mosqos.com`)
4. Add the provided DNS records to your domain provider:
   - SPF record
   - DKIM record
   - DMARC record (optional but recommended)
5. Wait for verification (usually 15-30 minutes)

### 6. Update Organization Email

Make sure each organization has a valid `contact_email` set in the database. This will be used as the "from" address for receipts.

```sql
UPDATE organizations
SET contact_email = 'noreply@your-mosque.com'
WHERE id = 'your-org-id';
```

## Usage

### From Admin Panel

1. Navigate to Donations module
2. Click on a donation to view details
3. Click "Send Receipt" button
4. System sends email and marks receipt_sent = true

### From Code

```typescript
import { donationsService } from '@/features/donations/services/donations.service'

// Send receipt
await donationsService.sendReceipt(donationId)
```

## Email Template Features

The receipt email includes:

- **Header**: Organization logo and name
- **Receipt Info**: Receipt number and date
- **Amount**: Large, prominent display
- **Details**: Fund, payment method, donation type, reference number
- **Tax Notice**: For tax-deductible donations
- **Organization Info**: Full contact details
- **Quranic Verse**: Inspirational footer
- **Branding**: Uses organization's primary color

## Receipt Number Format

Format: `YYYY-MMDD-XXXXX`

Example: `2026-0203-ABC12`

- `YYYY`: Year
- `MMDD`: Month and day
- `XXXXX`: Last 5 characters of donation UUID (uppercase)

## Testing

### 1. Test with Real Data

```bash
# Create a test donation in your database
# Get the donation ID and organization ID

# Update test.ts with real IDs
cd supabase/functions/send-donation-receipt
nano test.ts

# Run test
deno run --allow-net --allow-env test.ts
```

### 2. Test from Frontend

```typescript
// In browser console or component
const { data, error } = await supabase.functions.invoke('send-donation-receipt', {
  body: {
    donationId: 'your-donation-uuid',
    recipientEmail: 'test@example.com',
    organizationId: 'your-org-uuid'
  }
})

console.log({ data, error })
```

### 3. Verify Email Delivery

1. Check recipient inbox (and spam folder)
2. Check Resend dashboard for delivery status
3. Check Supabase function logs:
```bash
supabase functions logs send-donation-receipt
```

## Troubleshooting

### Issue: Email not sending

**Solution:**
1. Check RESEND_API_KEY is set correctly
2. Verify API key has permissions in Resend dashboard
3. Check Resend dashboard for errors
4. Verify email domain is verified (for production)

### Issue: "Donation not found" error

**Solution:**
1. Verify donation ID is correct
2. Check donation exists in database
3. Ensure RLS policies allow access

### Issue: "No email address found"

**Solution:**
1. Verify donation has a member_id
2. Check member record has a valid email
3. For anonymous donations, add manual email field

### Issue: Receipt not updating

**Solution:**
1. Check database permissions for donations table
2. Verify Edge Function has service role key access
3. Check Supabase logs for update errors

### Issue: Template not rendering correctly

**Solution:**
1. Test HTML in browser first
2. Verify organization has all required fields
3. Check donation has member and fund relationships
4. Validate logo_url is accessible

## Rate Limits

### Resend Free Tier:
- 100 emails/day
- 3,000 emails/month

### Resend Paid Plans:
- Grow Plan: $20/month for 50,000 emails
- Pro Plan: Custom pricing

Monitor usage in Resend dashboard.

## Security Considerations

1. **API Key Protection**: Never commit RESEND_API_KEY to git
2. **Service Role Key**: Only used in Edge Function, never exposed to client
3. **Email Validation**: Function validates recipient email exists
4. **Rate Limiting**: Consider implementing rate limiting for production
5. **Audit Trail**: All receipts logged with receipt_sent_at timestamp

## Maintenance

### Regular Tasks:
- [ ] Monitor Resend dashboard for bounce rates
- [ ] Check Supabase function logs weekly
- [ ] Review email template for updates
- [ ] Verify domain records quarterly
- [ ] Update API keys annually

### Monitoring:
```bash
# View function logs
supabase functions logs send-donation-receipt --tail

# Check Resend analytics
# Visit: https://resend.com/analytics
```

## Cost Estimation

### Resend Pricing:
- Free: Up to 3,000 emails/month
- Grow: $20/month for 50,000 emails
- Pro: Custom for higher volumes

### Supabase Edge Functions:
- Free: 500,000 invocations/month
- Pro: 2,000,000 invocations/month

**Example Cost for 1,000 donations/month:**
- Resend: Free tier sufficient
- Supabase: Free tier sufficient
- **Total: $0/month**

## Future Enhancements

Potential improvements:

1. **PDF Attachments**
   - Generate PDF receipt
   - Attach to email
   - Store in Supabase Storage

2. **Multi-language Support**
   - Arabic (RTL)
   - Turkish
   - Auto-detect from organization settings

3. **Batch Sending**
   - Send multiple receipts at once
   - Year-end tax summaries
   - Annual giving statements

4. **Templates Library**
   - Multiple email templates
   - Seasonal themes (Ramadan, etc.)
   - Custom branding per organization

5. **Email Tracking**
   - Open rates
   - Click tracking
   - Delivery confirmation webhooks

6. **Retry Logic**
   - Auto-retry failed emails
   - Queue system for offline handling

## Support

For issues or questions:
1. Check Supabase function logs
2. Check Resend dashboard
3. Review this documentation
4. Contact development team

## References

- [Resend Documentation](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Deploy](https://deno.com/deploy/docs)

---

**Last Updated**: February 2026
**Version**: 1.0.0
