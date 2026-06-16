# Veroxa Locked Operating Memory

## 2026-06-16 — Actual GitHub PR sequence lock

Profile Corrections has already merged as GitHub PR #103. The next GitHub PR should be **PR #104 — Real Messages / Portal Threads Foundation**.

`LIVE_AUTOMATION_V1_PR_SEQUENCE.md` is the current source of truth for actual GitHub PR numbering. If older docs still say Real Messages was PR #103 or Profile Corrections was PR #104, treat that as original planning language, not actual GitHub history.

Current corrected sequence:

1. PR #99 — Live Automation V1 Architecture + Schema Design.
2. PR #100 — Supabase Auth Foundation.
3. PR #101 — Database Foundation.
4. PR #102 — Media Upload + Storage Foundation.
5. PR #103 — Profile Corrections Foundation.
6. PR #104 — Real Messages / Portal Threads Foundation next.
7. PR #105 — Activity Log Foundation.
8. PR #106 — AI Draft Preparation Foundation.
9. PR #107 — Team Automation Control Center Foundation.
10. PR #108 — Reports From Activity Foundation.
11. PR #109 — Momo Live Pilot Readiness Gate.

Do not skip to Activity Log, AI, Team Automation Control Center, Reports, real-auth activation, integrations, publishing, payments, or Momo walkthrough before Real Messages is built safely.

## 2026-06-15 — PR 100 Supabase Auth Foundation

PR 100 is the first Live Automation V1 implementation step. It adds real-auth foundation code and setup documentation while keeping `AUTH_MODE` as `placeholder`; `/api/pilot-access` remains the active safe Momo/Team Faraz pilot login path. Real auth is not activated, and the Momo owner walkthrough remains blocked until full Live Automation V1 is built and approved.

Status: highest-priority current operating memory as of 2026-06-14. This file exists to prevent future Veroxa work from drifting back to stale manual-first Momo walkthrough planning.

## 2026-06-14 — Automation-first Momo pivot

Faraz's newest locked direction is: **before any Momo owner walkthrough, Veroxa must be live and automatic enough to operate with minimum human interference.**

The older manual-first Momo walkthrough path is now stale for the current Momo plan. Historical manual/pre-live docs can still explain existing code state, safety boundaries, and prior decision context, but they must not be treated as the active path for taking Momo through an owner walkthrough unless Faraz explicitly re-approves a manual-first walkthrough.

## Current operating rule

Detailed Live Automation V1 architecture and module sequencing live in `LIVE_AUTOMATION_V1_ARCHITECTURE.md`; actual GitHub PR numbering now lives in `LIVE_AUTOMATION_V1_PR_SEQUENCE.md`. Read both before implementing any PR 100+ live automation work.

- Do **not** schedule, design around, or assume a Momo owner walkthrough until **Live Automation V1** exists.
- Do **not** treat older first-client/manual launch walkthrough docs as the current Momo execution plan.
- Do **not** build product features from this memory doc alone; it is a source-of-truth alignment document.
- Keep the existing manual/pre-live code state honest until live systems are intentionally connected.
- Preserve all public/client safety gates even when automation is added.

## Live Automation V1 target before Momo walkthrough

Live Automation V1 means Veroxa can operate with minimum human interference while still keeping Faraz in control of public/customer-visible output. The target sequence is:

1. Real auth for the approved pilot roles and accounts.
2. Database-backed account and restaurant records.
3. Real client media upload and storage flow.
4. Real client/team messages or portal request thread flow.
5. Owner profile corrections that become pending Veroxa review.
6. Activity log capturing meaningful internal/client-facing work events.
7. AI drafting/preparation for internal Veroxa work where allowed.
8. Team Automation Control Center for Faraz review, approval, edits, holds, and skips.
9. Reports generated from approved activity and tracked work rather than static/manual-only content.

This target does not mean uncontrolled automation. It means Veroxa should prepare, organize, draft, track, and route work automatically enough that Faraz is reviewing and approving a managed operating system instead of manually walking the owner through a mostly static preview.

## Automation boundaries

Automation may prepare and process internal work, including:

- analyzing available restaurant information;
- organizing uploaded media;
- drafting captions, updates, message replies, report summaries, profile correction suggestions, and next-step recommendations;
- classifying issues, blockers, and business-truth confirmation needs;
- creating internal activity records and review items;
- preparing Team-facing actions for approval, edit, skip, hold, or client confirmation.

Automation must not bypass safety gates.

## Approval and business-truth gates

