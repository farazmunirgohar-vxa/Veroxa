# Veroxa Pricing — Source of Truth

Last updated: 2026-05-29

This document is authoritative. All UI copy, demo fixtures, engine logic, and
docs that mention plan price values must agree with this file. The runtime
source of truth is `artifacts/veroxa/src/data/pricing/veroxaPricing.ts`.

---

## Active public plans

### Complete Online Presence

The core Veroxa system. Flat monthly service — same deliverables at both price points.

| Pricing                  | Monthly price |
|--------------------------|:-------------:|
| Standard                 |      $977     |
| Founding first year      |      $488     |

The founding first-year offer is **active** — 50% off Complete Online Presence
for the first year. Available only to founding/early restaurant partners. After
the first year, standard pricing applies.

### Ads Management (add-on)

Available as an add-on to Complete Online Presence **only** — not sold standalone.

| Pricing      | Monthly price |
|--------------|:-------------:|
| All clients  |    +$477      |

Ads Management carries **no founding discount** — it is a flat $477/mo
regardless of founding status.

### Complete Online Presence + Ads Management (combined totals)

This is **not** a separate "bundle" plan. It is the two line items added
together for sales conversations.

| Pricing             | COP    | Ads   | Combined total |
|---------------------|-------:|------:|---------------:|
| Standard            |  $977  | $477  |       $1,454   |
| Founding first year |  $488  | $477  |         $965   |

---

## Hidden / internal plans

These plan IDs exist in `veroxaPricing.ts` and are referenced by the Free Audit
recommendation engine and internal lead-scoring. They are **not** shown on the
public Pricing page or any public copy.

| Plan ID              | Status   | publicVisible | Internal price | Notes                                     |
|----------------------|----------|:---:|-------:|-------------------------------------------|
| `google_optimization` | retired | false | $477/mo (founding $239/mo) | Free Audit / lead-scoring compat only |
| `ads_standalone`      | active  | false | $2,000/mo | Internal reference; dependency audit pending |

### Mapping retired plans to public offers (for audit output display)

If internal audit logic recommends a retired plan, map the customer-facing
label to the nearest active offer:

| Internal recommendation  | Public label to show                               |
|--------------------------|----------------------------------------------------|
| Google Optimization      | Complete Online Presence                           |
| Ads Management Only      | Ads Management add-on (or COP + Ads if appropriate)|

The internal reason/scoring for the retired plan ID is preserved; only the
public-facing display label is mapped forward.

---

## Founding-client offer

- **Active** — available to founding/early restaurant partners.
- 50% off Complete Online Presence for the first year.
- After the first year, standard pricing applies.
- No founding discount on Ads Management ($477/mo flat for all clients).
- Ad spend is always separate.

---

## Ad spend

Ad spend is **always separate** and is paid by the restaurant directly to the
ad platform (Google, Meta, TikTok). Veroxa manages the advertising system; the
restaurant controls and pays the actual ad budget. No plan includes ad spend.

---

## Complete Online Presence — setup support

If the restaurant does not already have a needed website, Facebook page,
Instagram account, TikTok account, or Google Business Profile, Veroxa will
help create/setup the required basic account/page/presence as part of
onboarding. This is **not** a custom website development package.

---

## What must NOT appear on public pages

- ❌ Term-based pricing tiers: 12-month / 6-month / 3-month / no-contract
- ❌ Old term prices: $997, $1,097, $1,197, $1,497
- ❌ Old bundle prices: $1,797, $1,897, $1,997, $2,297
- ❌ Old ads add-on price: $1,500/mo
- ❌ Old ads standalone price: $2,000/mo as a public offer
- ❌ Google Optimization as a standalone public plan
- ❌ Ads Management Only as a standalone public plan
- ❌ Any separate "Bundle" plan label
