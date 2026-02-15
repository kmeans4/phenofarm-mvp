# Environment Variables Reference

Complete guide to all environment variables required for PhenoFarm MVP.

---

## Quick Reference Table

| Variable | Required | Source/How to Get | Used In |
|----------|----------|-------------------|---------|
| `DATABASE_URL` | ✅ Yes | Neon Dashboard or local PostgreSQL | Database connection |
| `AUTH_SECRET` | ✅ Yes | `openssl rand -base64 32` | NextAuth session encryption |
| `NEXTAUTH_URL` | ✅ Yes | Your app URL | NextAuth callbacks |
| `STRIPE_SECRET_KEY` | ⚠️ For payments | Stripe Dashboard → Developers → API Keys | Server-side Stripe operations |
| `STRIPE_PUBLISHABLE_KEY` | ⚠️ For payments | Stripe Dashboard → Developers → API Keys | Client-side Stripe (public) |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ For webhooks | Stripe CLI or Dashboard | Webhook signature verification |
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Your app URL | Client-side API calls |

---

## Required Variables (All Environments)

### DATABASE_URL
**Purpose:** PostgreSQL database connection string

**Format:**
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

**Examples:**
```bash
# Neon (Production/Recommended)
DATABASE_URL="postgresql://neondb_owner:npg_xxxxxxxx@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Local PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/phenofarm?schema=public"
```

