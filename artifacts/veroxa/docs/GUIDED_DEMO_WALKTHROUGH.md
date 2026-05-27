# Guided Sales Demo Walkthrough

## Purpose

The guided demo gives a restaurant owner (or sales prospect) a clear,
structured path through the Veroxa experience without needing to explore
every portal page on their own. It narrates the Veroxa story in 8 steps,
from a single food photo upload to a smarter AI-backed recommendation.

Route: `/guided-demo`
Access: **public** — no login required to view the guide itself.

---

## Step order and routes

| # | Title | Route | Role | Access |
|---|-------|-------|------|--------|
| 1 | Client uploads restaurant media | `/demo/client/media` | Client | Public |
| 2 | Veroxa turns one food photo into 3 posts | `/demo/client/ai-draft-preview` | Client | Public |
| 3 | Team reviews media quality and tags assets | `/demo/team/media-review` | Team | Internal |
| 4 | Team selects and approves the best caption | `/demo/team/content-review` | Team | Internal |
| 5 | Client sees upcoming content on their calendar | `/demo/client/calendar` | Client | Public |
| 6 | Client receives weekly updates and reports | `/demo/client/updates` | Client | Public |
| 7 | Veroxa recommends the next smart action | `/demo/operator/evidence-engine` | Operator | Internal |
| 8 | Owner sees the full Veroxa OS from the top | `/demo/owner/executive-dashboard` | Owner | Internal |

---

## What each step demonstrates

### Step 1 — Client uploads media
The restaurant owner uses the Media Library to upload photos and videos.
They see Veroxa's media guidance engine recommending what to shoot, and
can observe quality tags and content supply health.

### Step 2 — AI Draft Preview
The core "one photo → three posts" pitch. The prospect can upload any
food photo (or use the placeholder) and watch the simulated AI generate
three content drafts with different angles, captions, and scheduled times.

### Step 3 — Team media review
Shows how the Veroxa team is the quality gate. Every uploaded asset is
reviewed before a caption is written. Prospects see this is not a
fully-automated "set and forget" tool — there is a human review layer.

### Step 4 — Caption variant review
Shows the team choosing between Safe, Engagement, and Sales caption angles.
Reinforces that Veroxa is brand-safe and that every caption is reviewed
before anything is scheduled.

### Step 5 — Content calendar
The client's view of what is scheduled, when, and on which platform.
Shows the restaurant owner what their weekly content dashboard looks like
in practice.

### Step 6 — Updates and reports
Shows the weekly communication the restaurant owner receives from Veroxa —
results, what was published, Google impressions, and what comes next.

### Step 7 — Evidence Engine
Operator-level view of how Veroxa makes data-backed recommendations.
Shows confidence scores, past performance patterns, and role-specific
next actions. This is the "intelligence layer" of the pitch.

### Step 8 — Owner Executive Dashboard
The high-level business view — portfolio health, risk signals, system
flow, and revenue indicators. Relevant for multi-restaurant owners or
Veroxa's own internal business review.

---

## Demo-only safety boundaries

- All data is fixture/demo data only. No real client, restaurant, or
  customer data is displayed.
- No real AI API is called. The simulated AI in Step 2 is a
  deterministic local simulation.
- No real uploads occur. Files selected stay in the browser only.
- No real posts are scheduled or published.
- Nothing is stored. All state resets on refresh.

---

## Access controls

Steps 1, 2, 5, and 6 are on public client routes — no login required.

Steps 3, 4, 7, and 8 are on internal Team, Operator, and Owner routes
protected by `InternalDemoGuard`. The guided demo page clearly labels
these steps and instructs the visitor to enter the demo access code
`veroxa-preview` when prompted.

**The guided demo does not bypass `InternalDemoGuard`.** Each protected
step still requires the code. The guide only helps the visitor understand
where to go and what to look for once they are inside.

---

## Files

| File | Purpose |
|------|---------|
| `src/data/demo/demoWalkthrough.ts` | Structured walkthrough data (steps, routes, what-to-look-for) |
| `src/pages/guided-demo.tsx` | The guided demo page at `/guided-demo` |
| `src/App.tsx` | Route registration (`/guided-demo`) |
| `src/pages/demo-hub.tsx` | Guided Demo card on the `/demo` hub |

---

*Last updated: May 2026*
