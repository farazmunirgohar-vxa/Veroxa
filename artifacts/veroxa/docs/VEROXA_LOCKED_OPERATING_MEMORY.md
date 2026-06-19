## 2026-06-17 — PR #106 AI Draft Preparation Foundation status

GitHub PR #106 adds AI Draft Preparation Foundation only. AI drafts are Team-only internal draft records behind real auth and `VITE_VEROXA_AI_DRAFTS_ENABLED=true`; placeholder mode stays empty. No raw AI output is client-visible, no draft publishes, no draft auto-approves, no reports are generated, Team Automation Control Center remains PR #107, Reports From Activity remain PR #108, and Momo owner walkthrough remains blocked.

## 2026-06-17 — RR fix-forward operating rule

When Faraz asks ChatGPT to RR a Veroxa PR, the job is not only to identify issues. ChatGPT should fix every issue it can reasonably and safely fix directly during the RR before giving the final merge verdict. This includes guardrail/check failures, docs mismatches, PR sequence drift, TypeScript/schema mismatches, migration/RLS/security policy problems, route guard issues, unsafe client visibility, feature-gate mistakes, accidental scope creep, and CI/Veroxa Verify failures that can be patched from GitHub. Only leave an issue for Faraz/Codex when it cannot be safely fixed directly. Do not call a PR merge-ready until fixable RR blockers are patched and the relevant checks are green.

# Veroxa Locked Operating Memory

## 2026-06-19 — Current GitHub PR sequence lock

`LIVE_AUTOMATION_V1_PR_SEQUENCE.md` is the current source of truth for actual GitHub PR numbering. If older docs still say Real Messages was PR #103, Profile Corrections was PR #104, PR #104/PR #107 is next, PR #110 is the activation gate, or PR #111 activates by default, treat those as stale planning labels, not actual GitHub status.

Current corrected sequence:

1. PR #99 — Live Automation V1 Architecture + Schema Design.
2. PR #100 — Supabase Auth Foundation.
3. PR #101 — Database Foundation.
4. PR #102 — Media Upload + Storage Foundation.
5. PR #103 — Profile Corrections Foundation.
6. PR #104 — Real Messages / Portal Threads Foundation.
7. PR #105 — Activity Log Foundation.
8. PR #106 — AI Draft Preparation Foundation.
9. PR #107 — Team Automation Control Center Foundation.
10. PR #108 — Reports From Activity Foundation.
11. PR #109 — Momo Live Pilot Readiness Gate.
12. PR #110 — Post-PR109 Momo readiness alignment.
13. PR #111 — Controlled Momo Pilot Activation Gate.

Do not skip to real-auth activation, external integrations, publishing, payments, or Momo owner walkthrough from PR #111. Future real-world activation steps require separate explicit Faraz approval after the gate.

## 2026-06-15 — PR 100 Supabase Auth Foundation

PR 100 is the first Live Automation V1 implementation step. It adds real-auth foundation code and setup documentation while keeping `AUTH_MODE` as `placeholder`; `/api/pilot-access` remains the active safe Momo/Team Faraz pilot login path. Real auth is not activated, and the Momo owner walkthrough remains blocked until full Live Automation V1 is built and approved.

Status: highest-priority current operating memory as of 2026-06-14. This file exists to prevent future Veroxa work from drifting back to stale manual-first Momo walkthrough planning.

## 2026-06-14 — Automation-first Momo pivot

Faraz's newest locked direction is: **before any Momo owner walkthrough, Veroxa must be live and automatic enough to operate with minimum human interference.**

The older manual-first Momo walkthrough path is now stale for the current Momo plan. Historical manual/pre-live docs can still explain existing code state, safety boundaries, and prior decision context, but they must not be treated as the active path for taking Momo through an owner walkthrough unless Faraz explicitly re-approves a manual-first walkthrough.

## Current operating rule

Detailed Live Automation V1 architecture and module sequencing live in `LIVE_AUTOMATION_V1_ARCHITECTURE.md`; actual GitHub PR numbering now lives in `LIVE_AUTOMATION_V1_PR_SEQUENCE.md`. Read both before implementing any PR 100+ live automation work.

