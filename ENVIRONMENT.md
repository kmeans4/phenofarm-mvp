# 🌿 PhenoFarm Environment Variables

This document describes all environment variables required for the PhenoFarm application.

## Required Variables

### Database

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string (Neon) | `postgresql://user:pass@host/db?sslmode=require` |

**Note:** `POSTGRES_URL` can be used as a fallback and is automatically picked up by some Prisma configurations.

### Authentication (NextAuth.js)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXTAUTH_URL` | ✅ Yes | Base URL of your application | `http://localhost:3000` (dev) / `https://phenofarm.com` (prod) |
| `AUTH_SECRET` | ✅ Yes | Secret for JWT encryption | Generate with `openssl rand -base64 32` |

**Important:** Never commit `AUTH_SECRET` to version control. Generate a new one for each environment.

### Stripe (Payment Processing)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | ✅ Yes | Stripe secret key for API calls | `sk_test_...` (test) / `sk_live_...` (production) |
| `STRIPE_PUBLISHABLE_KEY` | ✅ Yes | Stripe publishable key for frontend | `pk_test_...` (test) / `pk_live_...` (production) |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ Conditional | Webhook endpoint secret | `whsec_...` or `test` for local development |

**Webhook Secret Notes:**
- Set to `test` for local development (disables signature verification)
- Required in production with actual webhook secret from Stripe Dashboard

## Optional Variables

### Application URLs

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Public API base URL |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public app URL (used for METRC sync) |

### Server Configuration (Standalone Mode)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port number |
| `HOSTNAME` | `0.0.0.0` | Server hostname |
| `KEEP_ALIVE_TIMEOUT` | - | HTTP keep-alive timeout in ms |

### Testing

| Variable | Default | Description |
|----------|---------|-------------|
| `CI` | `false` | Enables CI mode for Playwright tests |
| `TEST_PAGE` | `/admin` | Target page for screenshot tests |

### Build/Runtime

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set automatically (`development`, `production`, `test`) |
| `VERCEL` | Set automatically when deployed on Vercel |

## Environment-Specific Setup

### Local Development

Create `.env.local` file:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require

# NextAuth
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your-generated-secret-here

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=test

# Optional overrides
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel)

Set these in Vercel Dashboard → Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.com
AUTH_SECRET=<generate-new-secret>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Critical:** Never use test keys (`sk_test_`, `pk_test_`) in production. Always use live keys.

## Security Best Practices

1. **Never commit secrets** - Use `.env.local` (gitignored) for local secrets
2. **Generate unique secrets** - Each environment should have its own `AUTH_SECRET`
3. **Rotate keys regularly** - Especially Stripe webhook secrets
4. **Use strong passwords** - For database connections
5. **Enable SSL** - Always use `sslmode=require` for database URLs

## Verifying Your Setup

Run the build to verify all required variables are present:

```bash
npm run build
```

If build succeeds without errors, your environment variables are configured correctly.

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Build fails with "DATABASE_URL not found" | Missing database URL | Check `.env.local` exists and is loaded |
| Stripe webhook errors locally | Missing webhook secret | Set `STRIPE_WEBHOOK_SECRET=test` |
| Auth sessions not persisting | Missing/invalid `AUTH_SECRET` | Generate new secret with `openssl` |
| CORS errors in API calls | Wrong `NEXT_PUBLIC_API_URL` | Ensure it matches your actual domain |
