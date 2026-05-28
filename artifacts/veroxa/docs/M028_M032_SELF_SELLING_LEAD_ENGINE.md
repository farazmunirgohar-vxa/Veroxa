# M028–M032 — Self-Selling Lead Engine

Date: 2026-05-28

## Goal

Turn the public `/free-audit` tool into a self-selling lead engine for
Veroxa, with an internal-only Veroxa Lead Success Score, a Team Audit
Leads queue, a Manual Prospect Scanner, and first-client readiness
polish — all without adding any AI, scraping, database writes, real
auth, payments, or third-party APIs.

## Hard invariants

- No AI providers (OpenAI / Anthropic / Gemini).
- No scraping, no Google Places, no Meta / TikTok APIs, no ad APIs.
- No DB writes, no migrations, no storage uploads.
- No real auth. `AUTH_MODE=placeholder`, `DATA_MODE=fixture` defaults
  remain unchanged.
- Pricing locked — read from `VEROXA_PLANS`. Founding = 50% off
  standard for the first year. Never hardcode prices.
- `InternalDemoGuard role="team"` protects all team-side surfaces.
- Owner / Operator portals are NOT expanded in this pass.
- All demo seed names are fictional (`Demo Grill House`, `Demo Momo
  Kitchen`, `Demo Mediterranean Table`).
- The internal lead score must **never** appear on the public audit
  page or be sent to restaurants.

## What landed

### M028 — Audit lead capture (local/session)

- `src/lib/leads/leadTypes.ts` — `LeadStage`, `LeadPriority`,
  `LeadSource`, `LeadFollowUpStatus`, `AuditLeadRecord`,
  `AuditLeadSummary` types + label maps.
- `src/lib/leads/localAuditLeadStore.ts` — browser-only store using
  `localStorage` with a `sessionStorage` fallback. SSR-safe; errors
  never bubble. Helpers: `createAuditLeadFromReport`, `saveAuditLead`,
  `getAuditLeads`, `getAuditLeadById`, `updateAuditLeadStage`,
  `updateAuditLeadContact`, `updateAuditLeadNotes`,
  `clearAuditLeadsForDemo`, `summarizeAuditLeads`.
- `src/pages/free-audit.tsx` — bottom CTA replaced with an opt-in
  walkthrough request form. Requires phone or email. On submit the
  audit + contact is saved as a `walkthrough_requested` lead.

### M029 — Internal Veroxa Lead Success Score

- `src/lib/leads/internalLeadScoring.ts` — pure scoring with 8
  categories totaling 100 pts:
  1. Online Weakness / Need (20)
  2. Veroxa Impact Potential (20)
  3. Content Potential (15)
  4. Google / Maps Opportunity (15)
  5. Package Fit / MRR Potential (10) — reads `VEROXA_PLANS`
  6. Owner Reachability / Contactability (10)
  7. Competitive / Niche Advantage (5)
  8. Warm Relationship / Strategic Value (5)
- Priority tiers: 85+ A, 70+ B, 55+ Nurture, 40+ Low, else Not Target.
- Also derives projected founding + standard MRR, suggested opener,
  follow-up, likely objection, outreach angle, and next action.

### M030 — Team Audit Leads queue

- Route: `/demo/team/audit-leads` — behind
  `InternalDemoGuard role="team"`.
- Summary tiles (Total / Walkthrough / Priority A / Projected MRR /
  Follow-up).
- Filter tabs (All, Priority A, Walkthrough Requested, Ready to
  Contact, Nurture).
- List + detail panel showing weak spots, strengths, risks, opener,
  follow-up, objection, contact info, internal notes, and stage update
  buttons.
- If no leads exist, a fictional demo seed of three leads is shown.
  Stage updates and notes are disabled on demo seed leads.

### M031 — Manual Prospect Scanner

- Route: `/demo/team/prospect-scanner` — behind
  `InternalDemoGuard role="team"`.
- Required fields + optional links + internal-only flags (source, owner
  reachability, warm relationship, contact available, strategic note,
  internal note).
- On generate: runs `generateRestaurantAudit` + `generateInternalLeadAudit`
  and shows the public audit summary and internal lead audit side by
  side, with a `Save as lead` button that calls
  `createAuditLeadFromReport` + `saveAuditLead`.

### M032 — First-client readiness polish

- Veroxa Financial Health card on `/demo/team/audit-leads` showing
  projected founding + standard MRR, Priority A count, walkthrough
  requests, won / lost.
- Self-improving system positioning copy on `/free-audit` above the
  walkthrough form.
- Team Portal nav extended with `Audit Leads` and `Prospect Scanner`.

## Files added

- `src/lib/leads/leadTypes.ts`
- `src/lib/leads/internalLeadScoring.ts`
- `src/lib/leads/localAuditLeadStore.ts`
- `src/pages/team-audit-leads.tsx`
- `src/pages/team-prospect-scanner.tsx`
- `docs/M028_M032_SELF_SELLING_LEAD_ENGINE.md`

## Files edited

- `src/pages/free-audit.tsx`
- `src/App.tsx`
- `src/lib/teamPortalNav.ts`
- `docs/FIRST_CLIENT_READINESS_CHECKLIST.md`
- `docs/BUILD_STATUS.md`

## Still needed later

- Real DB persistence for leads (after M024A migration is applied and
  RLS approved).
- PDF audit + walkthrough confirmations.
- Automated outreach cadence + reminders.
- Live Google / social verification for lead audits.

---

## Yield-aligned lead-source principle (added M037)

The audit is one lead source — not the whole lead engine.

Veroxa must adapt to many lead sources: direct outreach, website tools,
referrals, community networks, proof assets, and campaigns. Each source
is tracked and scored internally for quality, not just volume.

**Yield** is the real market scoreboard. Yield means customer actions —
more reviews, more foot traffic, more online orders for restaurant
partners. Vanity metrics (followers, impressions, reach) are not yield.

**Lead bringing power must be as strong as execution power.** The Lead
Engine and Execution Engine should compete to improve each other. A weak
lead engine starves even the best execution system.

**The Financial Health Engine** protects against weak lead flow and
bad-fit growth: it surfaces projected MRR, priority pipeline health, and
won/lost signals so Veroxa avoids taking on clients where execution can't
produce real customer yield.

Source quality is judged over time by whether sources produce clients
where Veroxa can create real, measurable customer-flow improvement for
restaurant partners.
