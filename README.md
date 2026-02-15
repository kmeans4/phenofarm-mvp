# PhenoFarm MVP

B2B Cannabis Wholesale Marketplace for Vermont growers and dispensaries

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-green?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue?logo=postgresql)

---

## Prerequisites

- **Node.js** >= 20.0.0 (see `.nvmrc`)
- **npm** >= 10.0.0
- **Git**
- PostgreSQL database (local or [Neon](https://neon.tech) recommended)

---

## Quick Start (Local Development)

### 1. Clone & Install

```bash
git clone <repo-url>
cd phenofarm-mvp
npm install
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Required: Database connection
# For local PostgreSQL:
DATABASE_URL="postgresql://postgres:password@localhost:5432/phenofarm?schema=public"

# For Neon (recommended for team/shared dev):
# DATABASE_URL="postgresql://neondb_owner:npg_XXXXX@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Required: NextAuth secret (generate with: openssl rand -base64 32)
AUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Stripe (for payment testing)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."  # or use "test" for local development

NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 3. Database Setup

**Option A: Local PostgreSQL**

```bash
# Create database (if using local PostgreSQL)
createdb phenofarm

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

**Option B: Neon Cloud Database (Recommended)**

1. Sign up at [neon.tech](https://neon.tech) (free tier available)
2. Create a new project
3. Copy the connection string from Dashboard → Quickstart → Node.js
4. Paste into `DATABASE_URL` in `.env.local`
5. Run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Seed Test Data

Visit the seed endpoint after starting the dev server:

```bash
npm run dev
# Then open: http://localhost:3000/seed
```

Or run the seed script directly:

```bash
npx ts-node seed-demo-users.ts
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@phenofarm.com | password123 |
| Grower | grower@vtnurseries.com | password123 |
| Dispensary | dispensary@greenvermont.com | password123 |

---

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Building
npm run build            # Build for production (runs prisma:generate first)
npm start                # Start production server

# Database
npm run prisma:generate  # Generate Prisma client after schema changes
npm run prisma:migrate   # Deploy database migrations (production)
npm run prisma:studio    # Open Prisma Studio (database GUI)

# Testing
npm run test             # Run Playwright E2E tests
npm run test:headed      # Run tests with visible browser
npm run test:ui          # Run tests with Playwright UI

# Code Quality
npm run lint             # Check ESLint rules
```

---

## Project Structure

```
phenofarm-mvp/
├── app/                      # Next.js App Router pages
│   ├── api/                 # API routes (auth, products, orders)
│   │   ├── auth/            # NextAuth.js configuration
│   │   ├── grower/          # Grower API endpoints
│   │   ├── dispensary/      # Dispensary API endpoints
│   │   └── admin/           # Admin API endpoints
│   ├── grower/              # Grower portal dashboard
│   ├── dispensary/          # Dispensary portal
│   ├── admin/               # Admin panel
│   ├── auth/                # Sign-in/sign-up pages
│   └── (public)/            # Landing pages
├── prisma/
│   ├── schema.prisma        # Database schema definition
│   └── migrations/          # Database migrations
├── scripts/                 # Database utility scripts
├── lib/                     # Shared utilities (db client, auth, etc.)
├── types/                   # TypeScript type definitions
├── public/                  # Static assets
└── tests/                   # Playwright E2E tests
```

---

## Database Schema

### Core Entities

| Model | Description |
|-------|-------------|
| `User` | Base user with role (ADMIN, GROWER, DISPENSARY) |
| `Grower` | Cultivators/sellers. Stripe Connect for payouts |
| `Dispensary` | Retail buyers |
| `Strain` | Cannabis genetics/lineage |
| `Batch` | Harvest batch with lab results (THC, CBD, terpenes) |

### Products & Inventory

| Model | Description |
|-------|-------------|
| `Product` | Sellable items linked to batch/strain |
| `ProductTypeConfig` | Flexible product categorization |
| `Cart` / `CartItem` | Dispensary shopping cart |

### Orders & Payments

| Model | Description |
|-------|-------------|
| `Order` / `OrderItem` | Purchase orders between grower ↔ dispensary |
| `Payment` | Payment records (Cash, Credit, Transfer) |

### Supporting

| Model | Description |
|-------|-------------|
| `Session` | NextAuth sessions |
| `MetrcSyncLog` | Compliance tracking |

---

## Vercel Deployment

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual Setup

1. Push code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/dashboard)
3. Add environment variables in Project Settings → Environment Variables:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `STRIPE_SECRET_KEY` (if using payments)
   - `STRIPE_PUBLISHABLE_KEY`
4. Set build command: `npm run build` (already configured)
5. Deploy!

### Post-Deployment (First Time)

Run database migrations on your production database:

```bash
# Set production DATABASE_URL locally, then:
npx prisma migrate deploy
```

Or use Vercel CLI:

```bash
vercel --prod
```

---

## Troubleshooting

### "Cannot find module '@prisma/client'"

```bash
npm run prisma:generate
```

### Migration fails with "Database does not exist"

Create the database first:

```bash
# Local PostgreSQL
createdb phenofarm

# Or update DATABASE_URL to point to existing database
```

### Neon connection errors

Ensure `?sslmode=require` is at the end of your Neon connection string.

### Port 3000 already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

### Build fails with "Prisma schema not found"

Check that `prisma/schema.prisma` exists and run:

```bash
npm run prisma:generate
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 6.5 |
| Auth | NextAuth.js v4 |
| UI | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Payments | Stripe |
| Testing | Playwright |

---

## Documentation

- `BUILD_SUMMARY_DASHBOARD.md` - Dashboard feature overview
- `MVP_PAGE_2_COMPLETE.md` - Page 2 implementation details
- See `/docs/` for additional documentation

---

Built for Vermont's cannabis community. 🌱
