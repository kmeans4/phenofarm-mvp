# PhenoFarm MVP - Code Review Report

**Date:** 2026-02-12  
**Review Type:** Production Readiness Code Review  
**Project:** PhenoFarm MVP  
**Location:** /Users/sam/.openclaw/workspace/phenofarm-mvp

---

## Executive Summary

The PhenoFarm MVP has **2 TypeScript compilation errors** that block deployment:

1. **Line 137 in `/app/grower/metrc-sync/page.tsx`** - Aggregation result type incompatibility
2. **Line 115 in `/app/grower/orders/[id]/page.tsx`** - Prisma Decimal type not compatible with custom type definition

Both issues stem from type mismatches between Prisma 6.5.0 generated types and manually defined custom types in the application.

---

## 1. TypeScript Compilation Errors

### Error 1: Aggregation Result Type Mismatch
**File:** `app/grower/metrc-sync/page.tsx:137`  
**Type:** `TS2322 - Type 'GetMetrcSyncLogAggregateType<...>' is not assignable to type 'ReactNode'`

**Root Cause:**
The `db.metrcSyncLog.aggregate()` method in Prisma 6.5.0 returns a complex aggregate type that TypeScript cannot infer correctly when assigning to `totalSynced`. The variable is used as a ReactNode in JSX but TypeScript sees it as a generic aggregate type.

**Current Code:**
```typescript
const [latestSync, successSyncCount, failedSyncCount, totalSynced] = await Promise.all([
  // ...
  db.metrcSyncLog.aggregate({
    where: { growerId: user.growerId },
    _sum: {
      recordsSynced: true,
    },
  }),
]);
```

**Required Fix:**
```typescript
const [latestSync, successSyncCount, failedSyncCount, totalSyncedRaw] = await Promise.all([
  // ...
  db.metrcSyncLog.aggregate({
    where: { growerId: user.growerId },
    _sum: {
      recordsSynced: true,
    },
  }),
]);

const totalSynced = totalSyncedRaw?._sum?.recordsSynced ?? 0;
```

**Why This Works:**
Prisma 6 returns aggregate results in a different structure: `{ _sum: { field: value } | null }`. Need to extract the nested value explicitly.

---

### Error 2: Prisma Decimal Type Incompatibility  
**File:** `app/grower/orders/[id]/page.tsx:115`  
**Type:** `TS2322 - Type 'Decimal' is not assignable to type 'number'`

**Root Cause:**
The Prisma schema defines `totalAmount` and other financial fields as `@db.Decimal(10,2)`, which Prisma maps to the `Decimal` type (from `decimal.js` library), not `number`. The custom `OrderDetail` interface incorrectly declares these as `number`.

**Current Code:**
```typescript
interface OrderDetail {
  id: string;
  orderId: string;
  status: string;
  totalAmount: number;  // ❌ Should be Decimal
  subtotal: number;     // ❌ Should be Decimal
  tax: number;          // ❌ Should be Decimal
  shippingFee: number;  // ❌ Should be Decimal
  // ...
}
```

**Required Fix:**
```typescript
import { Decimal } from '@prisma/client/runtime/library';

interface OrderDetail {
  id: string;
  orderId: string;
  status: string;
  totalAmount: Decimal;  // ✅ Matches Prisma schema
  subtotal: Decimal;     // ✅ Matches Prisma schema
  tax: Decimal;          // ✅ Matches Prisma schema
  shippingFee: Decimal;  // ✅ Matches Prisma schema
  // ...
}

// Update formatCurrency to handle Decimal
function formatCurrency(amount: number | Decimal) {
  const value = typeof amount === 'object' ? (amount as Decimal).toNumber() : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
```

