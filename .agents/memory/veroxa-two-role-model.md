---
name: Veroxa two-role operating model
description: Which doc is authoritative for how Veroxa actually works, and the two-role constraint that overrides older Owner/Operator docs.
---

# Veroxa two-role model

The live Veroxa Growth OS has exactly two human roles: **Restaurant Partner
(Client)** and **Veroxa Team (Faraz)**. There are NO Owner/Operator dashboards in
the live experience, and NO AI/automation language is shown to clients.

**Why:** many `docs/*` files (and the operator portal nav) describe planned
Owner/Operator layers, AI agents, auth, publishing, and lead engines. Those are
aspirational plans, not the current model. Treating them as current leads to
proposing work (e.g. "expand the operator portal") that contradicts the active
two-role direction.

**How to apply:**
- Authoritative current-state doc: `artifacts/veroxa/docs/CURRENT_REAL_VEROXA_MODEL.md`
  (it explicitly supersedes older Owner/Operator/AI-exposed docs). Companion stage
  docs: `CLIENT_TEAM_COMMUNICATION_LOOP.md`, `DAILY_CUSTOMER_OPPORTUNITY_ENGINE.md`,
  `MOBILE_TEAM_REVIEW_MODEL.md`.
- Client-visible vs team-visible status comes from
  `src/lib/workflow/workflowStatus.ts` (`deriveClientVisibleStatus` /
  `deriveInternalTeamStatus`) over the single lifecycle status — do not invent a
  parallel vocabulary.
- Growth suggestions live in `src/domain/dailyOpportunity` — rule-based,
  deterministic via `ctx.now`, team-only surface ("Today's Suggested Push" on the
  team dashboard). Designed so an AI layer can replace rule bodies behind the same
  function signatures without touching the UI.
- Locked pricing (do not change): $977 / $488 founding / +$477 ads / $1,454 combo /
  $965 founding combo. Source: `src/data/pricing/veroxaPricing.ts`.
