## 2026-07-12 — ChatGPT Sites application migration

Faraz's newest explicit build direction:

- Build the real Veroxa application through ChatGPT Sites.
- Use the existing GitHub/Codex Veroxa system as the core skeleton and canonical product truth.
- Preserve the approved Sites visual direction as the presentation layer.
- Do not create or promote another demo.
- GitHub `main` remains canonical; Sites is the new deployment/application surface being integrated.
- Vercel remains temporarily available as a compatibility and rollback surface until verified cutover.
- Do not move `veroxasystems.com` until the migration gate in `CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md` passes.
- RR must review both GitHub health and the Sites migration/deployment/domain/access state.
- The migration does not authorize real auth, credentials, external integrations, database/storage activation, AI provider calls, publishing, Momo contact, owner walkthrough, or client exposure.

Current migration priority:

1. Real public Home -> Audit -> Login route skeleton.
2. Real Client and Team portal separation.
3. Momo grouped workspace parity.
4. Shared route/capability contract and guardrail.
5. GitHub-synced Sites source and verified build/mobile behavior.
6. Separate approved identity/persistence architecture.
7. Explicit public-access and domain cutover approval.

## 2026-06-21 — Post-PR120 locked operating memory

Automation-first direction remains locked. The current operating baseline is post-PR120: merged PR #120 — Momo Internal Dry Run + Go/No-Go Gate.

- PR #118 Controlled AI Draft Generation Foundation is merged/completed.
- PR #119 AI Draft Approval Queue is merged/completed.
- PR #120 Momo Internal Dry Run + Go/No-Go Gate is merged/completed.
- PR #121 was closed unmerged and is not active source-of-truth.
- PR #122 was closed/not used and is not active source-of-truth.
- PR #120 dry-run/go-no-go gate is internal-only and not an owner walkthrough approval.
- Momo owner walkthrough remains blocked.
- Any future owner walkthrough must come only after separate explicit Faraz approval.
- Any future activation must come only after separate explicit Faraz approval.
- No public/customer-visible use of business truth, media, AI drafts, reports, or approvals is allowed without Team/Faraz review and required owner confirmation.
- AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. No next activation PR is approved by default.

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
14. PR #112 — Post-PR111 Activation Gate Alignment + Business Truth Status Hardening.
15. PR #113 — Post-PR112 Source-of-Truth Finalization.

Do not skip to real-auth activation, external integrations, publishing, payments, or Momo owner walkthrough from PR #111, PR #112, or PR #113. Future real-world activation steps require separate explicit Faraz approval after the internal gates and source-of-truth finalization.

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
- Controlled Momo Pilot Activation Gate is merged as GitHub PR #111.
- Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged as GitHub PR #112.
- Post-PR112 Source-of-Truth Finalization is merged as GitHub PR #113.
- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains active.
- Momo owner walkthrough remains blocked until Faraz explicitly approves activation/walkthrough after reviewing the gate and current blockers.
- No next activation PR is approved by default.

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

## PR #114 — Momo Internal Pilot Prep Pack

- GitHub PR #114 adds Momo Internal Pilot Prep Pack only.
- PR #109 Momo Live Pilot Readiness Gate is merged.
- PR #110 Post-PR109 Momo readiness alignment is merged.
- PR #111 Controlled Momo Pilot Activation Gate is merged.
- PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged.
- PR #113 Post-PR112 Source-of-Truth Finalization is merged.
- PR #114 is internal preparation only.
- PR #114 does not activate the pilot.
- PR #114 does not activate real auth.
- PR #114 does not create credentials.
- PR #114 does not contact Momo’s House.
- PR #114 does not publish externally.
- PR #114 does not connect external platforms.
- PR #114 does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.
- AUTH_MODE remains placeholder.
- /api/pilot-access remains active.
- Roles remain client/team only.
- Momo owner walkthrough remains blocked.
- No next activation PR is approved by default.
- Future real-world activation requires separate explicit Faraz approval.
- Team route added for inventory/surface map: `/team/momo-pilot-prep` is guarded by InternalDemoGuard role="team" and RealPortalDataBoundary portal="team".