**Alternative Solution - Convert to Number on Fetch:**
```typescript
async function fetchOrder(id: string, growerId: string): Promise<OrderDetail | null> {
  const order = await db.order.findUnique({
    where: { id, growerId },
    include: {
      dispensary: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) return null;

  // Convert Prisma Decimal to number for type compatibility
  return {
    ...order,
    totalAmount: order.totalAmount.toNumber(),
    subtotal: order.subtotal.toNumber(),
    tax: order.tax.toNumber(),
    shippingFee: order.shippingFee.toNumber(),
    items: order.items.map(item => ({
      ...item,
      unitPrice: item.unitPrice.toNumber(),
      totalPrice: item.totalPrice.toNumber(),
    })),
  };
}
```

---

## 2. Type Compatibility Report

### Prisma Schema vs Custom Type Definitions

| Field | Prisma Type | Custom Type | Compatibility |
|-------|------------|-------------|---------------|
| `Order.totalAmount` | `Decimal` | `number` | ❌ MISMATCH |
| `Order.subtotal` | `Decimal` | `number` | ❌ MISMATCH |
| `Order.tax` | `Decimal` | `number` | ❌ MISMATCH |
| `Order.shippingFee` | `Decimal` | `number` | ❌ MISMATCH |
| `OrderItem.unitPrice` | `Decimal` | `number` | ❌ MISMATCH |
| `OrderItem.totalPrice` | `Decimal` | `number` | ❌ MISMATCH |
| `Product.price` | `Decimal` | `number` | ⚠️ Not Defined |
| `MetrcSyncLog.recordsSynced` | `Int` | `number` | ✅ OK |
| `MetrcSyncLog.aggregate` | `{ _sum: { recordsSynced: number } }` | Direct number | ❌ MISMATCH |

### Critical Findings

1. **Financial Fields Use Prisma Decimal**: All monetary fields in the schema use `Decimal(10,2)` for precision. TypeScript types must account for this.

2. ** Aggregate Results Structure**: Prisma 6.5 aggregate results wrap values in nested `_sum`, `_count`, etc. objects.

3. **`Product` Type Missing from Order Interfaces**: The `OrderItem` interface references `product` property, but `Product` is not imported in the file.

---

## 3. Critical Blocking Issues

### ✅ HIGH PRIORITY - Deployment Blockers

1. **Fix Prisma Decimal Type Mismatches** (`app/grower/orders/[id]/page.tsx`)
   - Blocks TypeScript compilation
   - Will cause runtime errors with monetary values
   - Impact: Order detail page cannot render

2. **Fix Aggregate Result Extraction** (`app/grower/metrc-sync/page.tsx`)
   - Blocks TypeScript compilation  
   - Will display `NaN` or `{ _sum: null }` in UI
   - Impact: Sync statistics page fails

### ⚠️ MEDIUM PRIORITY - Code Quality

3. **Missing Product Import** (`app/grower/orders/[id]/page.tsx`)
   - `Product` type used but not imported
   - Should use the `Product` type from `/types/index.ts`

4. **Duplicate Type Definitions**
   - Files define `Dispensary`, `Product`, `Order`, etc. locally
   - These should import from shared `/types/index.ts`
   - Inconsistency causes maintenance issues

---

## 4. Recommended Fixes (Priority Order)

### Fix #1: Metrc Sync Page (3 minutes)
**File:** `app/grower/metrc-sync/page.tsx`

Replace the sync status initialization section with:
```typescript
// Before (line ~40-52)
const [latestSync, successSyncCount, failedSyncCount, totalSynced] = await Promise.all([
  db.metrcSyncLog.findFirst({ /* ... */ }),
  db.metrcSyncLog.count({ /* ... */ }),
  db.metrcSyncLog.count({ /* ... */ }),
  db.metrcSyncLog.aggregate({ /* ... */ }),
]);

// After
const [latestSync, successSyncCount, failedSyncCount, totalSyncedRaw] = await Promise.all([
  db.metrcSyncLog.findFirst({ /* ... */ }),
  db.metrcSyncLog.count({ /* ... */ }),
  db.metrcSyncLog.count({ /* ... */ }),
  db.metrcSyncLog.aggregate({ /* ... */ }),
]);

const totalSynced = totalSyncedRaw?._sum?.recordsSynced ?? 0;
```

