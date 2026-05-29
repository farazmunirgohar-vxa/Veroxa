# AI Agent & Automation Blueprint

> **Update (2026-05-29) — Execution Intelligence.** The automation blueprint now
> covers **retention** alongside acquisition and content. Execution Intelligence
> classifies client health, reads retention risk, and recommends a single next
> action — all rule-based and prepared, never auto-sent. A **human decides**
> every retention action; risk detail is team-only and never blames the client.
> See `EXECUTION_INTELLIGENCE_ENGINE.md` and `VEROXA_GROWTH_FLYWHEEL.md`.

> **Update (2026-05-29).** Automation now operates as a prepared, rule-based
> step inside the real workflow foundation (`REAL_WORKFLOW_FOUNDATION.md`).
> Prepared drafts and recommended next actions attach to workflow items and
> always require human/team approval before anything becomes client-facing.

> **Update (2026-05-29).** Per-upload content reasoning now runs through the
> **Restaurant Content Intelligence Pipeline**
> (`RESTAURANT_CONTENT_INTELLIGENCE_PIPELINE.md`). It is rule-based with a safe
> fallback, gates caption drafting on media/context quality, never invents
> menu/offer claims, and emits a recommended next human action per upload. If a
> real model is wired later it must run server-side only (e.g. `OPENAI_API_KEY`
> never reaches the client) behind the same interface.

> **Purpose.** Describes Veroxa's rule-based automation layer and the future
> real automation it anticipates. The current build prepares tasks, drafts, and
> reminders only. It performs **no** real external actions — no publishing, no
> client auto-messaging, no notifications, no cloud writes.

---

## 1. Operating principle

- AI agents **draft, sort, score, summarize, recommend, and flag.**
- AI agents must **not** publish, send client messages, guarantee outcomes,
  invent performance numbers, or make final decisions.
- Automations **prepare** tasks and reminders. A human approves anything
  client-facing before it moves.

## 2. Current automation previews

Defined in `src/lib/automation/automationPreviewEngine.ts`. Each preview shows
the trigger, condition, what Veroxa would prepare, the approval gate, any
blocker, and the future integration real execution would require.

| Trigger | Veroxa prepares | Human approves | Blocked / future |
|---------|-----------------|----------------|------------------|
| `media_uploaded` | AI media review | Media before use | — |
| `media_needs_context` | Clarification task w/ suggested question | Message before client send | Needs client context · future notifications |
| `content_angle_ready` | Caption draft task (claim-risk checked) | Content before scheduling | — |
| `caption_approved` | Scheduling suggestion | Content before scheduling | Future publishing connector |
| `weekly_cycle_due` | Weekly update draft | Report before client visible | — |
| `month_end_due` | Monthly report draft | Report before client visible | — |
| `lead_audit_completed` | Onboarding checklist (local only) | Lead summary before outreach | No DB write · future Supabase |
| `missing_metrics` | Report verification task | Report before client visible | Metrics not connected · future Supabase |

## 3. Human approval gates

- `content_before_scheduling`
- `report_before_client_visible`
- `message_before_client_send`
- `media_before_use`
- `lead_summary_before_outreach`
- `claim_before_public_use`

No automation skips its gate. No AI output is treated as final.

## 4. No automatic external action (hard rules)

- No auto-publish to Google/Meta or any social platform.
- No auto-message / auto-email / auto-SMS / auto-WhatsApp to clients.
- No Supabase writes, storage uploads, payments, or notifications.
- No new public routes. Owner/Operator remain parked and hidden.

## 5. Future real automation (after activation)

When the backend is activated, these previews would map to real triggers
behind the **same** interfaces:

- **Supabase** — persist agent outputs, automation runs, approvals, reviews.
- **Storage** — real media uploads.
- **Google/Meta publishing APIs** — scheduled posting after approval.
- **Email/SMS/WhatsApp** — client notifications after approval.
- **Calendar / reminder workflows** — cadence reminders for the team.

## 6. What remains manual for trust

- Final approval of any client-facing content, report, or message.
- Conversion of a lead into an active client.
- Any claim (halal, authentic, family-owned, discounts, specials) must be
  confirmed by the client before public use.

See also `AI_FIRST_SOP_MODEL.md`, `VEROXA_QUALITY_GUARDRAILS.md`, and
`FUTURE_BACKEND_CONTRACT.md`.

## 7. Lead intelligence + outreach automation (preview only)

The Lead Intelligence + Outreach Engine is a deterministic preview today and
follows the same automation boundaries:

- No auto-send / auto-call / auto-text of outreach. Drafts only.
- No private scraping — public/audit data only.
- "Mark ready for outreach" flags a lead for human review; it sends nothing.
- Optional AI copy rewrite behind `POST /api/ai/draft` with rule-based
  fallback; `OPENAI_API_KEY` server-side only.

When the backend is activated, outreach send/call/schedule would map to real
triggers behind the **same** interfaces, always after explicit human approval.
See `LEAD_INTELLIGENCE_OUTREACH_ENGINE.md` and
`OUTREACH_COMPLIANCE_GUARDRAILS.md`.

## 8. Self-improving learning loop (preview only)

The learning layer closes the loop deterministically and locally: logged
outcomes → cautious signals → prioritisation, bounded score adjustments, and
targeting/outreach recommendations. It is preview-grade and follows the same
boundaries:

- Outcome logging is a human action that contacts no one — it records a result.
- Learned patterns are signals, not rules; adjustments are bounded (±10) and
  applied only past a minimum sample, damped while emerging.
- Every learned pattern is labelled by confidence; below the established sample
  size the surface is flagged "Still learning — early signals".
- No model call, no network, no auto-decision. A human always decides.

See `SELF_IMPROVING_LEAD_ENGINE.md`.
