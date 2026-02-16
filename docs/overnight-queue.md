# Overnight Marketplace Build Queue

## Status: ACTIVE - Building dispenser marketplace
Started: February 15, 2026

## Features In Progress / Completed

- [x] **Grid/List toggle view** - COMPLETED Feb 16, 2026 12:05 AM
  - Added view mode state with Grid/List toggle buttons
  - Implemented compact list view with sortable columns
  - Added quick-add button for list view (single click)
  - Full grid view with quantity selector preserved
  - Results counter showing product count
  - "View Shop" links for each grower section
  - Deployed to: https://phenofarm-mvp.vercel.app/dispensary/catalog

- [x] **Sort by price/THC** - COMPLETED Feb 16, 2026 12:55 AM
  - Added sort dropdown with 7 options: Default (Grower), Price Low/High, THC High/Low, Name A-Z/Z-A
  - Implemented sort logic that flattens products when sorting across growers
  - Visual indicator when sorting is active (green header bar + "sorted by" label)
  - Sort option appears as active filter chip with clear button
  - Sort persists across view mode changes (Grid/List)
  - Deployed to: https://phenofarm-mvp.vercel.app/dispensary/catalog

- [x] Filters sidebar (product type, strain, THC/CBD ranges) - COMPLETED (built with Grid/List toggle)
  - Product Type filter with checkboxes (8 types)
  - THC Potency range filter (4 ranges)
  - Price Range filter (4 ranges)
  - Active filter chips with remove buttons
  - Clear all filters button
  - Collapsible sidebar

- [ ] Vendor shop pages
- [ ] Product cards with quick add
- [ ] Infinite scroll
- [ ] Search with autocomplete
- [ ] Compare products
- [ ] Mobile bottom sheet filters

## Build Log

### Feb 16, 2026 12:55 AM - Sort by Price/THC Feature
- Modified `app/dispensary/catalog/CatalogContent.tsx`
  - Added `SortOption` type with 7 options: default, price-asc, price-desc, thc-asc, thc-desc, name-asc, name-desc
  - Added sort dropdown UI with ArrowUpDown icon
  - Implemented `sortProducts()` function with switch statement for all sort types
  - When sorting by non-default option, products flatten into "All Products" view
  - Added visual indicators: green header bar, "sorted by" label, active chip
  - Sort option displays in results bar alongside view mode
- Build: Success
- Deploy: https://phenofarm-mvp.vercel.app

### Feb 16, 2026 12:05 AM - Grid/List Toggle Feature
- Modified `app/dispensary/catalog/CatalogContent.tsx`
  - Added `viewMode` state ('grid' | 'list')
  - Added toggle button UI with LayoutGrid and List icons from lucide-react
  - Created `ProductCard` component for grid view
  - Created `ProductListItem` component for list view
  - Added results counter showing total products found
  - Added "View Shop" link to each grower section header
- Modified `app/dispensary/catalog/components/AddToCartButton.tsx`
  - Added `compact` prop for list view quick-add
  - Full grid mode shows quantity selector
  - Compact mode shows single-click add button with Plus icon
  - Added Check icon for added state feedback
- Build: Success
- Deploy: https://phenofarm-mvp.vercel.app

## Blockers
None

## Next Priority
Implement vendor shop pages at `/dispensary/grower/[id]` - show grower profile, all their products, and contact options.

### Feb 16, 2026 1:45 AM - Vendor Shop Pages Feature
- Created `/dispensary/grower/[id]/page.tsx` - Server component for grower shop pages
  - Fetches grower data with products, strain info, and batch/THC data
  - Displays grower banner with gradient background
  - Shows grower logo (or placeholder with initial)
  - Verified badge for verified growers
  - Contact info: location, phone, website, license number
  - Action buttons: "Contact Grower" and "Follow Shop"
  - Stats bar: product count, orders filled, avg THC, categories count
  
- Created `/dispensary/grower/[id]/GrowerShopContent.tsx` - Client component
  - Grid/List view toggle with product cards and list items
  - Product type filter chips (desktop) and mobile filter panel
  - Sort dropdown: Featured, Price, THC, Name
  - Search within grower's products
  - Active filter chips with clear buttons
  - Product cards with: image, THC badge, type badge, strain, price, add to cart
  - Product list items with compact layout
  - Responsive design for mobile/tablet/desktop
  - Empty state with helpful messaging

- Modified: `app/dispensary/catalog/CatalogContent.tsx` - Verified "View Shop" links work
- Build: Success
- Deploy: https://phenofarm-mvp.vercel.app (aliased)

## Updated Priority Status
- [x] Grid/List toggle view - COMPLETED
- [x] Sort by price/THC - COMPLETED  
- [x] Filters sidebar - COMPLETED
- [x] **Vendor shop pages - COMPLETED** Feb 16, 2026 1:45 AM
- [ ] Product cards with quick add - Next priority
- [ ] Infinite scroll
- [ ] Search with autocomplete
- [ ] Compare products
- [ ] Mobile bottom sheet filters

## Next Priority
Implement enhanced product cards with quick-add functionality and hover effects.
