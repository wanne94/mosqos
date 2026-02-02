# MosqOS Deployment Guide

> **Last Updated**: February 2026
> **Target Environment**: Production
> **Prerequisites**: Node.js 18+, Supabase account, Stripe account, Domain with SSL

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Supabase Setup](#supabase-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Migrations](#database-migrations)
5. [Hosting Deployment](#hosting-deployment)
6. [DNS Configuration](#dns-configuration)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] **Code Quality**
  - [ ] All tests passing (`npm test`)
  - [ ] Build succeeds (`npm run build`)
  - [ ] ESLint passes (`npm run lint`)
  - [ ] No TypeScript errors (`tsc --noEmit`)

- [ ] **Security**
  - [ ] RLS policies enabled on ALL database tables
  - [ ] Service role key NOT exposed in client code
  - [ ] CORS configured correctly in Supabase
  - [ ] Authentication redirects configured

- [ ] **Services**
  - [ ] Production Supabase project created
  - [ ] Stripe production keys obtained
  - [ ] Domain purchased and DNS accessible
  - [ ] SSL certificate ready (usually automatic with hosting)

- [ ] **Data**
  - [ ] Database schema migrated to production
  - [ ] Seed data loaded (subscription plans, countries, etc.)
  - [ ] Default platform admin user created

---

## 🗄️ Supabase Setup

### 1. Create Production Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and region (select closest to your users)
4. Set strong database password (save securely!)
5. Wait for project provisioning (~2 minutes)

### 2. Get API Credentials

Navigate to: **Settings** → **API**

Copy these values:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon public key**: `eyJhbGc...` (starts with `eyJ`)

⚠️ **NEVER use service_role key in production client code!**

### 3. Configure Authentication

Navigate to: **Authentication** → **URL Configuration**

Set these URLs:
- **Site URL**: `https://your-domain.com`
- **Redirect URLs**: Add these patterns:
  ```
  https://your-domain.com/**
  https://your-domain.com/auth/callback
  ```

Navigate to: **Authentication** → **Providers**

Enable:
- [x] Email (Password)
- [x] Magic Link (optional)
- [ ] OAuth providers (optional: Google, GitHub, etc.)

### 4. Configure Storage

Navigate to: **Storage** → **Policies**

Create policies for:
- `organization_logos` bucket
- `receipts` bucket
- `certificates` bucket

Example policy (read-only for authenticated users):
```sql
CREATE POLICY "Authenticated users can view organization logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'organization_logos');
```

---

## ⚙️ Environment Configuration

### 1. Create Production Environment File

```bash
cp .env.production.example .env.production
```

### 2. Fill in Production Values

Edit `.env.production`:

```bash
# Supabase (from step above)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key

# Stripe Production Keys (from Stripe Dashboard > API keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Your Production Domain
VITE_APP_URL=https://your-domain.com
VITE_APP_NAME=MosqOS

# DO NOT SET THIS IN PRODUCTION:
# VITE_SUPABASE_SERVICE_ROLE_KEY=xxx
```

### 3. Verify Configuration

```bash
# Check env file syntax
cat .env.production | grep -v "^#" | grep -v "^$"

# Test build with production env
npm run build
```

---

## 🔄 Database Migrations

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Link to Production Project

```bash
# Login to Supabase
supabase login

# Link to your production project
supabase link --project-ref your-project-id
```

You'll be prompted for database password (from step 1 of Supabase Setup).

### 3. Run Migrations

```bash
# Apply all migrations to production
supabase db push

# Verify migrations applied
supabase db diff
```

**Expected migrations** (should see ~21 migration files):
- `20240101000000_initial_schema.sql`
- `20240102000000_create_organizations.sql`
- `20240103000000_create_members.sql`
- `20240104000000_create_donations.sql`
- ... (and others)

### 4. Seed Production Data

**⚠️ Important**: Only seed reference data, NOT test/dummy data!

```bash
# Seed subscription plans
npm run seed:plans

# Seed countries
npm run seed:countries

# Seed default permission groups
npm run seed:permissions
```

### 5. Create Platform Admin User

**Option A**: Via Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click "Add User"
3. Enter admin email and generate password
4. Confirm user email manually
5. Run SQL to grant platform admin:

```sql
INSERT INTO platform_admins (user_id, email, created_at)
VALUES (
  'user-uuid-from-auth-users-table',
  'admin@your-domain.com',
  NOW()
);
```

**Option B**: Via SQL Script

```sql
-- Create auth user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@your-domain.com',
  crypt('CHANGE_THIS_PASSWORD', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) RETURNING id;

-- Grant platform admin (use ID from above)
INSERT INTO platform_admins (user_id, email)
VALUES ('user-id-from-above', 'admin@your-domain.com');
```

---

## 🚀 Hosting Deployment

### Option 1: Vercel (Recommended)

#### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/mosqos)

#### Manual Deploy

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables** (in Vercel Dashboard)
   - Go to: Project Settings → Environment Variables
   - Add all variables from `.env.production`
   - Make sure to select "Production" environment

5. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

6. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Initialize**
   ```bash
   netlify init
   ```

4. **Configure Build Settings** (`netlify.toml`)
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

5. **Set Environment Variables**
   ```bash
   netlify env:set VITE_SUPABASE_URL "https://xxx.supabase.co"
   netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGc..."
   netlify env:set VITE_STRIPE_PUBLISHABLE_KEY "pk_live_..."
   netlify env:set VITE_APP_URL "https://your-domain.com"
   netlify env:set VITE_APP_NAME "MosqOS"
   ```

6. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### Option 3: Self-Hosted (Docker)

1. **Create `Dockerfile`**
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Create `nginx.conf`**
   ```nginx
   server {
     listen 80;
     server_name _;
     root /usr/share/nginx/html;
     index index.html;

     location / {
       try_files $uri $uri/ /index.html;
     }

     # Security headers
     add_header X-Frame-Options "SAMEORIGIN" always;
     add_header X-Content-Type-Options "nosniff" always;
     add_header X-XSS-Protection "1; mode=block" always;
   }
   ```

3. **Build and Run**
   ```bash
   docker build -t mosqos .
   docker run -p 80:80 mosqos
   ```

---

## 🌐 DNS Configuration

### 1. Point Domain to Hosting Provider

**For Vercel:**
- Add CNAME record: `your-domain.com` → `cname.vercel-dns.com`
- Or use Vercel nameservers

**For Netlify:**
- Add CNAME record: `your-domain.com` → `your-site.netlify.app`
- Or use Netlify nameservers

**For Self-Hosted:**
- Add A record: `your-domain.com` → `your-server-ip`

### 2. Configure SSL Certificate

Most hosting providers (Vercel, Netlify) **automatically provision SSL** via Let's Encrypt.

For self-hosted, use Certbot:
```bash
sudo certbot --nginx -d your-domain.com
```

### 3. Verify DNS Propagation

```bash
# Check DNS resolution
nslookup your-domain.com

# Check SSL certificate
curl -I https://your-domain.com
```

---

## ✅ Post-Deployment Verification

### 1. Smoke Tests

Visit your production URL and test:

- [ ] **Landing Page** loads (`/`)
- [ ] **Login** works (`/login`)
- [ ] **Signup** flow works (`/signup`)
- [ ] **Platform Admin** dashboard accessible (`/platform/dashboard`)
- [ ] **Organization Admin** dashboard works (`/:slug/admin/dashboard`)
- [ ] **Member Portal** accessible (`/:slug/portal`)

### 2. Database Connectivity

Check Supabase logs:
- Go to: **Logs** → **Database**
- Verify connections are working
- No authentication errors

### 3. RLS Policy Verification

Test cross-tenant isolation:
1. Create Organization A with Member A
2. Create Organization B with Member B
3. Login as Member A
4. Attempt to access Organization B's data → should fail
5. Login as Platform Admin → should access all orgs

### 4. Stripe Integration

Test subscription flow:
1. Create organization
2. Go to billing page
3. Attempt to upgrade plan
4. Use Stripe test cards (even in production, for testing)
5. Verify webhook events in Stripe Dashboard

### 5. Email Delivery

Test authentication emails:
1. Sign up with new email
2. Request password reset
3. Check Supabase: **Authentication** → **Email Templates**
4. Verify emails delivered (check spam folder)

---

## 📊 Monitoring & Maintenance

### 1. Supabase Monitoring

**Database**
- Monitor query performance: **Database** → **Query Performance**
- Check disk usage: **Settings** → **Database**
- Set up alerts for high CPU/memory

**Authentication**
- Monitor failed login attempts
- Check for suspicious activity
- Review rate limiting logs

**Storage**
- Monitor storage usage
- Set up bucket size limits
- Enable automatic backups

### 2. Application Monitoring

**Error Tracking** (Optional)

Add Sentry for error tracking:
```bash
npm install @sentry/react
```

Configure in `src/main.tsx`:
```typescript
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
})
```

**Analytics** (Optional)

Add Google Analytics:
```typescript
// src/lib/analytics.ts
export const trackPageView = (url: string) => {
  if (window.gtag) {
    window.gtag('config', import.meta.env.VITE_GA_ID, {
      page_path: url,
    })
  }
}
```

### 3. Regular Maintenance Tasks

**Weekly:**
- [ ] Review error logs
- [ ] Check database performance
- [ ] Monitor storage usage

**Monthly:**
- [ ] Update dependencies (`npm update`)
- [ ] Review security advisories
- [ ] Backup database manually
- [ ] Test disaster recovery

**Quarterly:**
- [ ] Performance audit
- [ ] Security audit
- [ ] Update SSL certificates (if manual)
- [ ] Review and optimize database indexes

---

## 🔧 Troubleshooting

### Issue: Build Fails

**Symptom**: `npm run build` fails with errors

**Solutions**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build -- --no-minify

# Check environment variables
cat .env.production
```

### Issue: Database Connection Errors

**Symptom**: "Failed to connect to database" or RLS errors

**Solutions**:
1. Verify Supabase URL and anon key in `.env.production`
2. Check Supabase project status in dashboard
3. Verify network/firewall allows HTTPS to Supabase
4. Test connection:
   ```bash
   curl -I https://your-project-id.supabase.co
   ```

### Issue: Authentication Not Working

**Symptom**: Users can't sign up/login

**Solutions**:
1. Check Supabase Auth settings:
   - Site URL matches production domain
   - Redirect URLs configured correctly
   - Email templates enabled
2. Check CORS settings in Supabase
3. Verify email delivery (check spam folder)

### Issue: RLS Policies Blocking Legitimate Access

**Symptom**: Users see "permission denied" errors

**Solutions**:
1. Check user's organization membership:
   ```sql
   SELECT * FROM organization_members WHERE user_id = 'xxx';
   ```
2. Verify RLS policies in Supabase SQL Editor:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'members';
   ```
3. Test policy manually:
   ```sql
   SET ROLE authenticated;
   SET request.jwt.claim.sub = 'user-uuid';
   SELECT * FROM members;
   ```

### Issue: Stripe Webhooks Not Working

**Symptom**: Subscription status not updating

**Solutions**:
1. Check Stripe webhook endpoint: `https://your-domain.com/api/stripe-webhook`
2. Verify webhook secret matches environment variable
3. Check Supabase Edge Functions logs
4. Test webhook with Stripe CLI:
   ```bash
   stripe listen --forward-to https://your-domain.com/api/stripe-webhook
   ```

### Issue: Slow Performance

**Symptom**: Pages load slowly

**Solutions**:
1. Check database query performance in Supabase
2. Add missing indexes:
   ```sql
   CREATE INDEX idx_members_org ON members(organization_id);
   CREATE INDEX idx_donations_org ON donations(organization_id);
   ```
3. Enable caching in hosting provider
4. Optimize bundle size:
   ```bash
   npm run build -- --analyze
   ```

---

## 📞 Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Project Issues**: https://github.com/your-org/mosqos/issues

---

## 🔐 Security Best Practices

1. **Never commit secrets to git**
   - Use `.env.production` (in `.gitignore`)
   - Use hosting provider's environment variable management

2. **Enable Supabase RLS on ALL tables**
   - Test policies thoroughly before production
   - Use principle of least privilege

3. **Use HTTPS everywhere**
   - Enforce SSL redirects
   - Use HSTS headers

4. **Rotate credentials regularly**
   - Database passwords every 90 days
   - API keys if compromised
   - Review access logs

5. **Monitor and audit**
   - Enable Supabase audit logging
   - Review authentication logs weekly
   - Set up alerts for suspicious activity

---

**Last Updated**: February 2026
**Document Version**: 1.0
**Maintained By**: MosqOS Development Team