## PR #115 — Momo Business Truth Review Pack

GitHub PR #115 adds Momo Business Truth Review Pack only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged or immediately prior. PR #115 is internal business-truth review only. PR #115 does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not publish externally, does not connect external platforms, and does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners. AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed.

## 2026-06-19 — PR #116 Momo Media + Content Inventory Pack

GitHub PR #116 adds Momo Media + Content Inventory Pack only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 is internal media/content inventory only. PR #116 does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not upload, create, seed, generate, or fake media, does not publish externally, does not connect external platforms, and does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners. AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI may use only confirmed business truth and permissioned media in later internal drafts.

## PR #117 — Momo Brand Voice + AI Prompt Rules Pack

GitHub PR #117 adds Momo Brand Voice + AI Prompt Rules Pack only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged.

PR #117 is internal brand voice and AI prompt-rule preparation only. PR #117 does not generate AI output. PR #117 does not call any AI provider. PR #117 does not activate the pilot. PR #117 does not activate real auth. PR #117 does not create credentials. PR #117 does not contact Momo’s House. PR #117 does not upload, create, seed, generate, or fake media. PR #117 does not publish externally. PR #117 does not connect external platforms. PR #117 does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.

AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI may use only confirmed business truth and permissioned media in later internal drafts. All future AI output requires Team/Faraz review before customer-visible use.

## GitHub PR #118 — Controlled AI Draft Generation Foundation

GitHub PR #118 adds Controlled AI Draft Generation Foundation only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged. PR #117 Momo Brand Voice + AI Prompt Rules Pack is merged.

PR #118 is controlled AI draft generation foundation only. AI generation is disabled by default. PR #118 does not generate customer-visible AI output. PR #118 does not auto-approve AI output. PR #118 does not publish AI output. PR #118 does not activate the pilot. PR #118 does not activate real auth. PR #118 does not create credentials. PR #118 does not contact Momo’s House. PR #118 does not upload, create, seed, generate, or fake media. PR #118 does not publish externally. PR #118 does not connect external platforms. PR #118 does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.

AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval.

Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI may use only confirmed business truth and permissioned media in later internal drafts. All future AI output requires Team/Faraz review before customer-visible use.
## GitHub PR #119 — AI Draft Approval Queue

GitHub PR #119 adds AI Draft Approval Queue only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged. PR #117 Momo Brand Voice + AI Prompt Rules Pack is merged. PR #118 Controlled AI Draft Generation Foundation is merged or immediately prior.

PR #119 is internal AI draft approval queue only. PR #119 does not generate AI output. PR #119 does not call any AI provider. PR #119 does not auto-approve AI output. PR #119 does not publish AI output. PR #119 does not expose AI output to the client. PR #119 does not activate the pilot. PR #119 does not activate real auth. PR #119 does not create credentials. PR #119 does not contact Momo’s House. PR #119 does not upload, create, seed, generate, or fake media. PR #119 does not publish externally. PR #119 does not connect external platforms. PR #119 does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.

AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI drafts may move forward only after Team/Faraz review. No AI output becomes customer-visible from this PR.

## PR #120 — Momo Internal Dry Run + Go/No-Go Gate

GitHub PR #120 adds Momo Internal Dry Run + Go/No-Go Gate only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged. PR #117 Momo Brand Voice + AI Prompt Rules Pack is merged. PR #118 Controlled AI Draft Generation Foundation is merged. PR #119 AI Draft Approval Queue is merged or immediately prior. PR #120 is internal dry-run/go-no-go review only. PR #120 does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not expose anything to the client, does not generate AI output, does not create fake AI drafts, does not create fake approvals, does not create fake reports, does not upload/create/seed/generate/fake media, does not publish externally, does not connect external platforms, and does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners. AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. Any future go-live, real-auth cutover, owner walkthrough, external platform setup, or client exposure requires a separate explicit Faraz approval.
