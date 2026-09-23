# PhenoFarm Payment Model

PhenoFarm does not process wholesale payments between buyers and sellers.

## Active Payment Flow

- Cultivators pay PhenoFarm software subscription fees through Stripe Billing.
- Subscription checkout and portal routes live under `/api/grower/subscription`.
- Stripe webhooks should update grower subscription state only.

## Wholesale Workflow

- Dispensaries submit order requests.
- Growers review, quote, accept, and fulfill requests.
- Order value is tracked for marketplace operations and reporting.
- Buyer-seller settlement is handled directly outside PhenoFarm.

## Removed Legacy Payment Schema

The dormant wholesale `Payment` model, payment enums, and Grower Stripe Connect columns were removed in the database-hardening migration. Stripe fields that remain on Grower are exclusively for PhenoFarm subscription billing.

Do not add new UI, API behavior, reporting, or copy that implies PhenoFarm collects, remits, or pays out wholesale order funds.
