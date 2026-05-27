# Veroxa Demo Visual Walkthrough Status

_Last updated: May 2026_

## Overview

This document tracks the demo-polish state of each role portal in the Veroxa Growth OS demo build. All content is **demo-only** — fixture data, simulated AI, no real backend, no real publishing, no real client credentials.

---

## Client Portal

### What the demo now shows

| Page | Visual status |
|------|--------------|
| Dashboard | "This Week's Media" image strip (3 demo food cards with status pills) · "Upcoming Content" schedule preview with thumbnails · "How Veroxa is working this week" 5-step flow timeline · Amber CTA card linking directly to AI Draft Preview |
| AI Draft Preview | Upload dropzone (local browser URL only, no server) · 4-step simulated loading ticker · 3 generated draft cards each showing the uploaded photo thumbnail (or styled placeholder) · Schedule preview with slot rows · "What Veroxa would do next" panel: team-review gate + DemoFlowTimeline (Team review → Operator OK → Scheduled → Report update) · Safety badges on every results section |
| Calendar | Post cards with demo food thumbnails · Scheduled / In Review / Posted status pills · Amber "Nothing posts until the Veroxa team approves it" gate banner · Demo-only footer note |
| Reports | Monthly Report card (live from hook) + Weekly Update, Top Post, Content Consistency supplementary cards · Mini metric rows per card · All clearly demo-labelled |
| Media | Upload guidance, quality tags, capture plan guidance (existing rich page, 500 lines) |

### Story told
> "I upload a restaurant photo → Veroxa turns it into 3 captioned drafts → my team reviews it → it schedules to the right platform at the right time → I get a weekly and monthly report."

---

## Team Portal

### What the demo now shows

| Page | Visual status |
|------|--------------|
| Dashboard | Stats grid · Media Review Queue visual strip (3 thumbnail cards with Accept/Needs Better Photo/Use Later demo buttons) · Work Queue + Active Alerts panels |
| Media Review | Demo food thumbnails on every media item card (aspect-video, object-cover) · Accept / Needs Better Photo / Use Later demo buttons on each card · "Demo only — no action is saved" microlabel · Content Review Guidance strip |
| Content Review / Drafts | Safe / Engagement / Sales caption variant cards with food thumbnails · Approve Draft / Edit Caption / Send to Schedule demo buttons per variant · Existing full review queue below |
| Work Queue | Existing client work queue |
| Alert Center | Existing alert cards |

### Story told
> "My job is to review uploaded media, choose the best caption angle, and send it to the schedule — all before anything goes live."

---

## Operator Portal

### What the demo now shows

| Page | Visual status |
|------|--------------|
| Operator OS | Client health rows now have per-client restaurant thumbnails (deterministic from `pickHeroImageFor`) · Progress bars + risk badges · KPI tiles · Alerts · Low-content + reschedule queues · AI agent monitoring |
| Report Approvals | Richer cards: client + period · summary metrics (posts published, reach, consistency) · internal note badge · Approve — Demo and Request revision buttons · "Demo only — no approval is saved" microlabel |
| System Status | New "Veroxa OS system map" grid at top: Media Intake → AI Drafting → Team Review → Scheduling → Reporting → Alerts (all shown as Demo Only amber nodes) · Existing integration status list below |
| Client Health | `ClientHealthCenter` component (operator view) |
| Team Oversight | Workload cards with completion progress bars (existing) |

### Story told
> "I see client health at a glance, approve reports before they go to clients, monitor the team's workload, and confirm what's live vs. demo in the system."

---

## Owner Portal

### What the demo now shows

| Page | Visual status |
|------|--------------|
| Executive Dashboard | "Veroxa OS flow" DemoFlowTimeline (Client Upload → AI Drafts → Team Review → Schedule → Report) at the top · KPI tiles · Revenue trend bar chart · Service plan distribution + client health distribution |
| Revenue | MRR area chart (Recharts, existing) · **New** "Active Plan Mix" cards (one per plan tier using locked `demoServicePlans` pricing) · Growth summary cards |
| AI Agents | Interactive agent library with category tabs (Content / Operations / Intelligence / Executive) · DemoOnlyBanner · Each agent has "Demo only — agents are static simulations. No AI APIs are connected." visible |
| Client Health | `ClientHealthCenter` component (owner view) |
| Alerts | `NotificationCenter` component (owner view) |

### Story told
> "I see the whole business at a glance — revenue, client health, AI system readiness — and I understand how Veroxa's OS flows from upload to report."

---

## Shared demo visual layer

| Component | Status |
|-----------|--------|
| `DemoImageCard` | Live — card with image, title, subtitle, status pill |
| `DemoMediaPreviewCard` | Live — compact thumbnail + label tile |
| `DemoSchedulePreview` | Live — ordered list with thumbnails + platform/time |
| `DemoFlowTimeline` | Live — responsive horizontal flow steps |
| `DemoAIBadge` | Live — amber "Simulated AI" badge |
| `DemoStatusPill` | Live — tone-colored status pill |
| `demoImages` catalog | Live — 16 stock images across 6 categories, `getDemoImage`, `getDemoImagesByCategory`, `pickHeroImageFor` |

---

## Safety confirmation

| Check | Status |
|-------|--------|
| `AUTH_MODE` | `"placeholder"` — unchanged |
| Portal database connection | Disconnected — all data from fixture files |
| OpenAI / Anthropic / Gemini / AI API | Not imported, not called, not configured |
| Supabase storage upload | Not present in any demo feature |
| Real publishing API | Not connected |
| Payment / billing integration | Not connected |
| `supabase/migrations/` files added | None added in this pass |
| Pricing values | Unchanged (locked at existing constants) |
| Roles | Client / Team / Operator / Owner — unchanged |
| Demo gate | `veroxa-preview` — unchanged |
| Typecheck | PASS |

---

## Remaining polish items (not yet completed)

- `client-media.tsx` — already 500+ lines of capture guidance; could add DemoImageCard grid as a separate "Your recent uploads" strip.
- `team-work-queue.tsx` / `team-alert-center.tsx` — functional existing pages; could add more prominent image thumbnails.
- `owner-client-health.tsx` — uses `ClientHealthCenter`; could extend with restaurant thumbnail strip above it.
- `owner-alerts.tsx` — uses `NotificationCenter`; could add a severity-grouped visual layer above the component.
- Mobile layout: all new sections use responsive Tailwind grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` patterns). No overflow issues observed; can be verified in narrow viewport.
