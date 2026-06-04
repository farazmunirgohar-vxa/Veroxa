---
name: Veroxa two-role operating model
description: Authoritative current Veroxa model, locked pricing, Codex-first build mode, and the two-role constraint that overrides older Owner/Operator docs.
---

# Veroxa two-role model

The live Veroxa Growth OS has exactly two active human roles: **Restaurant
Partner (Client)** and **Veroxa Team / Internal Admin (Faraz)**. There are NO
active Owner/Operator dashboards in the live experience, and NO AI/automation
language is shown to clients. Do not use Super Admin language.

**Builder/source-of-truth model:** Codex is the primary engineering/build/hardening
partner for Veroxa. Replit is secondary/preview-only unless Faraz explicitly says
otherwise. GitHub main remains the source of truth.

**Why:** many `docs/*` files describe planned Owner/Operator layers, AI agents,
auth, publishing, lead engines, and retired pricing. Those are aspirational or
historical plans, not the current model. Treating them as current leads to work
that contradicts the active two-role direction.

**How to apply:**
- Authoritative current-state doc: `artifacts/veroxa/docs/CURRENT_REAL_VEROXA_MODEL.md`
  (it explicitly supersedes older Owner/Operator/AI-exposed/retired-pricing docs).
  Companion stage docs: `CLIENT_TEAM_COMMUNICATION_LOOP.md`,
  `DAILY_CUSTOMER_OPPORTUNITY_ENGINE.md`, `MOBILE_TEAM_REVIEW_MODEL.md`.
- Client-visible vs team-visible status comes from
  `src/lib/workflow/workflowStatus.ts` (`deriveClientVisibleStatus` /
  `deriveInternalTeamStatus`) over the single lifecycle status — do not invent a
  parallel vocabulary.
- Growth suggestions live in `src/domain/dailyOpportunity` — rule-based,
  deterministic via `ctx.now`, team-only surface ("Today's Suggested Push" on the
  team dashboard). Designed so a future AI layer can replace rule bodies behind
  the same function signatures without touching the UI.
- Locked current public pricing (do not change): Starter $295/month, Growth
  $495/month, Premium $995/month. Starter is capped at up to 3 posts/week
  depending on usable client-provided media. Growth adds TikTok + Reels support,
  better support/stronger communication, stronger consistency, weekly updates,
  monthly report, and stronger workflow without public daily posting language.
  Premium adds ad management and up to 1 post/day after readiness assessment,
  client approval, and agreed ad budget; ad spend remains separate.
- Deprecated historical pricing: the retired Core / Ads add-on / combo model and
  founding-client pricing are not current and must not be presented as active
  public pricing.