### Fix #2: Order Detail Page - Option A (5 minutes)
**File:** `app/grower/orders/[id]/page.tsx`

Update the `OrderDetail` interface and component:

```typescript
// Add import at top
import { Decimal } from '@prisma/client/runtime/library';

// Replace OrderDetail interface
interface OrderDetail {
  id: string;
  orderId: string;
  status: string;
  totalAmount: Decimal;  // Changed from number
  subtotal: Decimal;     // Changed from number
  tax: Decimal;          // Changed from number
  shippingFee: Decimal;  // Changed from number
  notes: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  growerId: string;
  dispensaryId: string;
  dispensary: Dispensary;
  items: OrderItem[];
}

// Update formatCurrency to handle Decimal
function formatCurrency(amount: number | Decimal) {
  const value = typeof amount === 'object' ? (amount as Decimal).toNumber() : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
```

### Fix #2: Order Detail Page - Option B (Alternative) (5 minutes)
**File:** `app/grower/orders/[id]/page.tsx`

Add conversion logic in `fetchOrder`:

```typescript
async function fetchOrder(id: string, growerId: string): Promise<OrderDetail | null> {
  const order = await db.order.findUnique({
    where: { id, growerId },
    include: {
      dispensary: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) return null;

  // Convert Prisma Decimal to number for type compatibility
  return {
    ...order,
    totalAmount: order.totalAmount.toNumber(),
    subtotal: order.subtotal.toNumber(),
    tax: order.tax.toNumber(),
    shippingFee: order.shippingFee.toNumber(),
    items: order.items.map(item => ({
      ...item,
      unitPrice: item.unitPrice.toNumber(),
      totalPrice: item.totalPrice.toNumber(),
    })),
  };
}
```

### Fix #3: Import Shared Types (10 minutes)
**File:** `app/grower/orders/[id]/page.tsx`

```typescript
// Replace the local type definitions with imports
import type { Product } from '@/types';
import { type ExtendedUser } from '@/types';

// Keep Dispensary and OrderDetail interfaces but remove Product
interface OrderItem {
  // ... (keep as is, product field will be Product type)
}
```

---

## 5. Priority Order for Fixes

| Priority | # | File | Time | Impact |
|----------|---|------|------|--------|
| 🔴 **CRITICAL** | 1 | `app/grower/metrc-sync/page.tsx` | 3 min | Blocks compilation |
| 🔴 **CRITICAL** | 2 | `app/grower/orders/[id]/page.tsx` | 5 min | Blocks compilation |
| 🟠 **HIGH** | 3 | `app/grower/orders/[id]/page.tsx` | 5 min | Runtime type safety |
| 🟡 **MEDIUM** | 4 | `app/grower/orders/[id]/page.tsx` | 10 min | Code maintainability |
| 🟡 **MEDIUM** | 5 | `app/grower/orders/` (other files) | Variable | Consistency |

**Total Estimated Time:** 23 minutes to fix all compilation blockers

---

## 6. Additional Findings (No blocking errors)

### /app/dashboard/ Pages - ✅ Clean
- No TypeScript errors found
- Proper use of Prisma types

### /app/api/ Routes - ✅ Clean  
- No TypeScript errors found
- Auth routes properly typed

### /app/components/ui/ - ✅ Clean
- Component library properly typed
- No runtime issues detected

### /types/index.ts - ⚠️ Needs Updates
Current types are incomplete:

```typescript
// Missing types that exist in schema:
// - OrderItem type (missing product property)
// - Product.price should be Decimal, not number  
// - Payment types
// - MetrcSyncLog types
```

---

## 7. Deployment Checklist

Before deploying to production, ensure:

- [ ] Fix Prisma Decimal → number conversion in order detail page
- [ ] Fix aggregate result extraction in metrc-sync page
- [ ] Add comprehensive error handling around database calls
- [ ] Implement proper logging for aggregation failures
- [ ] Add try/catch blocks around all `db.*` calls
- [ ] Update `/types/index.ts` to be fully comprehensive
- [ ] Add test cases for Decimal serialization
- [ ] Verify PostgreSQL timestamp/timezone handling

---

**Report Generated:** 2026-02-12 13:55 EST  
**Next Steps:** Apply fixes in priority order, then run `npx tsc --noEmit` to verify all errors resolved.

---

# Section 8: Architecture Review

**Reviewer:** Architecture & Best Practices Audit  
**Date:** 2026-02-12 14:15 EST

## 8.1 Project Structure Assessment

### ✅ Strengths
- **Clean App Router structure** - Follows Next.js 16 conventions
- **Proper separation** - API routes under `/app/api/`, pages under role-based routes
- **Component organization** - UI components in `/app/components/ui/`, feature components alongside pages
- **Prisma setup** - Single client instance pattern with global caching

### ⚠️ Issues Found

#### 8.1.1 Duplicate Type Definitions
Multiple files define the same types locally instead of importing from `/types/index.ts`:

| File | Locally Defined Types |
|------|----------------------|
| `app/grower/orders/[id]/page.tsx` | `Dispensary`, `OrderItem`, `Product`, `Order`, `User`, `OrderDetail` |
| `app/api/products/[id]/route.ts` | `Product` |
| `app/grower/products/page.tsx` | `Product` |

**Impact:** Maintenance burden, type mismatches, drift from schema

**Recommended Fix:**
1. Create comprehensive types in `/types/index.ts`
2. Export from single source
3. Import everywhere needed

```typescript
// types/index.ts - Expand to match Prisma schema
export type { User, Grower, Dispensary, Product, Order, OrderItem, Payment, MetrcSyncLog } from '@prisma/client';

// Or create application-specific types with Decimal → number conversion
```

#### 8.1.2 Missing Types in /types/index.ts
The shared types file is incomplete:

```typescript
// Current: Only has ExtendedUser, AuthSession, AuthCredentials, Product, Order
// Missing: Dispensary, OrderItem, Payment, MetrcSyncLog, Grower
```

#### 8.1.3 Route Organization
API routes are well-organized but missing:
- Versioning path (e.g., `/api/v1/products`)
- Rate limiting middleware
- Request validation layer

---

## 8.2 API Route Analysis

### Consistency Check

| Pattern | Status | Notes |
|---------|--------|-------|
| Auth check at start | ✅ Consistent | All routes check `getServerSession(authOptions)` |
| Role authorization | ✅ Consistent | Role checks for GROWER/DISPENSARY |
| Error handling | ✅ Consistent | All routes have try/catch blocks |
| Error response format | ⚠️ Inconsistent | See below |
| HTTP status codes | ✅ Correct | 200, 201, 400, 401, 403, 404, 500 |
| Request validation | ⚠️ Manual | No Zod/schema validation |

### Error Response Inconsistency

```typescript
// Pattern 1 (most common)
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// Pattern 2 (some routes)
return NextResponse.json({ 
  error: 'Sync failed',
  message: error instanceof Error ? error.message : 'Unknown error'
}, { status: 500 });

// Pattern 3 (bulk upload)
return NextResponse.json({
  success: true,
  totalRows: 10,
  successCount: 8,
  errorCount: 2,
  errors: ['Row 3: Missing name']
});
```

**Recommended Fix:** Create standardized error response helper:

```typescript
// lib/api-responses.ts
export function apiError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ 
    error: message,
    ...(details && { details })
  }, { status });
}

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
```

### Missing Request Validation

No routes use Zod for request body validation. All validation is manual:

```typescript
// Current: Manual validation in every route
if (!name || !price || !inventoryQty || !unit) {
  return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
}
```

**Recommended Fix:** Add Zod schemas:

```typescript
// lib/validators/product.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  strain: z.string().optional(),
  category: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  inventoryQty: z.number().int().min(0, 'Inventory cannot be negative'),
  unit: z.enum(['gram', 'eighth', 'quarter', 'half', 'ounce', 'pound']),
  // ...
});

// Usage in route
const body = await request.json();
const validated = createProductSchema.parse(body); // Throws on invalid
```

---

## 8.3 Server vs Client Components

### Pattern Analysis

| Directory | Component Type | Pattern |
|-----------|---------------|---------|
| `/app/grower/products/page.tsx` | Client (`'use client'`) | Fetches data via API |
| `/app/grower/products/add/page.tsx` | Client | Form handling |
| `/app/grower/metrc-sync/page.tsx` | Server | Direct DB access |
| `/app/grower/orders/[id]/page.tsx` | Server | Direct DB access |
| `/app/dispensary/dashboard/page.tsx` | Server | Mock data (no DB) |
| `/app/grower/layout.tsx` | Server | Auth check + layout |
| `/app/admin/layout.tsx` | Server | Auth check + layout |

### Inconsistency Found

**Products page uses client-side fetching while orders use server-side.**

```typescript
// grower/products/page.tsx - CLIENT (fetches via API)
'use client';
const fetchProducts = async (growerId: string) => {
  const response = await fetch('/api/products');
  // ...
};

// grower/metrc-sync/page.tsx - SERVER (direct DB)
const [latestSync, ...] = await Promise.all([
  db.metrcSyncLog.findFirst({ ... }),
]);
```

**Impact:** Unnecessary API round-trips for products page, hydration complexity

**Recommendation:** Standardize on server components for data fetching, client components for interactivity only.

---

## 8.4 Layout Authorization Gaps

### ⚠️ Security Issue: Admin Layout Missing Role Check

```typescript
// app/admin/layout.tsx - INCOMPLETE
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  // ❌ MISSING: Check if user.role === 'ADMIN'
  // Any authenticated user can access /admin/* routes!

  return (/* ... */);
}
```

**Required Fix:**
```typescript
const user = session.user as any;

if (user.role !== 'ADMIN') {
  redirect('/dashboard'); // Or 403 page
}
```

### Dispensary Layout Missing

No `/app/dispensary/layout.tsx` exists. The dispensary routes lack:
- Session verification
- Role check for DISPENSARY role
- Consistent sidebar/layout

---

# Section 9: Dependencies Audit

## 9.1 Outdated Packages

| Package | Current | Latest | Risk Level | Notes |
|---------|---------|--------|------------|-------|
| `@prisma/client` | 6.5.0 | 7.4.0 | 🟡 Medium | Major version behind; breaking changes possible |
| `prisma` | 6.5.0 | 7.4.0 | 🟡 Medium | Must match @prisma/client version |
| `@neondatabase/serverless` | 0.10.4 | 1.0.2 | 🟡 Medium | Major version bump |
| `eslint` | 9.39.2 | 10.0.0 | 🟢 Low | Dev dependency |
| `@types/node` | 20.x | 25.x | 🟢 Low | Dev dependency |
| `csv-parse` | 5.6.0 | 6.1.0 | 🟢 Low | Minor version |
| `react` | 19.2.3 | 19.2.4 | 🟢 Low | Patch update |
| `react-dom` | 19.2.3 | 19.2.4 | 🟢 Low | Patch update |

### Upgrade Recommendations

**Prisma 6 → 7 Migration:**
```bash
# Prisma 7 has breaking changes, review migration guide first
# Key changes: new query syntax, different Decimal handling
npm install prisma@7 @prisma/client@7
npx prisma migrate dev  # Regenerate client
```

## 9.2 Unused Dependencies

