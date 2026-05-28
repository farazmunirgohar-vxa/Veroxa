# Role Visibility Audit

This document is the source of truth for what each Veroxa role
should and should not see in the current Replit phase
(Read-Only Operations Foundation).

It is paired with the role-permissions code in
`src/lib/permissions/` and `src/domain/users/permissions.ts`.

## Client

**Should see:**

- Their uploaded media and content supply.
- Published and upcoming content.
- Weekly updates summarising their account.
- Monthly reports with growth and visibility trends.
- Google profile activity (views, calls, directions).
- Simple, friendly action callouts when something needs them.

**Should NOT see:**

- AI drafts or raw caption variants.
- Internal draft history or revision logs.
- Rejection reasons or operator notes.
- Risk scoring, health grades, or lead source quality scores.
- Team workload, assigned-to fields, or staff names.
- Owner revenue / MRR / financial dashboards.
- Internal workflow stage names (e.g. `internal_approval`).
- Repository-layer or data-source-mode badges. Language stays
  human and product-level.

## Team

**Should see:**

- Their work queues (shared client-team workflow).
- Media review queue.
- Content review queue.
- Scheduling tools.
- Weekly validation queue.
- Report preparation queue.
- Client requests and direction-center handoffs.

**Should NOT see:**

- Owner revenue command center.
- Role / permission controls.
- Owner-only business strategy or M&A-level information.
- Operator-only escalation toggles for billing / contracts.

## Operator

**Should see:**

- Alerts and priority board.
- Per-client and portfolio health.
- Risk center.
- Blocked workflow items.
- Failed posts.
- Monthly report approvals.
- Quality review queue.
- Escalations from team.

**Should NOT:**

- Approve every post individually (would create a bottleneck).
- Be in every daily execution loop the team handles.
- Control owner-level billing, pricing, or role assignment.

## Owner

**Should see:**

- Revenue and MRR.
- Growth trends.
- Retention and churn risk.
- Critical alerts only (not every operator escalation).
- Portfolio health summary.
- Business-level reports.
- Client risk distribution.

**Should NOT:**

- Work daily team queues.
- Review every media item.
- Approve every draft.
- Manage weekly task noise.

## Forbidden language audit

The following strings are NOT used in production app surfaces or
docs (besides documenting that they should not be used):

- "Super Admin"
- "Admin Dashboard"
- "Execution Dashboard"

### Audit results

| File                                            | Line | Context | Action |
| ----------------------------------------------- | ---- | ------- | ------ |
| `src/lib/permissions/README.md`                 | 27   | The terms appear inside a contributor-facing rule that explicitly bans them: "Never use **Admin**, **Super Admin**, or **Execution Dashboard** — these terms are not part of the Veroxa role system." | Keep — this is the rule that bans them, not a use. |

No other occurrences found anywhere in `artifacts/veroxa/src/` or
`artifacts/veroxa/docs/`.

## Internal-only badges and labels

Internal portals (team / operator / owner) may display the badge
**"Source: Demo repository layer"** to make data provenance clear
during this Replit phase. The client portal MUST NOT show that
badge or any other technical / backend-implementation language.

## Client-facing copy rules

- No internal stage names (`internal_approval`, `team_review`).
- No staff names except where the client has explicitly invited
  them.
- No risk grades, health scores, or numeric lead quality scores.
- No mention of "repository", "Supabase", "adapter", "fallback",
  "fixture", "demo data" — except in the demo-only safety banner
  the platform already shows.

## Operational rules

- AUTH_MODE stays `"placeholder"` in this phase.
- DATA_MODE stays `"fixture"` in this phase.
- VEROXA_DATA_SOURCE_MODE stays `"demo"` in this phase.
- No real writes, real auth, real AI, real publishing, real
  payments, or real storage uploads.
- New demo data goes to `src/data/demo/*` split files (never bloat
  the `demoData.ts` barrel).
