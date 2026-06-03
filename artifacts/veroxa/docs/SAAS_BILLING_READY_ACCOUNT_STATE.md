# SaaS Billing-Ready Account State

Status: Design-only. Payments are not implemented yet. No production auth enabled yet. No storage uploads enabled yet. No migrations created yet. No live AI enabled yet.

This plan designs billing-ready account state without adding Stripe, checkout, payment collection, or payment-provider integrations. `/client/*` and `/team/*` cannot use demo/sample fixtures once authenticated real mode is enabled. No future write should ship without activity logging.

## Account plan fields

- `restaurant_id`
- `current_plan_id`
- `plan_status`
- `billing_mode`
- `monthly_price_cents`
- `founding_discount_eligible`
- `founding_discount_active`
- `founding_discount_started_at`
- `founding_discount_lost_at`
- `premium_readiness_status`
- `ad_budget_confirmed`
- `ad_budget_amount_cents`
- `created_at`
- `updated_at`

Plan status values:

- `demo`
- `prospect`
- `trial`
- `onboarding`
- `active`
- `past_due`
- `paused`
- `canceled`
- `inactive`

Billing mode values:

- `manual`
- `future_stripe`
- `future_external`

Premium readiness status values:

- `not_eligible`
- `eligible_for_review`
- `assessment_needed`
- `approved`
- `not_approved`
- `active`

## Rules

- Payments are not implemented yet.
- Manual billing is acceptable at first if documented.
- First-client discount eligibility must be tracked.
- If client leaves and returns, discount eligibility may be lost according to locked policy.
- Premium cannot become active without readiness assessment, client approval, and agreed ad budget.
- Ad spend remains separate.
- Plan/account state changes must be activity-logged.
- Public pricing must not change unless explicitly instructed by the user.
- Do not add Stripe or payment integration.

## Locked pricing alignment

- Essential: $497/month.
- Growth: $697/month.
- Premium: $997/month.
- Ad spend is separate and paid directly by the restaurant.
- First clients receive the locked discount only while continuously active, according to current policy.

## Future payment-provider readiness

Future payment integrations require a separate RR-approved phase covering provider selection, webhook security, account reconciliation, invoice visibility, cancellation/paused-state behavior, audit logs, and client-safe billing UI language.
