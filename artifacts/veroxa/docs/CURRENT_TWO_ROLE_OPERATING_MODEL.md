# Veroxa — Current Two-Role Operating Model

_Status: current build. This document describes how Veroxa actually operates
right now, so future changes stay aligned with the real, simple model instead of
the larger multi-role system that is parked._

## The two roles that exist today

Veroxa currently has **two** real roles:

1. **Restaurant Partner (Client)** — the restaurant owner/operator who uploads
   media, responds to requests, and reviews updates and reports.
2. **Veroxa Team** — the person handling the work. Right now "Veroxa Team"
   means **Faraz**. The team portal is built for one person doing real work,
   not a large content department.

Everything else (Owner, Operator) is **parked** until explicitly requested.
Parked routes render a simple "Parked" screen via `InternalDemoGuard`; do not
build Owner/Operator dashboards or workflows in this phase.

## Core experience principle

Veroxa can be complex behind the scenes, but the outside experience must stay
**simple, premium, calm, and easy**.

- The **client** sees outcomes and simple requests — not internal machinery.
- The **team** portal is also human-friendly, simple, and action-focused.

### What the client should see

Plain Veroxa status language only:

- Submitted
- In review
- Prepared by Veroxa
- Needs your input
- More content needed
- Veroxa team review
- Included in report

### What the client should NOT see

AI agents, raw AI drafts, backend terms, Supabase, fixture, database, RLS, dev
write, adapter, internal workflow IDs, internal scoring, rejection reasons,
storage pending, OpenAI, or image-enhancement pipeline language.

If AI is referenced at all on the client side, keep it very soft:

> "Veroxa uses assisted tools behind the scenes. Final review stays with the
> Veroxa team."

(The shared copy for this lives in `CLIENT_AI_DISCLOSURE` /
`CLIENT_AUTOMATION_DISCLOSURE` in `src/lib/ai/aiAgentTypes.ts`.)

## What the team sees

The Team Dashboard (`/team/dashboard`) answers a small set of questions:

1. What needs my attention today?
2. What media / client submissions came in?
3. What should I work on next?
4. What customer-growth opportunity should I push?
5. What client update / report is due?

Layout (kept deliberately calm):

1. Header — "Today's Veroxa Work"
2. Priority cards — New submissions · Needs review · Client follow-up ·
   Reports/updates due
3. Today's Client Work
4. Media Review Queue
5. Active Alerts / Blockers
6. Work Queue summary (optional lower section)

Avoid portfolio-level language that implies a large company, Owner/Operator
language, and "AI lab" framing.

## AI / automation positioning

AI and automation are **behind-the-scenes, team-assist layers** — not a
client-facing experience and not yet wired to any live model. No OpenAI API
calls are made in this phase. See
[`AI_AUTOMATION_SYSTEM_POSITIONING.md`](./AI_AUTOMATION_SYSTEM_POSITIONING.md)
for how the future agents are framed.

The future AI image / caption workflow stays **team-reviewed**: nothing is
shared or posted without a human (Veroxa team) final review.

## Routing rules (do not merge these flows)

- **Demo Preview** → `/demo/client/dashboard` (public, no login).
- **Portal Access** → `/login`.
- **Login** → `/login`; placeholder login routes client/team to their correct
  portal afterward.
- `/demo/client/dashboard` remains the public preview.
- `/client/*` is the current client review route. It is guarded by
  `ClientPortalGuard` and `RealPortalDataBoundary`. Production auth is still
  future gated because `AUTH_MODE` remains `"placeholder"`; placeholder preview
  login is not production auth.
- `/team/*` stays behind `InternalDemoGuard role="team"` and
  `RealPortalDataBoundary`. Production auth is still future gated.

Do not make Demo Preview require login, and do not let Portal Access bypass
login.

## Parked until requested

- Owner portal and Owner dashboards
- Operator portal and Operator dashboards
- Production auth, real client data, storage uploads, publishing, payments,
  live AI calls, Google/Meta connectors, and other production integrations
- Pricing changes (pricing is locked)
