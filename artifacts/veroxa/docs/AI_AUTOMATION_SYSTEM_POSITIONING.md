# Veroxa — AI / Automation System Positioning

_Status: planning only. No OpenAI API calls, no image editing, and no storage
are added in this phase. This document frames how the future AI/automation
layer is positioned so the build stays consistent with the simple two-role
operating model (see
[`CURRENT_TWO_ROLE_OPERATING_MODEL.md`](./CURRENT_TWO_ROLE_OPERATING_MODEL.md))._

## Positioning principle

AI agents are **backend / team-assist layers**, not a client-facing product.

- The **client** does not experience "AI agents" as the main interface. The
  client experiences Veroxa: simple uploads, simple requests, clear updates and
  reports.
- The **team** may, later, see AI **suggestions** — but always in a simple,
  human-reviewed format, never as raw model output the team has to manage.

If AI is mentioned to the client at all, keep it very soft:

> "Veroxa uses assisted tools behind the scenes. Final review stays with the
> Veroxa team."

## Future agents (backend/team-assist framing)

These are described as internal assist layers. None of them are wired to a live
model in this phase.

- **Daily Opportunity Agent** — surfaces the best growth angle to push today.
- **Content Bucket Agent** — organizes incoming media into usable content
  themes.
- **Caption Agent** — proposes caption options for team review.
- **Image Quality Agent** — flags images that need a better shot or angle.
- **Image Enhancement Agent** — proposes (never auto-applies) image
  improvements; editing is out of scope for now.
- **Google / Profile Agent** — assists with Google Business Profile presence.
- **Review Growth Agent** — assists with growing and responding to reviews.
- **Weekly Update Agent** — drafts the structure of the weekly client update.

## How team-facing suggestions should appear (later)

When suggestions are eventually surfaced to the team, keep the format minimal
and action-oriented:

- Suggested angle
- Suggested caption
- Suggested next action
- Suggested image improvement

Each suggestion is a **draft for the team**, not an automatic action. The
Veroxa team always makes the final call before anything is shared or posted.

## Hard guardrails for this phase

- No OpenAI (or other model) API calls.
- No image editing / enhancement execution.
- No file storage.
- No publishing, payments, production auth, or Owner/Operator dashboards.
- No pricing changes.

The future AI image/caption workflow stays **team-reviewed** end to end.
