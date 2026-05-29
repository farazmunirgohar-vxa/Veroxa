# AI-First SOP Model

_Veroxa's operating model for how AI agents and the human team divide work._

> **Status (2026-05-29):** Real workflow foundation, backend pending. All AI
> output in the current build is **rule-based** — no live model calls, no cloud
> writes, no publishing, no client auto-messaging. Prepared drafts attach to
> workflow items and humans approve everything that reaches a client. See
> `REAL_WORKFLOW_FOUNDATION.md`.

> **Update (2026-05-29).** Per-upload reasoning is now consolidated in the
> **Restaurant Content Intelligence Pipeline**
> (`RESTAURANT_CONTENT_INTELLIGENCE_PIPELINE.md`): one upload →
> restaurant/media/customer-moment/angle/platform/timing/risk/next-action, then
> three strategic caption drafts **only after a quality gate passes**.
> Still rule-based with a safe fallback; human approval still required.

---

## 1. Operating principle

Veroxa runs an **AI-first, human-approved** workflow.

- AI does the **first draft, sort, score, summary, recommendation, and risk flag**.
- The Veroxa team **approves, corrects, escalates, or rejects** every AI output before it reaches the client.
- The client experiences a calm, organized service — not the underlying AI mechanics.

---

## 2. What AI can do

- Sort and triage incoming uploads, messages, and submissions.
- Score media quality and recommend usage (use now / save / needs context / not recommended).
- Draft captions, content angles, and posting windows.
- Draft weekly client updates and monthly report summaries.
- Surface risk flags and blockers with a recommended next human action.
- Recommend the team's next best action across the daily queue.

## 2.1 Structured output rule

Every AI agent returns a **structure, not just text**. The standard envelope
(`AiAgentOutput` in `src/lib/ai/aiAgentTypes.ts`) carries:

- `category` — what kind of output it is.
- `confidenceLevel` — high / medium / low (never a guarantee of outcome).
- `sourceInputs` — what the draft was based on.
- `outputSummary` — the prepared result.
- `recommendedNextAction` — the next human step.
- `humanApprovalRequired` — always `true`.
- `approvalGate` — which gate must be cleared before the work flows on.
- `riskFlags[]` — categorized risks, each with a next human action.
- `automationReadiness` — ready / needs review / blocked / not applicable.

This makes every agent operationally useful: the team always sees what was
produced, how sure the draft is, what to do next, and what is blocking flow.

## 3. What AI cannot do

- Publish anything to a client's channels.
- Send messages directly to clients.
- Update the database, billing, or storage.
- Guarantee performance outcomes (reach, engagement, sales).
- Invent metrics. If real metrics aren't connected, AI output says so.
- Make final go/no-go decisions on anything client-facing.

## 4. Human approval rules

The Veroxa team is the final approval layer for:

- Anything posted to a client's Instagram, Facebook, Google, or any other public channel.
- Anything sent to the client (weekly updates, monthly reports, replies).
- Any change to the client's content strategy or capture plan.
- Any escalation that requires the client to make a decision.

AI output is **always treated as a draft.** The portal labels show this explicitly: `Ready`, `Needs team review`, `Approved`, `Blocked`, `Manual review needed`.

## 5. Client-safe explanation

The client sees a single, calm disclosure on their portal:

> _Veroxa uses AI-assisted organization to help the team review uploads,
> prepare content ideas, and keep work moving. Final review stays with the
> Veroxa team._

Client surfaces only ever show simple status labels:

- **Uploaded** — your file has reached Veroxa.
- **Being reviewed** — Veroxa is looking at it.
- **Needs your input** — Veroxa needs a short reply from you.
- **Prepared by Veroxa** — ready and approved by the team.
- **Included in report** — closed out and appears in your weekly/monthly summary.

Client surfaces never show:

- Internal AI agent names
- Risk levels
- Internal team notes
- Quality scores or technical labels

## 6. Team SOP flow

```
Client upload
   ↓
AI review        ← scoring, angle suggestion, usage recommendation
   ↓
AI draft         ← captions, posting window, weekly update draft
   ↓
Team approval    ← approve / revise / ask client / mark blocked / mark complete
   ↓
Client update or report
```

### Team-side labels (more operational detail)

The team portal shows:

- The AI agent that prepared each draft.
- Suggested content angle and recommended posting window.
- Risk and blocker flags with a recommended next human action.
- An **AI Operator Assistant** snapshot on the team dashboard: items ready
  for approval, blocked, needing client input, fresh AI drafts, and the top
  next-best action for the day.

### Execution lifecycle mapping

A single submission moves through one lifecycle, surfaced three ways. The
internal submission `status` is the source of truth; the team status and the
client-safe label are both **derived** from it (see
`clientTeamWorkRepository` and `aiAgentPreviewEngine`).

