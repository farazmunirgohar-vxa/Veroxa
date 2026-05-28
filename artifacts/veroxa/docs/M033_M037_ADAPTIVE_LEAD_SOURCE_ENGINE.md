# M033–M037 — Adaptive Lead Source Engine

Date: 2026-05-28

## Purpose

Upgrade the Veroxa self-selling lead engine so Veroxa is not dependent on
the Free Audit as the only lead source. Add source tracking, source quality
scoring, a Team Lead Source Lab, an experiment planner, source-level
recommendations, and yield-aligned language cleanup — all without adding
any AI, scraping, database writes, real auth, payments, or third-party APIs.

## Hard invariants

Same as M028–M032. See `M028_M032_SELF_SELLING_LEAD_ENGINE.md` for the
full list.

## M033 — Expanded Lead Source Taxonomy

### New `LeadSource` values (replaces 5-value set)

**Direct Outreach**
`walk_in`, `phone_call`, `cold_email`, `instagram_dm`, `facebook_dm`,
`google_maps_manual_search`, `manual_prospect`, `area_scan`

**Website / Self-Selling**
`free_audit`, `guided_demo`, `pricing_page`, `contact_page`, `qr_code`,
`flyer`, `niche_landing_page`, `seasonal_landing_page`,
`google_profile_health_check`, `slow_day_visibility_check`,
`content_readiness_check`

**Relationship**
`founder_network`, `family_friend_referral`, `client_referral`,
`restaurant_owner_referral`, `community_referral`,
`mosque_community_center`, `halal_network`, `pakistani_community_network`,
`turkish_mediterranean_network`, `vendor_partner`, `pos_partner`,
`menu_printer`, `food_supplier`, `commercial_realtor`,
`accountant_bookkeeper`

**Proof / Case Study**
`case_study`, `before_after_report`, `monthly_result_snapshot`,
`client_testimonial`, `referral_from_success`, `restaurant_seen_on_social`

**Campaign / Event**
`ramadan_campaign`, `eid_campaign`, `holiday_catering_campaign`,
`lunch_traffic_campaign`, `slow_day_campaign`, `new_restaurant_opening`,
`grand_opening`, `food_festival`, `local_event`, `seasonal_offer`

**Legacy / Catch-all**
`referral`, `other`

### New types / maps

- `LeadSourceCategory` — 6 categories
- `LEAD_SOURCE_LABELS` — human-readable label for every source
- `LEAD_SOURCE_CATEGORY` — maps every source to its category
- `LEAD_SOURCE_CATEGORY_LABELS` — human-readable category labels
- `getLeadSourceLabel(source)` — safe lookup with "Unknown / Other" fallback
- `getLeadSourceCategory(source)` — safe lookup

### Backward compatibility

`getLeadSourceLabel` and `getLeadSourceCategory` return fallback values for
any legacy string not in the expanded map. Existing locally stored leads
continue to render safely.

### Updated internal scoring

`scoreWarmRelationship` in `internalLeadScoring.ts` now recognises all
relationship and community-network sources as warm-relationship signals,
not just the legacy `referral` value.

## M034 — Lead Source Quality Score Model

### Types (`leadSourceTypes.ts`)

- `LeadSourceQualityGrade` — `scale | improve | selective | low_quality | pause`
- `LeadSourceQualityScore` — 8-category breakdown (100 pts total)
- `LeadSourcePerformanceSnapshot` — full performance record per source
- `LeadSourceRecommendation` — action + reason + next step
- `LeadSourceExperiment` — experiment record
- `LeadSourceExperimentStatus` — `planned | active | paused | completed`

### Lead Source Quality Score (100 pts)

| # | Category | Pts | Notes |
|---|----------|-----|-------|
| 1 | Lead Volume | 15 | Count relative to busiest source |
| 2 | Lead Quality | 20 | Average internal lead score / 100 |
| 3 | Walkthrough Conversion | 15 | Walkthroughs / total |
| 4 | Close Conversion | 15 | Won / (Won+Lost); neutral 5 if no data |
| 5 | Package Value | 10 | Avg founding MRR vs $489 anchor |
| 6 | Execution Fit † | 10 | Estimated from lead quality + category |
| 7 | Yield Potential † | 10 | Estimated from lead score + priority share |
| 8 | Retention / Referral † | 5 | Conservative estimate from category |

† = internal preliminary estimate until real yield data is connected.

### Quality grades

- 85–100 → `scale`
- 70–84 → `improve`
- 55–69 → `selective`
- 40–54 → `low_quality`
- 0–39 → `pause`