**How to Get:**
- **Neon (Recommended):** Sign up at [neon.tech](https://neon.tech) → Create project → Dashboard → "Connection String" → "Node.js" tab
- **Local:** Install PostgreSQL → `createdb phenofarm` → use localhost URL

**Important Notes:**
- Must include `?sslmode=require` for Neon (enforced SSL)
- Neon connection strings contain the password - keep `.env.local` secure
- For local dev without SSL, you can omit `?sslmode=require`

---

### AUTH_SECRET
**Purpose:** Encrypts NextAuth.js session tokens and JWTs

**Format:** Base64-encoded random string (32+ bytes recommended)

**How to Generate:**
```bash
openssl rand -base64 32
```

**Example:**
```bash
AUTH_SECRET="aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890AbCdEfGh="
```

**Important Notes:**
- Must be identical across all server instances (for horizontal scaling)
- Changing this invalidates all existing user sessions
- Never commit this value to git
- Each environment (dev, staging, prod) should have different secrets

---

### NEXTAUTH_URL
**Purpose:** Tells NextAuth where your app is hosted (for callbacks)

**Format:** Full URL including protocol, no trailing slash

**Examples:**
```bash
# Local development
NEXTAUTH_URL="http://localhost:3000"

# Production (Vercel)
NEXTAUTH_URL="https://phenofarm-mvp.vercel.app"

# Custom domain
NEXTAUTH_URL="https://app.phenofarm.com"
```

**Important Notes:**
- Must match the actual URL users visit
- Vercel sets this automatically if not provided
- Required for OAuth providers (if you add them later)
- Must use `https://` in production

---

### NEXT_PUBLIC_API_URL
**Purpose:** Client-side API base URL (browser needs absolute URLs)

**Format:** Same as NEXTAUTH_URL

**Examples:**
```bash
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="https://phenofarm-mvp.vercel.app"
```

**Important Notes:**
- `NEXT_PUBLIC_` prefix makes this available in browser code
- Must be absolute URL (not `/api`)
- Usually matches NEXTAUTH_URL in simple setups

---

## Optional Variables (Payments Enabled)

### STRIPE_SECRET_KEY
**Purpose:** Server-side Stripe API authentication

**Format:** `sk_test_...` (test) or `sk_live_...` (production)

**How to Get:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Developers → API Keys
3. Reveal test key (starts with `sk_test_`)

**Example:**
```bash
STRIPE_SECRET_KEY="sk_test_51ABCdefGhIjKlMnOpQrStUvWxYz1234567890abcdef"
```

**Important Notes:**
- **Never** use live keys in development
- **Never** expose this in client-side code
- Keep separate test/live keys per environment
- Rotating keys: generate new key in Dashboard → update env → revoke old key

---

### STRIPE_PUBLISHABLE_KEY
**Purpose:** Client-side Stripe.js initialization (safe to expose)

**Format:** `pk_test_...` (test) or `pk_live_...` (production)

**How to Get:** Same location as secret key, public key is always visible

**Example:**
```bash
STRIPE_PUBLISHABLE_KEY="pk_test_51ABCdefGhIjKlMnOpQrStUvWxYz1234567890abcdef"
```

**Important Notes:**
- Safe to expose in browser (hence "publishable")
- Must match the mode (test/live) of your secret key
- Used for Stripe Elements (card input) and checkout

---

### STRIPE_WEBHOOK_SECRET
**Purpose:** Verifies Stripe webhook signatures (security)

**Format:** `whsec_...` or literal string `test`

**How to Get (Test Mode):**

**Option A - Stripe CLI (Recommended for local dev):**
```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy webhook signing secret from output
```

**Option B - Test Mode (Local only):**
```bash
# Use literal "test" to skip signature verification (local dev only!)
STRIPE_WEBHOOK_SECRET="test"
```

**How to Get (Production):**
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy signing secret from webhook details

**Example:**
```bash
STRIPE_WEBHOOK_SECRET="whsec_1234567890abcdefghijklmnopqrstuvwxyz"
```

**Important Notes:**
- Webhooks must use `https://` in production
- The `test` value skips verification - **never use in production**
- Each webhook endpoint has a unique secret
- Required for async payment confirmation (cards, bank transfers)

---

## Environment-Specific Configuration

### Local Development (.env.local)

```bash
# Database (local or Neon dev branch)
DATABASE_URL="postgresql://postgres:password@localhost:5432/phenofarm?schema=public"

# Auth
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="dev-secret-change-in-production"

# Stripe (test mode only)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="test"  # or use stripe CLI

# API
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### Staging / Preview (Vercel Preview Deploys)

```bash
# Database (Neon staging branch or separate project)
DATABASE_URL="postgresql://neondb_owner:...@ep-staging.us-east-1.aws.neon.tech/staging?sslmode=require"

NEXTAUTH_URL="https://phenofarm-mvp-git-staging-kevinmeans.vercel.app"  # Auto-set by Vercel
AUTH_SECRET="staging-secret-different-from-prod"

# Stripe (test mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."  # Or stripe CLI forward

NEXT_PUBLIC_API_URL="https://phenofarm-mvp-git-staging-kevinmeans.vercel.app"
```

### Production (Vercel)

```bash
# Database (Neon main branch)
DATABASE_URL="postgresql://neondb_owner:...@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

NEXTAUTH_URL="https://phenofarm-mvp.vercel.app"  # Auto-set
AUTH_SECRET="very-secure-random-secret"

# Stripe (LIVE mode for real payments)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

NEXT_PUBLIC_API_URL="https://phenofarm-mvp.vercel.app"
```

---

## Security Checklist

- [ ] `.env.local` is in `.gitignore` (never commit secrets)
- [ ] `AUTH_SECRET` is different in each environment
- [ ] `STRIPE_SECRET_KEY` starts with `sk_test_` in dev/staging
- [ ] `STRIPE_SECRET_KEY` is never logged or sent to client
- [ ] Production uses `https://` for all URLs
- [ ] Database password is strong and unique
- [ ] Neon database has appropriate access controls
- [ ] Stripe live keys only in production environment
- [ ] Webhook secrets are unique per endpoint

---

## Troubleshooting

### "Invalid Prisma schema" or "Database connection failed"
- Check DATABASE_URL format matches examples above
- Verify database exists and is accessible
- For Neon: ensure `?sslmode=require` is present
- Test connection: `psql "$DATABASE_URL`" or use Prisma Studio

### "JWT verification failed" or "Session errors"
- AUTH_SECRET might be missing or changed
- Generate new secret: `openssl rand -base64 32`
- Restart dev server after changing env vars

### Stripe payment not working
- Verify both STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY are set
- Check keys match (both test or both live)
- Ensure NEXT_PUBLIC_API_URL is correct for client-side requests
- Check Stripe Dashboard for failed request logs

### Webhook errors (400 Bad Request)
- STRIPE_WEBHOOK_SECRET must match the endpoint's secret
- For local dev: use `test` or stripe CLI forwarding
- Production: webhook must use `https://`
- Check Vercel function logs for detailed errors

---

## Adding New Environment Variables

When adding new features requiring env vars:

1. Add to `.env.example` with placeholder value
2. Document in this file (purpose, format, how to get)
3. Update README.md Environment Setup section
4. Add validation in code (fail fast if required var missing)
5. Update Vercel environment variables for preview/production

---

*Last updated: February 15, 2026*
