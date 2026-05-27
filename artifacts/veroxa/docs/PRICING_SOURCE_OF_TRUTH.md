# Veroxa Pricing — Source of Truth

Last updated: 2026-05-27

This document is authoritative. All UI copy, demo fixtures, engine logic, and
docs that mention plan price values must agree with this file. The runtime
source of truth is `artifacts/veroxa/src/data/pricing/veroxaPricing.ts`.

## Flat plans

Veroxa offers four flat-rate monthly plans. There are no term tiers
(no 3/6/12-month price ladders).

| Plan ID                    | Label                       | Price / mo | Notes                                                  |
|----------------------------|-----------------------------|-----------:|--------------------------------------------------------|
| `google_presence_starter`  | Google Presence Starter     |       $477 | Google-only entry offer. Not the full Veroxa OS.       |
| `complete_online_presence` | Complete Online Presence    |       $977 | Full Veroxa growth system (content, Google, SEO, etc). |
| `ads_management`           | Ads Management              |       $977 | Standalone paid-ads management. Ad spend separate.     |
| `bundle`                   | Bundle                      |     $1,497 | Complete Online Presence + Ads Management together.    |

## Bundle savings

- Complete Online Presence ($977) + Ads Management ($977) bought
  separately = **$1,954 / mo**.
- Bundle = **$1,497 / mo**.
- **Save $457 / mo** with the Bundle.

## Ad spend

Ad spend is **always separate** and is paid by the restaurant directly to the
ad platform (Google, Meta). Veroxa only manages the campaigns under Ads
Management or the Bundle. No plan includes ad spend.

## What was removed (DO NOT reintroduce)

- ❌ Term tiers: 3-month / 6-month / 12-month / no-contract price ladders.
- ❌ Old COP prices: $997, $1,097, $1,197, $1,497 as separate tiers.
- ❌ Old bundle prices: $1,797, $1,897, $1,997, $2,297.
- ❌ Old GPS price: $497 (replaced by $477).
- ❌ Vague tier labels used as pricing tiers: `Lite`, `Growth`, `Pro`,
  `Premium`, `Essential`, `Enterprise`, `Starter`, `Elite`.
- ❌ Ads add-on at +$1,500 / mo and Ads-only at $2,000 / mo. Replaced by
  flat Ads Management at $977 / mo (or Bundle at $1,497 / mo).

## Where this is referenced

- Runtime: `src/data/pricing/veroxaPricing.ts` (canonical)
- Public pricing page: `src/pages/pricing.tsx`
- Demo financials: `src/data/demo/demoFinancials.ts` (demoServicePlans,
  MRR, revenue trend)
- Demo client fixtures: `src/data/demo/demoClients.ts` (servicePlan,
  monthlyFee on each demo client)
- Client health engine: `src/domain/clientHealth/engine.ts`
  (demoPlanPrice map)
- Owner OS banner copy: `src/pages/owner-os.tsx`
- Owner analytics per-client meta: `src/pages/owner-client-analytics.tsx`

## Payment integration

No payment processing, billing, or checkout system is connected to this app.
All pricing shown is for sales/quoting purposes only. Do not add Stripe,
PayPal, or any checkout logic without a formal owner decision.

## Change policy

Do not change any price without explicit owner approval. After approval:
1. Update `src/data/pricing/veroxaPricing.ts` (canonical runtime file).
2. Update this document to match.
3. Update `docs/PUBLIC_PRICING_AND_SERVICES.md`.
4. Update `src/data/demo/demoFinancials.ts` (demoServicePlans, MRR, trend).
5. Update `src/data/demo/demoClients.ts` (monthlyFee on affected fixtures).
6. Update `src/domain/clientHealth/engine.ts` (demoPlanPrice map).

## Internal demo fixture IDs

Sanitized to neutral IDs — no real restaurant names anywhere in code.

| Fixture ID | Display name                  | Plan                       |
|------------|-------------------------------|----------------------------|
| `demo-a`   | Demo Grill House              | Complete Online Presence   |
| `demo-b`   | Demo Taco Bar                 | Complete Online Presence   |
| `demo-c`   | Demo Mediterranean Grill      | Bundle                     |
| `demo-d`   | Demo Cafe                     | Google Presence Starter    |

Resulting demo MRR: $477 + $977 + $977 + $1,497 = **$3,928 / mo**.