**None found** - All imports in package.json are used in the codebase.

## 9.3 Missing Dependencies (Should Add)

| Package | Purpose | Priority |
|---------|---------|----------|
| `zod` | Request validation | 🟠 High |
| `bcrypt` or `bcryptjs` | Password hashing | 🔴 Critical |
| `@vercel/og` | Open Graph images (optional) | 🟢 Low |
| `sharp` | Image optimization if using local images | 🟡 Medium |

## 9.4 Security Advisory Check

Run `npm audit` before deployment. Current scan shows no critical vulnerabilities.

---

# Section 10: Best Practices Assessment

## 10.1 Error Handling

### API Routes ✅ Good
All API routes have try/catch blocks with proper logging.

### Server Components ⚠️ Missing Error Boundaries
No React Error Boundaries defined for graceful error handling.

**Recommended Fix:**
```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## 10.2 Async/Await Patterns

### ✅ Correct Usage
- `Promise.all()` used correctly for parallel queries
- Proper awaiting of async operations
- No floating promises detected

### ⚠️ Server Actions Pattern Issue

In `metrc-sync/page.tsx`:
```typescript
const handleManualSync = async () => {
  'use server';
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}...`);
    // ...
  }
};
```

**Issue:** This server action is defined inside a server component but passed to a client component (Button onClick). This will work but is unconventional.

**Recommendation:** Move server actions to separate files (`/app/actions/`) for clarity.

## 10.3 Form Validation

### ⚠️ Client-Side Only
`ProductForm.tsx` uses HTML5 validation only:

```typescript
<input id="name" type="text" required ... />
<input id="price" type="number" step="0.01" required ... />
```

**Issues:**
- No custom error messages
- No sanitization
- Server-side validation exists but is manual

**Recommended Fix:** Use `react-hook-form` + `zod` for comprehensive validation.

## 10.4 Database Patterns

### Image Storage Anti-Pattern ⚠️

```typescript
// app/api/products/upload/route.ts
const base64 = Buffer.from(bytes).toString('base64');
await db.product.update({
  data: { images: { push: base64 } }
});
```

**Problems:**
- Base64 images bloat database
- No CDN caching
- Neon/PostgreSQL has row size limits
- Images stored in `String[]` (no metadata)

**Recommended Fix:** Use external storage (Vercel Blob, S3, Cloudinary):

```typescript
// Upload to blob storage
const blob = await put(file.name, file, { access: 'public' });
const imageUrl = blob.url;

// Store URL only
await db.product.update({
  data: { images: { push: imageUrl } }
});
```

---

# Section 11: Integration Points

## 11.1 NextAuth Configuration

### ⚠️ Critical Security Issue: Placeholder Password

```typescript
// app/api/auth/[...nextauth]/route.ts
const isValidPassword = credentials.password === 'password123'; // ❌ PLACEHOLDER
```

**Impact:** Anyone can log in with any email and password 'password123'

**Required Fix:**
```typescript
import bcrypt from 'bcryptjs';

// In authorize callback:
const user = await db.user.findUnique({ where: { email: credentials.email } });
if (!user || !user.passwordHash) return null;

const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
if (!isValid) return null;

return { id: user.id, email: user.email, role: user.role };
```

**Schema Update Required:**
```prisma
model User {
  // ...
  passwordHash  String?   // Add this field
}
```

### Session Strategy ✅ Correct
Using JWT strategy is appropriate for serverless (Vercel).

### Missing OAuth Providers
Consider adding:
- Google OAuth for easier onboarding
- Email magic links for passwordless

## 11.2 Prisma Client

