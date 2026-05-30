# CODEX PRICING CLEANUP BRIEF

**Purpose:** Handoff brief for Codex to centralize the new Veroxa pricing model safely.
Do not act on this brief until explicitly instructed to do so.

---

## 1. Current Visible Pricing Model

The public pricing page (`artifacts/veroxa/src/pages/pricing.tsx`) now shows:

| Plan | Price |
|---|---|
| Essential | $497/month |
| Growth | $697/month |
| Premium | $997/month |

**Global rules displayed to the public:**
- No contract
- Cancel anytime
- Google optimization included in all plans
- Facebook + Instagram included in all plans
- Maximum 1 post per day
- Reels + TikTok begin at Growth
- Ads management begins at Premium
- Posting depends on usable client media
- Ad spend for Premium is separate — paid directly by the restaurant to the ad platform

---

## 2. Current Problem

`artifacts/veroxa/src/pages/pricing.tsx` shows the correct three-tier pricing above, but the central pricing constants file **`artifacts/veroxa/src/data/pricing/veroxaPricing.ts`** still contains the old pricing model:

| Old entry | Old price |
|---|---|
| Complete Online Presence | $977/month |
| Founding first year | $488/month |
| Ads add-on | $477/month |
| Combined (with ads) | $1,454/month |
| Combined founding | $965/month |

This old file also contains:
- Founding/early-bird discount language
- Single-plan pricing architecture (one base plan + optional add-on)
- Plan IDs, slugs, and constants that may still be imported elsewhere in the codebase

**The pricing page currently works correctly because it uses inline constants**, not imports from `veroxaPricing.ts`. The central file is stale and inconsistent with what the public sees.

---

## 3. Codex Objective

Codex should later centralize the new Essential / Growth / Premium pricing model so there is a single source of truth that all parts of the app can reliably import.

Specifically:
1. Update `veroxaPricing.ts` to define the new three-tier model (Essential $497, Growth $697, Premium $997) as the canonical constants.
2. Confirm whether `pricing.tsx` should then import from `veroxaPricing.ts`, or whether it should remain with inline constants (to avoid re-introducing a dependency that caused prior drift).
3. Ensure no old public-facing pricing text ($977, $488, $477, $1,454, $965, "founding", "early-bird", "50% off") remains anywhere in the codebase that a public user could see.
4. If old plan IDs or slugs are still referenced internally (lead scoring, audit scoring, demo data), mark them as `@legacy` or `@internal` with a comment, and do not delete them until all references are confirmed safe.

---

## 4. Safety Rules for Codex

- **Do not** add checkout or payment processing of any kind
- **Do not** add Stripe or any payment SDK
- **Do not** add real AI automation or posting functionality
- **Do not** delete old plan IDs or constants unless a full dependency search (`grep -r`) confirms zero live references
- **If old IDs are still referenced**, mark them `@legacy` / `@internal-only` and keep them — do not break existing imports
- **Keep public-facing pricing clean** — the three plans, three prices, and the approved global rules only
- **Preserve build stability** — typecheck must pass with `pnpm --filter @workspace/veroxa run typecheck` before marking done
- **Do not change** prices, routes, auth, demo data, team portal behavior, or client portal behavior

---

## 5. Files Codex Must Inspect

**Primary targets:**
- `artifacts/veroxa/src/data/pricing/veroxaPricing.ts` — stale central constants (needs update)
- `artifacts/veroxa/src/pages/pricing.tsx` — currently correct, uses inline constants

**Must check for old pricing references:**
- `artifacts/veroxa/src/pages/services.tsx`
- `artifacts/veroxa/src/pages/free-audit.tsx`
- Any audit scoring or recommendation files (e.g. `src/domain/visibilityAudit/`)
- Demo and client data files (e.g. `src/data/workflows/`, `src/data/clients/`)
- Team portal pages (`src/pages/team-*.tsx`)

**Find all imports of old pricing constants:**
```bash
grep -r "VEROXA_PLANS\|veroxaPricing\|977\|488\|477\|1454\|965\|founding" artifacts/veroxa/src --include="*.ts" --include="*.tsx" -l
```

---

## 6. Acceptance Checklist

- [ ] New three-tier pricing (Essential/Growth/Premium) is centralized in `veroxaPricing.ts`
- [ ] Public pricing page is consistent with the central source (either imports from it or matches it exactly)
- [ ] No old public-facing pricing ($977, $488, founding discount language) remains visible anywhere a restaurant owner could see
- [ ] No "founding", "early-bird", or discount language appears on any public page
- [ ] Premium plan clearly states ad spend is separate from the plan fee
- [ ] Old internal plan IDs that are still referenced are marked `@legacy` / `@internal-only` with a comment
- [ ] `pnpm --filter @workspace/veroxa run typecheck` passes with zero errors
- [ ] Codex summarizes every changed file and explicitly lists any legacy pricing constants that were kept and why
