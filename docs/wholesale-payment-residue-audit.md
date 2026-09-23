# Wholesale Payment Residue Audit

Last reviewed: June 11, 2026

## Goal

Verify that dormant wholesale-payment residue does not make the MVP look like PhenoFarm collects, remits, pays out, or intermediates buyer-seller wholesale payments.

## Current Product Rule

PhenoFarm processes cultivator software subscriptions only. Buyer-seller wholesale settlement is handled directly outside the app. Order values are operational records for quoting, fulfillment, and reporting.

## Removed Schema Residue

The database-hardening migration removed these legacy marketplace-payment fields:

- `Grower.stripeAccountId`
- `Grower.stripeAccountStatus`
- `Grower.connectOnboardedAt`
- `Order.payments`
- `Payment`
- `PaymentMethod`
- `PaymentStatus`

Production rollout must run the connected-database drop-safety script and take a Neon branch or backup before applying that migration.

## Surfaces Reviewed

- Grower requests list and request detail
- Dispensary request draft and request detail
- Order create, edit, status, batch-status, and checkout API routes
- Grower settings, commercial terms, and subscription billing
- Admin settings/dashboard payment-model messaging
- Stripe webhook handler
- Environment-variable documentation

## Result

- Wholesale request APIs reserve/reconcile inventory and track estimated request value only.
- Request UI uses direct-settlement language and does not offer wholesale checkout, card collection, payment links, payouts, or Stripe Connect onboarding.
- Stripe checkout and portal routes are scoped to grower software subscriptions.
- Stripe webhook handling ignores marketplace payment and payout events.
- `docs/ENVIRONMENT_VARIABLES.md` now describes Stripe as subscription billing rather than generic payments.

## Regression Guard

`tests/order-inventory-and-import.spec.ts` includes a source-level guard that verifies the legacy schema fields are absent and wholesale order surfaces do not reference Stripe checkout, payment intents, payouts, Connect onboarding, or application fees.
