# PhenoFarm MVP

B2B Cannabis Wholesale Marketplace for Vermont growers and dispensaries

## Tech Stack
- Next.js 14 + TypeScript
- PostgreSQL + Prisma (hosted on Neon)
- Tailwind CSS
- NextAuth for authentication

## Local Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your DATABASE_URL and AUTH_SECRET
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Seed the database:
```bash
npm run dev
# Visit http://localhost:3000/seed
```

## Test Credentials
- Admin: admin@phenofarm.com / password123
- Grower: grower@vtnurseries.com / password123
- Dispensary: dispensary@greenvermont.com / password123

## Vercel Deployment

1. Connect your Vercel account to your GitHub repo
2. Add these environment variables in Vercel:
   - `DATABASE_URL`
   - `AUTH_SECRET`
3. Run `npx prisma generate` and `npx prisma migrate deploy` via Vercel's CLI or pre-deployment script
4. Deploy!

## Project Structure
```
phenofarm-mvp/
├── app/                  # Next.js pages
│   ├── api/             # API routes
│   │   └── auth/        # NextAuth routes
│   ├── grower/          # Grower portal pages
│   ├── dispensary/      # Dispensary portal pages
│   ├── admin/           # Admin panel pages
│   └── auth/            # Auth pages (sign-in/sign-up)
├── prisma/              # Database schema
├── scripts/             # Database scripts
└── src/
    └── lib/             # Utilities
```

## Database Schema
- Users (with roles: ADMIN, GROWER, DISPENSARY)
- Growers
- Dispensaries
- Products
- Orders
- OrderItems
- Inventory
- Payments
- MetrcSyncLogs
