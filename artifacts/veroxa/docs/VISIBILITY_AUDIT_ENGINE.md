# Visibility Audit Engine

The Visibility Audit Engine is the **first source of prepared actions** for the
Approval-to-Execution queue. It looks at a restaurant's online presence —
Google Business Profile, reviews, website, local search wording, social, menu,
and catering — finds visibility gaps, and turns the actionable ones into
**prepared actions** that Faraz reviews in the Approval Queue.

This is a **rule-based / fixture-only foundation**. See
[`APPROVAL_TO_EXECUTION_OS.md`](./APPROVAL_TO_EXECUTION_OS.md) for the queue it
feeds.

## What it does NOT do (hard guardrails)

- ❌ No live Google / Meta / website / CMS calls. No crawling, no fetching.
- ❌ No OpenAI / model calls at runtime. No image generation. No Supabase Storage.
- ❌ No posting, sending, or publishing. Findings only become reviewable actions.
- ❌ No payments / production auth / Owner or Operator dashboards changed.
- ❌ No pricing change. Locked pricing is unchanged.
- ❌ Clients never see the audit, scores, severities, internals, or the queue.

The engine is **pure and deterministic**: every finding comes from an explicit
rule over a fixture input, so the same input always yields the same result.

## Where things live

| Concern | File |
| --- | --- |
| Domain types (categories, severities, sources, input, finding, result) | `src/domain/visibilityAudit/types.ts` |
| Rule engine (`runVisibilityAudit`) | `src/domain/visibilityAudit/engine.ts` |
| Finding → prepared action mapper | `src/domain/visibilityAudit/preparedActionMapper.ts` |
| Client-safe translation layer | `src/domain/visibilityAudit/clientSafe.ts` |
| Domain barrel | `src/domain/visibilityAudit/index.ts` |
| Demo audit inputs (fixtures) | `src/data/demo/demoVisibilityAudits.ts` |
| Read-only repository + queue seeds | `src/lib/visibilityAudit/` |
| Team Visibility Audit page (`/team/visibility-audit`) | `src/pages/team-visibility-audit.tsx` |

## Flow

```
demoVisibilityAudits (fixtures)
        │  runVisibilityAudit(input)         ← rules only, no network/AI
        ▼
VisibilityAuditResult { findings[], score, ... }
        │  generatePreparedActionsFromVisibilityAudit(result)
        ▼
ResolvedPreparedActionSeed[]   ── concatenated with hand-written demo seeds ──▶
        │                                            preparedActionStore.seedActions()
        ▼  rules engine derives riskLevel + approvalRequirement (single gate)
   Approval Queue (/team/approval-queue)
```

## Categories & severities

Categories: `google_business_profile`, `local_seo`, `website`, `reviews`,
`social_profile`, `menu_visibility`, `catering_visibility`, `content_freshness`.

Severities: `low`, `medium`, `high`, `urgent`. Severity maps to prepared-action
priority (`urgent`/`high` → high, `medium` → medium, `low` → low).

## The approval gate stays the single source of truth

The mapper produces **seeds** only — it never sets `riskLevel` or
`approvalRequirement`. Those are derived in `preparedActionStore` from the
prepared-actions **rules engine**, exactly like the hand-written fixtures. This
keeps one safety gate for the whole queue.

Two consequences worth knowing:

- **Sensitive business truths** (catering copy, menu visibility, holiday hours,
  anything mentioning price/hours/menu/halal) are forced to
  `client_confirmation_required` + `sensitive` by the rules engine's text
  heuristic — even when the finding's action type would otherwise be lower risk.
  So holiday-hours and catering findings correctly require the restaurant's
  confirmation before anything changes.
- **Local-search wording** maps to `seo_keyword_update`, which the rules engine
  treats as **internal-only** (folded into a content plan), not a public post.
  This is intentional and consistent with the existing queue; it differs from a
  literal "team approval" reading but preserves the established gate.

## Demo spread (kept un-noisy)

Inputs are authored so findings spread across restaurants and don't duplicate the
hand-written prepared-action fixtures:

- **demo-a — Demo Grill House**: healthy, essentially no findings.
- **demo-b — Demo Taco Bar**: review replies + Google freshness + local wording.
- **demo-c — Demo Mediterranean Grill**: catering + holiday hours (client confirm).
- **demo-d — Demo Cafe**: worst — Google profile, reviews, links, freshness.

## Client-safe layer

`clientSafe.ts` translates findings into calm, plain-language progress
(`getClientSafeVisibilitySummary`, `getClientSafeVisibilityStatus`,
`shouldShowVisibilityFindingToClient`). It is the foundation for future
client-facing progress and is intentionally **not** surfaced in client UI yet —
clients never see scores, severities, internals, or the queue.

## Next step

Connect a real audit source (Google profile, website checks) behind the same
`runVisibilityAudit` surface, and connect execution behind the Approval Queue —
without changing the gate or the client-safe boundary.