| Submission status | Team work status | AI agent status | Client-safe label |
|---|---|---|---|
| `new` / `needs_review` | `ready_for_team` | `ready` | Uploaded |
| `accepted` / `in_progress` | `in_progress` | `needs_human_review` | Being reviewed |
| `needs_client_clarification` | `waiting_on_client` | `manual_review_needed` | Needs your input |
| `blocked` | `waiting_on_client` | `blocked` | Needs your input |
| (team review stage) | `ready_for_review` | `needs_human_review` | Being reviewed |
| `completed` / `archived` | `completed` | `approved` | Prepared by Veroxa / Included in report |

> The client never sees the internal or AI columns — only the calm label.
> Nothing reaches a client until a human moves the item past the team review
> stage (`Prepared by Veroxa`).

### AI agent vocabulary (internal)

- **Media Review Agent** — scores media, recommends usage, suggests angle.
- **Content Strategist Agent** — chooses the angle and rationale.
- **Caption Draft Agent** — drafts short caption variants.
- **Scheduling Recommendation Agent** — suggests post window and reason.
- **Client Update Agent** — drafts the weekly client summary.
- **Reporting Draft Agent** — drafts weekly/monthly report structure.
- **Risk / Blocker Agent** — flags risks with a recommended next human action.
- **Team Operator Assistant** — surfaces the daily command-center snapshot.

## 7. Capacity guidance

| Mode | Clients per employee | What it looks like |
|---|---|---|
| Manual | 3–5 | Team drafts, reviews, schedules, and reports by hand. |
| AI-assisted (current target) | 6–10 | AI drafts first; team approves and corrects. |
| Mature AI-first | 8–12 | AI handles routine prep end-to-end; team focuses on exceptions, strategy, and client relationship. |

Capacity scales because AI removes the **drafting cost**, not the **judgement cost**. Final judgement always stays with the team.

## 8. Where this lives in the codebase

- `src/lib/ai/aiAgentTypes.ts` — shared type contracts (agents, statuses, outputs).
- `src/lib/ai/aiAgentPreviewEngine.ts` — deterministic rule-based engine.
- `src/lib/ai/aiDraftClient.ts` — frontend helper for the optional server-side
  AI draft endpoint (`POST /api/ai/draft`). Always returns a structured
  `{ mode, draft, message }`; never throws into the UI.
- `src/lib/content/contentDraftPreviewEngine.ts` — deterministic content draft
  pipeline (media → angle → caption → team review).
- `src/lib/scheduling/schedulePreviewEngine.ts` — scheduling/publishing-prep
  (prep only; no real publishing).
- `src/pages/client-*.tsx` — client-safe AI-assisted workflow surfaces.
- `src/pages/team-*.tsx` — team-facing AI operator assistant + per-item previews.

A real model call is now available **optionally** via the server-side
`POST /api/ai/draft` endpoint, which reads `OPENAI_API_KEY` server-side only
and falls back to the rule-based engine when AI is not configured. See
`AI_DRAFT_ENDPOINT_CONTRACT.md`, `CONTENT_SCHEDULING_PIPELINE.md`, and
`FUTURE_BACKEND_CONTRACT.md`. When wired further, model calls should slot in
**behind the same interfaces**; the page-level UI contracts should not change.

## 9. Lead intelligence + outreach in the SOP

Prospecting and outreach prep now follow the same AI-first split: the
deterministic Lead Intelligence engine drafts first (scores, segments, contact
paths, outreach copy, next steps), and the team applies judgement and sends
manually. AI removes the drafting cost; the team keeps the judgement and the
send decision.

- Engine: `src/lib/leadIntelligence/` (deterministic, rule-based).
- Optional AI copy rewrite via `POST /api/ai/draft` draft types
  `lead_outreach_email`, `lead_follow_up_email`, `lead_call_script`,
  `lead_meeting_agenda`, with rule-based fallback.
- Human review is required before any outreach. Nothing auto-sends. See
  `LEAD_INTELLIGENCE_OUTREACH_ENGINE.md` and
  `OUTREACH_COMPLIANCE_GUARDRAILS.md`.

## 10. Self-improving lead engine in the SOP

The SOP now closes the loop: after a human reaches out manually, they **log the
outcome** (stage reached, response, objection). The deterministic learning layer
turns those outcomes into cautious signals — prioritisation, bounded score
adjustments, and targeting/outreach recommendations — so the next pass is sharper
without removing human judgement.

- Engine: `src/lib/leadIntelligence/selfImprovingLeadEngine.ts`,
  `leadLearningSignals.ts`, `leadPrioritizationEngine.ts` (deterministic, local).
- Patterns are signals, not rules; adjustments are bounded and labelled by
  confidence; weaker segments are "weaker so far", never "bad".
- Outcome logging contacts no one — it only records a result. See
  `SELF_IMPROVING_LEAD_ENGINE.md`.
