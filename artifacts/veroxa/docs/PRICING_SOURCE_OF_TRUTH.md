# Veroxa Pricing — Source of Truth

Last updated: 2026-05-27

This document is authoritative. All UI copy, demo fixtures, engine logic, and
docs that mention plan price values must agree with this file. The runtime
source of truth is `artifacts/veroxa/src/data/pricing/veroxaPricing.ts`.

## Plans

There are four plans. Standard prices apply after the first year. Founding
client prices are 50% off, available to early/founding restaurant partners
for the first year only.

| Plan ID                    | Label                       | Standard / mo | Founding 1st year / mo | Notes                                                                 |
|----------------------------|-----------------------------|--------------:|-----------------------:|-----------------------------------------------------------------------|
| `google_optimization`      | Google Optimization         |          $477 |                  $239  | Google Search SEO, Google Maps SEO, GBP, reviews support.             |
| `complete_online_presence` | Complete Online Presence    |          $977 |                  $489  | Facebook, Instagram, TikTok, Google Optimization, full team workflow. |
| `ads_addon`                | Ads Add-on                  |         +$497 |                 +$249  | Paired with Complete Online Presence. Ad spend separate.              |
| `ads_standalone`           | Ads Management Only         |          $997 |                  $499  | Standalone advertising management. Ad spend separate.                 |

## Complete Online Presence + Ads Add-on (combined service total)

This is **not** a separate plan. It is the two line items added together so
sales conversations can quote a single number. Always present it as two line
items plus a total — never as a standalone bundle.

| View                     | Complete Online Presence | Ads Add-on | Combined total (before ad spend) |
|--------------------------|-------------------------:|-----------:|---------------------------------:|
| Standard                 |                    $977  |     +$497  |                          $1,474  |
| Founding (first year)    |                    $489  |     +$249  |                            $738  |

## Founding Client Offer

- 50% off for the first year.
- Available only to early/founding restaurant partners.
- After the first year, standard pricing applies.
- Ad spend is always separate (founding offer does not subsidize ad spend).

## Ad spend

Ad spend is **always separate** and is paid by the restaurant directly to the
ad platform (Google, Meta, TikTok). Veroxa manages the advertising system; the
restaurant controls and pays the actual ad budget. No plan includes ad spend.

## Complete Online Presence — setup support

If the restaurant does not already have a needed website, Facebook page,
Instagram account, TikTok account, or Google Business Profile, Veroxa will
help create/setup the required basic account/page/presence as part of
onboarding. This is **not** a custom website development package. Wording to
use: "basic website/presence setup if needed", "basic account/page setup if
needed", "setup support for required online presence".

## What was removed (DO NOT reintroduce)

- ❌ Separate **Bundle** plan and `$1,497` bundle price.
- ❌ Plan label "Google Presence Starter" (renamed to **Google Optimization**).
- ❌ Plan label "Ads Management" at flat `$977` (replaced by Ads Add-on at
  `+$497` and Ads Management Only at `$997`).
- ❌ Term tiers: 3-month / 6-month / 12-month / no-contract price ladders.
- ❌ Old COP prices: $997, $1,097, $1,197, $1,497 as separate tiers.
- ❌ Old bundle prices: $1,797, $1,897, $1,997, $2,297.
- ❌ Old ads pricing: $1,500/mo add-on and $2,000/mo standalone.
- ❌ Vague tier labels used as pricing tiers: `Lite`, `Growth`, `Pro`,
  `Premium`, `Essential`, `Enterprise`, `Starter`, `Elite`.
- ❌ Promising a custom website build.

## Where this is referenced

- Runtime: `src/data/pricing/veroxaPricing.ts` (canonical)
- Public pricing page: `src/pages/pricing.tsx`
- Public services page: `src/pages/services.tsx`
- Demo financials: `src/data/demo/demoFinancials.ts` (demoServicePlans, MRR,
  revenue trend)
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

Pricing is owner-locked. Do not change any price without explicit owner
approval. After approval:

1. Update `src/data/pricing/veroxaPricing.ts` (canonical runtime file).
2. Update this document to match.
3. Update `docs/PUBLIC_PRICING_AND_SERVICES.md`.
4. Update `docs/SERVICE_DEFINITION_SOURCE_OF_TRUTH.md`.
5. Update `src/data/demo/demoFinancials.ts` (demoServicePlans, MRR, trend).
6. Update `src/data/demo/demoClients.ts` (monthlyFee on affected fixtures).
7. Update `src/domain/clientHealth/engine.ts` (demoPlanPrice map).

## Internal demo fixture IDs

Sanitized to neutral IDs — no real restaurant names anywhere in code.

| Fixture ID | Display name              | Plan                                         | Monthly fee |
|------------|---------------------------|----------------------------------------------|------------:|
| `demo-a`   | Demo Grill House          | Complete Online Presence                     |       $977  |
| `demo-b`   | Demo Taco Bar             | Complete Online Presence                     |       $977  |
| `demo-c`   | Demo Mediterranean Grill  | Complete Online Presence + Ads Add-on        |     $1,474  |
| `demo-d`   | Demo Cafe                 | Google Optimization                          |       $477  |

Resulting demo MRR: $977 + $977 + $1,474 + $477 = **$3,905 / mo**.