- Do **not** schedule, design around, or assume a Momo owner walkthrough until **Live Automation V1** exists and Faraz explicitly approves the walkthrough.
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
10. Momo readiness gate and controlled activation gate as internal Team-only decision surfaces.

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
- Real Messages / Portal Threads are merged as GitHub PR #104.
- Activity Log is merged as GitHub PR #105.
- AI Draft Preparation is merged as GitHub PR #106.
- Team Automation Control Center is merged as GitHub PR #107.
- Reports From Activity is merged as GitHub PR #108.
- Momo Live Pilot Readiness Gate is merged as GitHub PR #109.
- Post-PR109 Momo readiness alignment is merged as GitHub PR #110.
- Controlled Momo Pilot Activation Gate is current as GitHub PR #111.
- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains active.
- Momo owner walkthrough remains blocked until Faraz explicitly approves activation/walkthrough after reviewing the gate.

## Relationship to older docs

Older manual-first, first-client, preview-login, pre-live, and Momo readiness docs remain historical context unless refreshed by a newer source-of-truth doc. They may still be useful for route inventories, copy constraints, safety rules, and understanding current code limitations, but they must not override this automation-first Momo pivot or the actual PR numbering in `LIVE_AUTOMATION_V1_PR_SEQUENCE.md`.

When future Codex or ChatGPT work sees conflicts:

1. Follow Faraz's newest explicit instruction.
2. Then follow `ACTIVE_DOCS_INDEX.md`, `LIVE_AUTOMATION_V1_PR_SEQUENCE.md`, and this locked operating memory.
3. Treat older manual-first Momo walkthrough language as stale for the current Momo path.
4. Preserve safety gates for approval, client confirmation, and no fake live execution.

## 2026-06-19 — PR #111 Controlled Momo Pilot Activation Gate

GitHub PR #111 adds Controlled Momo Pilot Activation Gate only after PR #109 Momo Live Pilot Readiness Gate and PR #110 Post-PR109 Momo readiness alignment were merged. This decision gate is Team-only and read-only. It does not activate the pilot by default, does not activate real auth, does not create client credentials, does not contact Momo’s House, does not publish externally, does not create platform integrations, and does not add payments, webhooks, cron jobs, or background jobs. `AUTH_MODE` remains `placeholder`, `/api/pilot-access` remains active, and Momo owner walkthrough remains blocked until Faraz explicitly approves activation/walkthrough after the gate. Future real-world activation steps require a separate explicit Faraz approval.


## 2026-06-19 — PR #112 Post-PR111 Activation Gate Alignment

GitHub PR #112 is **Post-PR111 Activation Gate Alignment + Business Truth Status Hardening**. PR #109 Momo Live Pilot Readiness Gate is already merged, PR #110 Post-PR109 Momo readiness alignment is already merged, and PR #111 Controlled Momo Pilot Activation Gate is already merged. PR #112 corrects activation/readiness gate interpretation of current business-truth profile-field statuses (`please_review`, `pre_filled`, `confirmed`, `optional`, `veroxa_review`) and removes stale PR #110 activation-gate wording. PR #112 is corrective alignment only: it does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not publish externally, does not create platform integrations, and does not add payments, webhooks, cron jobs, or background jobs. `AUTH_MODE` remains `placeholder`, `/api/pilot-access` remains active, Momo owner walkthrough remains blocked, no next activation PR is approved by default, and Future real-world activation requires separate explicit Faraz approval.

## 2026-06-19 — PR #113 Post-PR112 source-of-truth finalization

Latest completed Live Automation V1 alignment is through PR #112. PR #113 is source-of-truth finalization only and is not an activation PR.

Merged sequence truth:

- PR #109 Momo Live Pilot Readiness Gate is merged.
- PR #110 Post-PR109 Momo readiness alignment is merged.
- PR #111 Controlled Momo Pilot Activation Gate is merged.
- PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged.

PR #112 hardened current business-truth profile-field status interpretation for `please_review`, `pre_filled`, `confirmed`, `optional`, and `veroxa_review`, and removed stale PR #110 activation-gate wording. No next activation PR is approved by default. Momo owner walkthrough remains blocked. `AUTH_MODE` remains `placeholder`. `/api/pilot-access` remains active. Real auth remains off. No external integrations are connected. No credentials, auth users, owner/client invitations, Momo contact, external publishing, platform connections, payments, webhooks, cron jobs, background jobs, scheduled jobs, or fake readiness/data are approved or added. Future real-world activation, real-auth activation, external platform setup, or owner walkthrough requires separate explicit Faraz approval.