### Scoring functions (`leadSourceScoring.ts`)

- `calculateLeadSourcePerformance(leads)` — all active sources
- `calculateSingleSourcePerformance(source, leads, maxCount)` — one source
- `getLeadSourceQualityGrade(score)` — grade from score
- `getLeadSourceRecommendation(snapshot)` — recommendation string
- `rankLeadSources(leads)` — sorted by quality score desc
- `getLeadSourceRecs(leads)` — full recommendation objects

### Analytics helpers (`leadAnalytics.ts`)

- `summarizeLeadsBySource(leads)` — count map by source
- `getTopLeadSources(leads, limit)` — top N by quality score
- `getWeakLeadSources(leads)` — low_quality + pause sources with ≥1 lead
- `getLeadSourceMix(leads)` — breakdown by category with percentages

## M035 — Team Lead Source Lab

Route: `/demo/team/lead-source-lab` — behind `InternalDemoGuard role="team"`.

### Sections

1. **Source Health Summary** — summary cards: active sources, best source,
   Priority A leads, walkthrough requests, projected founding MRR, sources
   to scale, sources to improve / review, top category.

2. **Source Performance Table** — sortable by quality score; click a row
   to expand the detail card with the 8-category breakdown.

3. **Source Recommendations** — one action badge + reason + next step per
   source. Labelled as preliminary estimates.

4. **Source Experiments** — create / update / delete experiments with
   status tracking. Grouped by status (Active → Planned → Paused → Completed).

5. **Source Learning Notes** — static principles: yield scoreboard, lead
   bringing power, preliminary estimates disclaimer, future upgrades list.

### Empty state

If no leads exist, shows an empty state with example experiments. The
experiment planner is fully functional regardless of lead data.

## M036 — Source Experiment Planner

Local store: `localLeadSourceExperimentStore.ts`
- localStorage with sessionStorage fallback
- No network, no Supabase, no fetch
- Exports: `createLeadSourceExperiment`, `getLeadSourceExperiments`,
  `updateLeadSourceExperiment`, `deleteLeadSourceExperiment`,
  `clearLeadSourceExperimentsForDemo`

UI in `team-lead-source-lab.tsx`:
- Create form with source, title, hypothesis, dates, targets, notes
- Expand / collapse experiment rows
- Mark experiment status (planned / active / paused / completed)
- Delete experiment

## M037 — Yield-Aligned Lead-Source Language

- `M028_M032_SELF_SELLING_LEAD_ENGINE.md` updated with yield principle
  section.
- `SERVICE_DEFINITION_SOURCE_OF_TRUTH.md` updated with Adaptive Lead Source
  Engine section.
- `FIRST_CLIENT_READINESS_CHECKLIST.md` updated with M033–M037 status.
- `BUILD_STATUS.md` updated with M033–M037 summary.

## Files added

- `src/lib/leads/leadSourceTypes.ts`
- `src/lib/leads/leadSourceScoring.ts`
- `src/lib/leads/leadAnalytics.ts`
- `src/lib/leads/localLeadSourceExperimentStore.ts`
- `src/pages/team-lead-source-lab.tsx`
- `docs/M033_M037_ADAPTIVE_LEAD_SOURCE_ENGINE.md`

## Files edited

- `src/lib/leads/leadTypes.ts` (expanded taxonomy + category maps)
- `src/lib/leads/internalLeadScoring.ts` (scoreWarmRelationship)
- `src/App.tsx` (new route)
- `src/lib/teamPortalNav.ts` (Lead Source Lab nav item)
- `docs/M028_M032_SELF_SELLING_LEAD_ENGINE.md`
- `docs/SERVICE_DEFINITION_SOURCE_OF_TRUTH.md`
- `docs/FIRST_CLIENT_READINESS_CHECKLIST.md`
- `docs/BUILD_STATUS.md`

## What this build does NOT touch

- Pricing values (read-only from `VEROXA_PLANS`)
- `AUTH_MODE` (remains `placeholder`)
- `DATA_MODE` (remains `fixture`)
- Owner / Operator portals (not expanded)
- Any real AI, scraping, Google, social, payment, or publishing API
- Database writes or migrations
- Public audit page (internal score / source quality never shown there)

## Future upgrades

- Source URL parameters for automatic lead attribution
- QR code tracking per source
- CSV import for bulk prospect lists
- Approved Google Places API area scan (after business decision)
- Partner / referral source tracking
- Source-to-yield reporting after clients onboard
- Source ROI dashboard comparing effort to real customer-action improvement
