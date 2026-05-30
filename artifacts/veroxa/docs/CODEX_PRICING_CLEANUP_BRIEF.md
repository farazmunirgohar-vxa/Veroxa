# CODEX PRICING CLEANUP BRIEF

**Purpose:** Historical handoff brief for centralizing the Veroxa pricing model safely.
The active source of truth is now `docs/PRICING_SOURCE_OF_TRUTH.md` and
`src/data/pricing/veroxaPricing.ts`.

---

## 1. Current Visible Pricing Model

The public pricing page (`artifacts/veroxa/src/pages/pricing.tsx`) now shows:

| Plan      | Price      |
| --------- | ---------- |
| Essential | $497/month |
| Growth    | $697/month |
| Premium   | $997/month |

**Global rules displayed to the public:**

- No contract
- Cancel anytime
- Google optimization included in all plans
- Facebook + Instagram included in all plans
- Essential max 1 picture post/day
- Growth adds TikTok + Reels posting support using the photos and videos you provide
- Premium max 2 content posts/day total — 1 picture + 1 reel
- Premium requires 1+ month on Essential/Growth, readiness assessment, client approval, and agreed ad budget
- Posting depends on usable client media and may slow when usable media is unavailable
- Ad spend for Premium is separate — paid directly by the restaurant to the ad platform

---

## 2. Historical problem — resolved for active public pricing

This brief originally tracked cleanup from an old Complete Online Presence /
founding-client model. That model is deprecated/history only and must not be
restored as current public pricing.

The old historical values were:

| Historical entry        | Historical price |
| ----------------------- | ---------------- |
| Complete Online Presence | $977/month       |
| Founding first year     | $488/month       |
| Ads add-on              | $477/month       |
| Combined (with ads)     | $1,454/month     |
| Combined founding       | $965/month       |

The current central file is no longer supposed to use those values as active
public pricing. Legacy plan IDs may remain only as internal compatibility aliases
for audit/lead-scoring paths.

---

## 3. Current objective

Keep the Essential / Growth / Premium pricing model consistent across public
copy, docs, demo-safe app config, and drift checks.

Specifically:

1. Keep `veroxaPricing.ts` as the canonical current pricing constants.
2. Keep the public pricing page aligned with those constants and locked copy.
3. Ensure old public-facing pricing text remains only in clearly labeled deprecated/history sections.
4. If old plan IDs or slugs are still referenced internally, keep them marked as legacy/internal compatibility aliases until a deliberate migration removes them safely.

---

## 4. Safety Rules for Codex

- **Do not** add checkout or payment processing of any kind
- **Do not** add Stripe or any payment SDK
- **Do not** add real AI automation or posting functionality
- **Do not** delete old plan IDs or constants unless a full dependency search confirms zero live references
- **If old IDs are still referenced**, mark them `@legacy` / `@internal-only` and keep them — do not break existing imports
- **Keep public-facing pricing clean** — the three plans, three prices, and the approved global rules only
- **Preserve build stability** — typecheck must pass with `pnpm --filter @workspace/veroxa run typecheck` before marking done
- **Do not change** prices, routes, auth, demo data behavior, team portal behavior, or client portal behavior unless explicitly requested

---

## 5. Files Codex Must Inspect

**Primary targets:**

- `artifacts/veroxa/src/data/pricing/veroxaPricing.ts`
- `artifacts/veroxa/src/pages/pricing.tsx`

**Must check for old pricing references:**

- `artifacts/veroxa/src/pages/services.tsx`
- `artifacts/veroxa/src/pages/free-audit.tsx`
- Audit scoring or recommendation files
- Demo and client data files
- Team portal pages

**Use ripgrep for searches:**

```bash
rg -n "VEROXA_PLANS|veroxaPricing|977|488|477|1454|965|founding" artifacts/veroxa/src
```

---

## 6. Acceptance Checklist

- [x] New three-tier pricing (Essential/Growth/Premium) is centralized in `veroxaPricing.ts`
- [x] Public pricing page is consistent with the central source
- [x] Old public-facing pricing appears only in clearly labeled deprecated/history context
- [x] Premium plan clearly states ad spend is separate from the plan fee
- [x] Premium readiness rule is documented
- [x] Media dependency rule is documented
- [x] First-client / loyalty discount policy is documented
- [x] Old internal plan IDs that are still referenced are marked legacy/internal-only in pricing config
- [x] `pnpm --filter @workspace/veroxa run typecheck` passes with zero errors
