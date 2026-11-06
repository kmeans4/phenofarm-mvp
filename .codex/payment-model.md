# PhenoShop Payment Model

PhenoShop does not process wholesale payments between buyers and sellers.

## Software subscriptions

- Growers can prepare unlimited product listings and import spreadsheets for free.
- Buyer visibility and new commerce require an active seller subscription plus an approved, unexpired license. Existing accepted orders remain accessible when subscription access ends.
- The seller subscription is $165/month or $1,200/year paid upfront.
- Online billing is disabled while an approved payment processor is being selected. Subscription checkout, billing portal, and Stripe webhook routes cannot activate access or collect payment. Do not enable them without an approved processor and an explicit billing rollout.
- Existing subscription status is preserved; this rule does not grant free or test accounts paid access automatically.

## Wholesale Workflow

- Dispensaries submit order requests.
- Growers review, quote, accept, and fulfill requests.
- Order value is tracked for marketplace operations and reporting.
- Buyer-seller settlement is handled directly outside PhenoFarm.

## Removed Legacy Payment Schema

The dormant wholesale `Payment` model, payment enums, and Grower Stripe Connect columns were removed in the database-hardening migration. Stripe fields that remain on Grower are legacy software-subscription integration fields, not evidence of active processing approval.

Do not add new UI, API behavior, reporting, or copy that implies PhenoShop collects, remits, or pays out wholesale order funds.
