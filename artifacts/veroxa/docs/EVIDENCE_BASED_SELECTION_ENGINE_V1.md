# Evidence-Based Selection Engine V1

**Status**: Demo-only — live in the Veroxa Growth OS demo build.  
**Date**: May 2026  
**Hard invariants**: No AI API · No external API · No database · No Supabase · No publishing.

---

## What it is

A deterministic rule engine that demonstrates how Veroxa makes smarter content and operations recommendations by synthesising four types of evidence:

1. **Past performance** — historical post engagement, reach, saves, and lessons learned.
2. **Media quality signals** — composite quality scores (base quality + freshness + lighting + food clarity − risk penalty).
3. **Client context memory** — content runway, goal, scheduling state, platform strengths, risk level.
4. **Posting schedule intelligence** — preferred windows derived from top-performing historical posts.

The engine is **entirely fixture-driven** — no API calls, no DB reads, no randomness. The same inputs always produce the same outputs.

---

## Architecture

```
src/data/demo/demoEvidenceMemory.ts       ← fixture data (past posts, media signals, client contexts)
src/lib/evidence/evidenceSelectionEngine.ts ← pure deterministic rule engine
src/components/evidence/
  EvidenceReasonStack.tsx                 ← visual evidence reasons list
  EvidenceScoreCard.tsx                   ← score breakdown (4 dimensions)
  EvidenceRecommendationCard.tsx          ← primary recommendation card (client / team / operator variants)
  EvidenceMemoryTimeline.tsx              ← timeline of past evidence events
src/pages/operator-evidence-engine.tsx   ← dedicated Operator Intelligence page
```

### Engine functions

| Function | Returns | Used by |
|---|---|---|
| `getEvidenceProfile(clientId)` | Full profile: context + best media + top posts + recommendation | Evidence Engine page |
| `recommendNextPost(clientId)` | `EvidenceRecommendation` with confidence, reasons, risk notes, next step | All portal integrations |
| `scoreMediaForNextPost(clientId)` | Ranked media list with composite scores | Evidence Engine page |
| `recommendPostingTime(clientId)` | Best window + reason | Evidence Engine page |
| `recommendClientAction(clientId)` | Client-facing action with urgency | Evidence Engine page |
| `recommendOperatorAction(clientId)` | Operator-facing action with urgency | Operator OS, Evidence Engine page |
| `getEvidenceReasons(clientId)` | Evidence reason list | Shared |
| `getEvidenceTimeline(clientId)` | Timeline events | Evidence Engine page |

### Confidence score formula

```
base:           60
+ 12  if best media quality ≥ 80
+ 10  if top post is "Top performer"
+ 8   if best media was uploaded today
+ 5   if content runway ≥ 6 days
+ 5   if scheduled posts < 3
+ 2   if recent risk is None or Low
cap:  97 (never shows 100% — reflects demo-only state)
```

### Media composite score formula

```
base:           qualityScore × 0.5
+ 20  if uploadedToday
+ 20  if lighting = Excellent
+ 12  if lighting = Good
+ 4   if lighting = Fair
+ 15  if foodClarity = Sharp
+ 6   if foodClarity = Acceptable
- 25  if riskFlag is present
cap:  100
```

---

## Demo clients

| Internal ID | Display name | Risk | Runway | Primary goal |
|---|---|---|---|---|
| `mamadali` | Demo Grill House | Low | 8 days | Grow Friday evening dinner reservations |
| `urban` | Demo Taco Bar | High | 4 days | Drive weekday lunch foot traffic |
| `crescent` | Demo Mediterranean Grill | None | 14 days | Build premium Instagram reputation |
| `alnoor` | Demo Cafe | Critical | 2 days | Increase morning traffic and discovery |

---

## Portal surfaces

### Operator Portal — Evidence Engine page (`/demo/operator/evidence-engine`)
- Client selector tabs (all 4 demo clients)
- KPI tiles: confidence, media quality, runway, risk
- Primary recommendation card (operator variant)
- Score breakdown (4 dimensions)
- Evidence memory timeline
- Media scoring ranked list
- Top historical posts (lessons applied)
- Role-based next actions: Client / Team / Operator / Owner

### Operator OS — Evidence recommendations section
- Compact per-client rows showing recommendation title, confidence %, and operator action urgency
- "Open Evidence Engine →" link

### Client Portal Dashboard — Smart Recommendation section
- Client-friendly card showing recommendation title, confidence, and top 3 reasons
- CTA link to AI Draft Preview

### Team Portal Media Review — Evidence-Based Pick section
- Team-variant card with "Use this media", "Send to drafts", "Mark for later" buttons
- Demo disclaimer: no action saved

### Owner OS — Evidence Intelligence section
- 4 metric tiles: Recs generated, High-confidence count, Top opportunity client, Active risk flags
- "Open Evidence Engine →" link

---

## demoOnly invariant

Every `EvidenceRecommendation` object carries `demoOnly: true` as a non-optional field. This is a structural reminder that no recommendation in V1 corresponds to real data, real clients, or real AI output.

---

## What V2 might look like

- Replace fixture data with real Supabase queries (posts table + media table + client health table)
- Replace rule-based scoring with a lightweight ML model or weighted scoring API
- Add operator override: mark a recommendation as "approved" and queue it to the content pipeline
- Add client approval flow: client can accept or reject the next-post recommendation from their portal
