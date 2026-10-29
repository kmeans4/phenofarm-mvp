# Page coverage

All entries were opened in the isolated Chromium browser. Each page was scrolled before capture. Screenshots and page DOM checks were reviewed; action-level tests are listed in the audit report.

| Role | Route/state | Desktop | Tablet | Mobile |
|---|---|---|---|---|
| public | `/` | Reviewed | Reviewed | Reviewed |
| public | `/auth/confirm-email-change` | Reviewed | Reviewed | Reviewed |
| public | `/auth/error` | Reviewed | Reviewed | Reviewed |
| public | `/auth/forgot-password` | Reviewed | Reviewed | Reviewed |
| public | `/auth/reset-password` | Reviewed | Reviewed | Reviewed |
| public | `/auth/sign_in` | Reviewed | Reviewed | Reviewed |
| public | `/auth/sign_up` | Reviewed | Reviewed | Reviewed |
| public | `/auth/verify-email` | Reviewed | Reviewed | Reviewed |
| public | `/contact` | Reviewed | Reviewed | Reviewed |
| public | `/help` | Reviewed | Reviewed | Reviewed |
| public | `/legal/cookies` | Reviewed | Reviewed | Reviewed |
| public | `/legal/privacy` | Reviewed | Reviewed | Reviewed |
| public | `/legal/terms` | Reviewed | Reviewed | Reviewed |
| public | `/not-found` | Reviewed | Reviewed | Reviewed |
| grower | `/auth/change-email` | Reviewed | Reviewed | Reviewed |
| grower | `/dashboard` | Reviewed | Reviewed | Reviewed |
| grower | `/grower` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/batches` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/batches/[id]/edit` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/batches/add` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/catalog` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/customers` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/customers/[id]` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/customers/[id]/edit` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/customers/[id]/statement` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/customers/add` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/dashboard` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/inventory` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/inventory/add` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/marketplace` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/orders` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/orders/[id]` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/orders/[id]/edit` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/orders/add` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/orders/history` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/pricing` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/products` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/products/[id]/edit` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/products/[id]/preview` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/products/add` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/reports` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/settings` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/strains` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/strains/[id]/edit` | Reviewed | Reviewed | Reviewed |
| grower | `/grower/strains/add` | Reviewed | Reviewed | Reviewed |
| grower | `/messages` | Reviewed | Reviewed | Reviewed |
| grower | `/not-found` | Reviewed | Reviewed | Reviewed |
| buyer | `/dispensary/cart` | Reviewed | Reviewed | Reviewed |
| buyer | `/dispensary/catalog` | Reviewed | Reviewed | Reviewed |
| buyer | `/dispensary/dashboard` | Reviewed | Reviewed | Reviewed |
| buyer | `/dispensary/favorites` | Reviewed | Reviewed | Reviewed |
| buyer | `/dispensary/grower/[id]` | Reviewed | Reviewed | Reviewed |
| buyer | `/dispensary/orders` | Reviewed | Reviewed | Reviewed |
| buyer | `/dispensary/orders/[id]` | Reviewed | Reviewed | Reviewed |
| buyer | `/dispensary/price-alerts` | Reviewed | Reviewed | Reviewed |
| buyer | `/dispensary/saved` | Reviewed | Reviewed | Reviewed |
| buyer | `/dispensary/settings` | Reviewed | Reviewed | Reviewed |
| buyer | `/not-found` | Reviewed | Reviewed | Reviewed |
| buyer | `/messages` | Reviewed | Reviewed | Reviewed |
| admin | `/admin` | Reviewed | Reviewed | Reviewed |
| admin | `/admin/dashboard` | Reviewed | Reviewed | Reviewed |
| admin | `/admin/dispensaries` | Reviewed | Reviewed | Reviewed |
| admin | `/admin/growers` | Reviewed | Reviewed | Reviewed |
| admin | `/admin/review` | Reviewed | Reviewed | Reviewed |
| admin | `/admin/review/[kind]/[id]` | Reviewed | Reviewed | Reviewed |
| admin | `/admin/settings` | Reviewed | Reviewed | Reviewed |
| admin | `/admin/users` | Reviewed | Reviewed | Reviewed |
| admin | `/not-found` | Reviewed | Reviewed | Reviewed |
| terms | `/account/terms` | Reviewed | Reviewed | Reviewed |
| empty | `/grower/batches` | Reviewed | Reviewed | Reviewed |
| empty | `/grower/customers` | Reviewed | Reviewed | Reviewed |
| empty | `/grower/dashboard` | Reviewed | Reviewed | Reviewed |
| empty | `/grower/marketplace` | Reviewed | Reviewed | Reviewed |
| empty | `/grower/orders` | Reviewed | Reviewed | Reviewed |
| empty | `/grower/products` | Reviewed | Reviewed | Reviewed |
| empty | `/grower/reports` | Reviewed | Reviewed | Reviewed |
| empty | `/grower/strains` | Reviewed | Reviewed | Reviewed |

## Overlay coverage

| Surface | Roles | Desktop | Tablet | Mobile |
|---|---|---|---|---|
| comparison | buyer | Reviewed | Reviewed | Reviewed |
| discard | grower | Reviewed | Reviewed | Reviewed |
| edit-alert | buyer | Reviewed | Reviewed | Reviewed |
| filters | buyer | Not shown at this width | Reviewed | Reviewed |
| license-changes | admin | Reviewed | Reviewed | Reviewed |
| message-templates | buyer, grower | Reviewed | Reviewed | Reviewed |
| messages | buyer, grower | Reviewed | Reviewed | Reviewed |
| navigation | admin, buyer, grower | Not shown at this width | Not shown at this width | Reviewed |
| new-batch | grower | Reviewed | Reviewed | Reviewed |
| new-batch-validation | grower | Reviewed | Reviewed | Reviewed |
| new-message | buyer, grower | Reviewed | Reviewed | Reviewed |
| new-strain | grower | Reviewed | Reviewed | Reviewed |
| notifications | admin, buyer, grower | Reviewed | Reviewed | Reviewed |
| pause-account | admin | Reviewed | Reviewed | Reviewed |
| pricing-request | buyer | Reviewed | Reviewed | Reviewed |
| product-actions | grower | Reviewed | Reviewed | Reviewed |
| product-delete-undo | grower | Reviewed | Reviewed | Reviewed |
| product-detail | buyer | Reviewed | Reviewed | Reviewed |
| product-import | grower | Reviewed | Reviewed | Reviewed |
| product-question | buyer | Reviewed | Reviewed | Reviewed |
| quote-composer | grower | Reviewed | Reviewed | Reviewed |
| review-request | buyer | Reviewed | Reviewed | Reviewed |
| save-filter | buyer | Reviewed | Reviewed | Reviewed |
| search | admin, buyer, grower | Reviewed | Reviewed | Reviewed |
| target-price | buyer | Reviewed | Reviewed | Reviewed |
| withdraw-request | buyer | Reviewed | Reviewed | Reviewed |

## Additional confirmation states

Decline and cancellation validation, correction, and Keep request/Keep order were rechecked at 1440, 834, 390, and 320 pixels. The checks include focus, clearing stale errors, wrapping controls, and preserving the order status.
