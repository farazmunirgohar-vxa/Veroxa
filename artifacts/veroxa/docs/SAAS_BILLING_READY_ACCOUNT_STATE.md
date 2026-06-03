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

- Starter: $295/month.
- Growth: $495/month.
- Premium: $995/month.
- Ad spend is separate and paid directly by the restaurant.
- First clients receive the locked discount only while continuously active, according to current policy.

## Future payment-provider readiness

Future payment integrations require a separate RR-approved phase covering provider selection, webhook security, account reconciliation, invoice visibility, cancellation/paused-state behavior, audit logs, and client-safe billing UI language.

## 2026-06-03 pricing/profit-fit alignment

- Active public pricing is Starter $295/month, Growth $495/month, and Premium $995/month.
- Growth is the main recommended package for strong-fit restaurants; Starter is the low-friction entry plan; Premium is selective and readiness-gated.
- Premium requires readiness assessment, client approval, and an agreed ad budget; ad spend is separate.
- Profit Fit Layer is internal/team-only and uses `requiredDailyOrders = monthlyFee / netMargin / averageTicket / 30` with conservative defaults of $15 average ticket and 5% net margin.
- Online-influenced orders/actions include online orders, phone/order clicks, direction/address clicks that become visits, menu/order-link clicks, Google profile actions, customer mentions, social content-driven visits, and repeat-customer attention.
- Public/client surfaces must not promise orders, profit, ROI, customers, revenue, rankings, or exact order targets.
- This update does not mark production auth, migrations, storage, live AI, connectors, payments, or runtime SaaS wiring as built.
## Profit validation and online-influenced action layer (internal only)

Veroxa sells online presence publicly, but internally validates whether the work is becoming cost-justifiable through profitable online-influenced orders/actions. This is an internal operating model, not public/client-facing guarantee language.

- Starter internal 2-month proof standard: 20 online-influenced actions/day for right-fit restaurants.
- 2–3 months: service delivery plus cost justification through tracking setup, Google/Maps cleanup, best sellers, and order/contact paths.
- 6–9 months: profit progress should be visible through careful signal review, not service delivery volume alone.
- 12 months: online presence should be reviewed as a meaningful order channel when attribution confidence is strong enough.
- Tracking hierarchy: business outcome signals, conversion/action signals, attention signals, engagement signals, and execution signals.
- Attribution confidence must stay explicit: confirmed, strong signal, directional, owner reported, or unknown.
- Break-even progress and exact proof math are internal only and must not appear as public/client guarantees.

No runtime SaaS implementation is added by this layer: no production auth, database migrations, storage uploads, live AI, connectors, payments, or real client data writes.
