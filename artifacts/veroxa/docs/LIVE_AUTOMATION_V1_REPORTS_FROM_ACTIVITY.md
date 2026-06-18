# Live Automation V1 Reports From Activity Foundation

Status: GitHub PR #108 Reports From Activity Foundation only. PR #107 Team Automation Control Center is already merged.

## What GitHub PR #108 adds

- A gated Team route at `/team/reports-from-activity` for preparing report drafts from real Veroxa `activity_log` records and internal work history.
- A Reports From Activity feature gate requiring `AUTH_MODE === "real"`, `VITE_VEROXA_REPORTS_FROM_ACTIVITY_ENABLED=true`, authenticated Team role for Team work, and authenticated Client role with active restaurant context for client reads.
- Report service helpers for listing report-eligible activity, creating drafts, listing Team reports, updating safe Team statuses, and listing only `published_to_client` reports for clients.
- Conservative reports table constraints and RLS so active Team can select/insert/update report records and active clients can select only their own `published_to_client` portal reports.
- Client Reports page behavior for future real-gated mode that shows only reviewed reports released inside the client portal.

## Locked runtime truth

- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains active.
- Roles remain `client` and `team` only.
- Momo owner walkthrough remains blocked.
- Reports are based on real Veroxa activity/work history.
- Reports do not include fake metrics.
- Reports do not include external analytics.
- Reports do not claim revenue, orders, rankings, ROI, customers, or walk-ins.
- Reports do not publish externally.
- Client-visible reports require Team review and are visible inside the client portal only.
- Publishing means portal visibility only; it does not post to Google, Meta, Yelp, TikTok, email, SMS, or any external surface.

## Sequence lock

- GitHub PR #108 adds Reports From Activity Foundation only.
- Momo Live Pilot Readiness Gate remains PR #109.
- Controlled Momo Pilot Activation Gate remains PR #110.
