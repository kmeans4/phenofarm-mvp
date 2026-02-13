# PhenoFarm Dispensary Audit & Fixes

## CRITICAL ISSUES FOUND

### 1. Missing Orders Page (CRITICAL)
**Location:** /app/dispensary/orders/page.tsx does not exist
**Issue:** Dashboard has link to /dispensary/orders but page doesn't exist
**Fix:** Create dispensary orders page with order history table

### 2. Catalog Uses Hardcoded Data (CRITICAL)
**Location:** /app/dispensary/catalog/page.tsx
**Issue:** All products are hardcoded fake data, not querying database
**Fix:** Query actual products from database via API

### 3. Dashboard Uses Mock Data (HIGH)
**Location:** /app/dispensary/dashboard/page.tsx
**Issue:** fetchDispensaryDashboardData() returns static mock data
**Fix:** Query actual orders for this dispensary from database

### 4. Cart Page - Basic (MEDIUM)
**Location:** /app/dispensary/cart/page.tsx
**Status:** Need to check functionality

### 5. Missing API Endpoints for Dispensary
**Need:**
- GET /api/dispensary/orders - Get dispensary orders
- GET /api/dispensary/catalog - Get available products

## STYLING ISSUES (Match Grower Pages)

Compare these styles from grower pages and apply to dispensary:
- Card styling with shadow-sm border border-gray-200
- Stats cards layout: grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
- Header: flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4
- Tables: consistent padding, headers, hover states
- Buttons: consistent green-600 colors, rounded-lg, px-4 py-2

## TASK PRIORITY ORDER

1. Create dispensary orders page
2. Make catalog query real products
3. Make dashboard query real data
4. Complete cart functionality
5. Style audit & consistency fixes