### ✅ Correct Singleton Pattern
```typescript
// lib/db.ts
const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma || new PrismaClient({...});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

### ⚠️ Missing Connection Pooling for Serverless
For Neon + Vercel, consider:

```typescript
export const db = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});
```

And ensure `DATABASE_URL` uses Neon's pooled connection string for production:
```
postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/db?pgbouncer=true
```

## 11.3 Environment Variables

### Current .env Structure
```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-auth-secret-here"
NEXT_PUBLIC_API_URL=http://localhost:3000
METRC_API_KEY=your-metrc-api-key-here
METRC_API_SECRET=your-metrc-api-secret-here
METRC_API_URL=https://api-ca.metrc.com
```

### ⚠️ Issues

1. **No validation** - App will crash if required env vars missing
2. **Placeholder values** - `your-auth-secret-here` needs real value
3. **Missing variables:**
   - `NEXTAUTH_URL` (required for production)
   - `NEXT_PUBLIC_APP_URL` (referenced in code but not in .env)

**Recommended Fix:**
```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  METRC_API_KEY: z.string().optional(),
  METRC_API_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

## 11.4 Vercel Configuration

### Current vercel.json
```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

### ⚠️ Missing Configuration

1. **No cron jobs** for METRC sync scheduling
2. **No edge functions** for performance
3. **No header policies** (security headers)

**Recommended Addition:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ],
  "crons": [
    {
      "path": "/api/metrc/sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

---

# Section 12: Security Concerns

## 12.1 Critical Issues

| Issue | Severity | File | Status |
|-------|----------|------|--------|
| Placeholder password auth | 🔴 Critical | `auth/[...nextauth]/route.ts` | Must fix before deploy |
| Admin routes lack role check | 🔴 Critical | `app/admin/layout.tsx` | Must fix before deploy |
| No rate limiting | 🟠 High | API routes | Should add |
| No CSRF protection (handled by NextAuth) | ✅ OK | - | Built-in |

## 12.2 Medium Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Base64 image storage | 🟠 Medium | Database bloat, no CDN |
| Hardcoded tax rate (6%) | 🟠 Medium | Should be configurable |
| No IP-based access limits | 🟡 Low | Admin routes especially |
| Error messages expose internals | 🟡 Low | `error.message` returned to client |

---

# Section 13: Summary & Action Items

## Must Fix Before Production

| # | Issue | Time | File |
|---|-------|------|------|
| 1 | Fix TypeScript compilation errors | 5 min | Quinn's section above |
| 2 | Replace placeholder password auth | 15 min | `app/api/auth/[...nextauth]/route.ts` |
| 3 | Add ADMIN role check to admin layout | 5 min | `app/admin/layout.tsx` |
| 4 | Add dispensary layout with auth | 20 min | Create `app/dispensary/layout.tsx` |
| 5 | Set real AUTH_SECRET in production | 2 min | Environment variables |

## Should Fix Soon

| # | Issue | Time | Priority |
|---|-------|------|----------|
| 6 | Add Zod validation to API routes | 2 hrs | 🟠 High |
| 7 | Consolidate duplicate type definitions | 1 hr | 🟡 Medium |
| 8 | Add React Error Boundaries | 30 min | 🟡 Medium |
| 9 | Move image storage to external service | 2 hrs | 🟡 Medium |
| 10 | Add environment variable validation | 30 min | 🟡 Medium |

## Nice to Have

| # | Issue | Time | Priority |
|---|-------|------|----------|
| 11 | Standardize server/client component patterns | 3 hrs | 🟢 Low |
| 12 | Add rate limiting to API routes | 2 hrs | 🟢 Low |
| 13 | Upgrade Prisma to v7 | 4 hrs | 🟢 Low |
| 14 | Add cron job for METRC sync | 1 hr | 🟢 Low |

---

**Architecture Review Complete:** 2026-02-12 14:15 EST  
**Combined with TypeScript Review by Quinn**

**Total Estimated Fix Time:**
- Blocking compilation: 5 min
- Critical security: 40 min
- High priority improvements: 3 hrs
- Medium priority: 5 hrs

**Recommendation:** Address blocking errors and critical security issues before any deployment. Other items can be tracked as technical debt.