Public or customer-visible actions still require Veroxa/Faraz approval before anything goes live.

Business-truth changes require client confirmation before approval or execution, including:

- hours and holiday hours;
- menu items, menu availability, and prices;
- discounts, offers, promotions, bundles, or specials;
- address, phone, ordering, reservation, website, and social links;
- catering availability;
- halal, organic, health, allergen, ownership, award, certification, or similar claims;
- sensitive complaint responses or public reputation-impacting language.

Veroxa must not invent discounts, BOGO offers, price cuts, lower prices, or new promotions. If a restaurant already has an offer or promotion, Veroxa may ask the client to confirm exact details before preparing public copy.

## Current technical truth to preserve

As of this operating memory:

- CP-V1 client portal is polished for the intended owner-facing shape.
- Profile Corrections foundation is merged as GitHub PR #103, but real-auth activation is still off and profile corrections are not public/platform updates.
- Real Messages / Portal Threads are still missing and should be built next.
- `AUTH_MODE` remains `placeholder`.
- Full live data, production auth activation, live messages, activity-backed reports, and live AI are not connected yet.
- Therefore the Momo owner walkthrough is blocked until Live Automation V1 is built and approved.

## Relationship to older docs

Older manual-first, first-client, preview-login, pre-live, and Momo readiness docs remain historical context unless refreshed by a newer source-of-truth doc. They may still be useful for route inventories, copy constraints, safety rules, and understanding current code limitations, but they must not override this automation-first Momo pivot or the actual PR numbering in `LIVE_AUTOMATION_V1_PR_SEQUENCE.md`.

When future Codex or ChatGPT work sees conflicts:

1. Follow Faraz's newest explicit instruction.
2. Then follow `ACTIVE_DOCS_INDEX.md`, `LIVE_AUTOMATION_V1_PR_SEQUENCE.md`, and this locked operating memory.
3. Treat older manual-first Momo walkthrough language as stale for the current Momo path.
4. Preserve safety gates for approval, client confirmation, and no fake live execution.

## 2026-06-15 — PR #101 Database Foundation status

- Database Foundation is the second implementation step after the PR #100 auth foundation in the Live Automation V1 sequence.
- The foundation adds schema, migrations, RLS/security baseline, TypeScript contracts, documentation, and guardrails only; it does not complete Live Automation V1.
- `AUTH_MODE` remains `placeholder`, `/api/pilot-access` remains active, no portal page is live database-powered, and Momo owner walkthrough remains blocked.

## 2026-06-15 — PR #102 Media Upload + Storage status

- Media Upload + Storage is the third Live Automation V1 implementation step after auth and database foundations.
- It adds a private `restaurant-media` storage foundation, safe upload validation/path/service code, and gated client upload UI, but it does not complete Live Automation V1.
- Upload does not mean publish: uploaded media is only received for Veroxa review and is not approved, posted, public, or used in marketing automatically.
- `AUTH_MODE` remains `placeholder`, `/api/pilot-access` remains active, upload is not active in placeholder mode, and Momo owner walkthrough remains blocked.

## 2026-06-16 — GitHub PR #103 Live Automation V1 Profile Corrections lock

- GitHub PR #103 adds Profile Corrections foundation only.
- Correction requests may be recorded for internal Veroxa review, but they are not Google, Meta, website, menu, price, link, or public-platform updates.
- Approved corrections update internal Veroxa profile records only after Team Faraz review. Business-truth fields still require owner/client confirmation before execution.
- `AUTH_MODE` remains `placeholder`; Momo owner walkthrough remains blocked.
- Real Messages / Portal Threads are still missing and must be the next GitHub PR #104.
- Activity Log, AI Drafting, Reports, Team Automation Control Center, integrations, publishing, payments, cron jobs, background jobs, and webhooks remain future PRs.

## 2026-06-16 — PR #104 Real Messages / Portal Threads foundation

GitHub PR #104 adds the Real Messages / Portal Threads foundation after Profile Corrections merged as GitHub PR #103. `AUTH_MODE` remains `placeholder`, `/api/pilot-access` remains active, and real portal messages require real auth plus `VITE_VEROXA_MESSAGES_ENABLED=true`. Messages are portal-only and are not SMS, email automation, DMs, comments, customer-service inbox handling, refund/order support, AI runtime, publishing, payments, webhooks, cron jobs, or background jobs. Placeholder mode must not fake message sending, delivery, replies, or persistence. Activity Log remains PR #105, AI Drafting remains PR #106, and Momo owner walkthrough remains blocked.
