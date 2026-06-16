# Live Automation V1 Profile Corrections Foundation

Status: Profile Corrections foundation only. This feature merged as **GitHub PR #103** even though older Live Automation planning originally labeled Profile Corrections as PR #104.

For actual PR numbering, follow `LIVE_AUTOMATION_V1_PR_SEQUENCE.md`.

## What GitHub PR #103 added

- A gated client correction request path for existing `restaurant_profile_fields` records.
- A gated Team Faraz profile correction queue for review decisions.
- Minimum Supabase RLS/write policies for `profile_corrections` client inserts and active-team review updates.
- Approved profile corrections update internal Veroxa `restaurant_profile_fields.value` records only after Team review.
- Business-truth fields such as hours, menu, prices, offers, address, phone, ordering links, social links, catering, dietary/religious/health/allergen claims, and complaint/reputation-impacting language remain confirmation/review gated.

## Locked runtime truth

- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains active.
- Profile Corrections are gated behind real auth, an authenticated client/team session, an active restaurant/clientId where required, and `VITE_VEROXA_PROFILE_CORRECTIONS_ENABLED=true`.
- In placeholder mode, the client profile remains calm review-only and does not show fake save buttons, fake submitted behavior, or fake persistence.
- Profile corrections are not public/platform updates.
- Approved corrections update internal Veroxa profile records only.
- Nothing is published automatically.
- Momo owner walkthrough remains blocked.

## Not included in GitHub PR #103

Real Messages / Portal Threads, Activity Log runtime, AI Drafting, Reports, Team Automation Control Center, Google/Meta/Yelp/TikTok integrations, publishing, payments, cron jobs, background jobs, webhooks, SMS/email automation, fake profile updates, fake reports, and customer-visible execution remain future PRs.

## Next required module

Real Messages / Portal Threads should be the next GitHub PR #104 before Activity Log, AI Drafting, Team Automation Control Center, Reports From Activity, or Momo Live Pilot Readiness Gate.
