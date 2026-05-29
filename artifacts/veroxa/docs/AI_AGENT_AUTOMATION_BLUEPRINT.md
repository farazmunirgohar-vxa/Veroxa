# AI Agent & Automation Blueprint

> **Purpose.** Describes Veroxa's automation **preview** layer and the future
> real automation it anticipates. The current build is rule-based preview only:
> it prepares tasks and reminders. It performs **no** real external actions —
> no publishing, no client auto-messaging, no notifications, no writes.

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
