# Veroxa Pricing — Source of Truth

Last updated: 2026-05-29

This document is authoritative. All UI copy, demo fixtures, engine logic, and
docs that mention plan price values must agree with this file. The runtime
source of truth is `artifacts/veroxa/src/data/pricing/veroxaPricing.ts`.

---

## Active public plans

### Complete Online Presence

The core Veroxa system. Term-based pricing (same service at all terms):

| Term          | Monthly price |
|---------------|:-------------:|
| 12-month      |      $997     |
| 6-month       |    $1,097     |
| 3-month       |    $1,197     |
| No-contract   |    $1,497     |

### Ads Management (add-on)

Available as an add-on to Complete Online Presence **only** — not sold standalone.

| Term          | Monthly price |
|---------------|:-------------:|
| All terms     |    $1,500     |

Ads Management carries no term discount — it is a flat $1,500/mo regardless of
the Complete Online Presence commitment term selected.

### Complete Online Presence + Ads Management (combined totals)

This is **not** a separate "bundle" plan. It is the two line items added
together so sales conversations can quote a single number.

| Term          | COP     | Ads    | Combined total |
|---------------|--------:|-------:|---------------:|
| 12-month      |   $997  | $1,500 |       $1,797   |
| 6-month       | $1,097  | $1,500 |       $1,897   |
| 3-month       | $1,197  | $1,500 |       $1,997   |
| No-contract   | $1,497  | $1,500 |       $2,297   |

---

## Hidden / internal plans

These plan IDs exist in `veroxaPricing.ts` and are referenced by the Free Audit
recommendation engine and internal lead-scoring. They are **not** shown on the
public Pricing page or any public copy.

| Plan ID              | Status   | publicVisible | Internal price | Notes                                    |
|----------------------|----------|:---:|-------:|------------------------------------------|
| `google_optimization` | retired | false | $477/mo | Free Audit / lead-scoring compat only   |
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

The 50% first-year founding-client offer **is no longer active** in the current
public pricing. Remove it from all customer-facing surfaces (pricing page,
homepage, services page, CTAs, sales copy).

The `priceMonthlyFounding` field and `FOUNDING_CLIENT_OFFER_DISCLAIMER` export
remain in `veroxaPricing.ts` because internal audit output formatters still
reference them. Do not surface them publicly.

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

## What was removed (DO NOT reintroduce on public pages)

- ❌ Old flat-rate Complete Online Presence at `$977/mo`.
- ❌ 50% founding-client first-year offer on public pricing.
- ❌ Old Ads Add-on at `+$477/mo` or `+$497/mo`.
- ❌ Combined totals of `$1,454/mo` or `$1,474/mo` or `$965/mo`.
- ❌ Google Optimization as a standalone public plan.
- ❌ Ads Management Only as a public offer (hidden until dependency audit).
- ❌ Separate "Bundle" plan label.
