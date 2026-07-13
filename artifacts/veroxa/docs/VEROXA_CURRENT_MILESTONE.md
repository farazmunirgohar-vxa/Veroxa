# Veroxa Current Milestone

Status: highest-priority current milestone as of 2026-07-13.

Current build: the seven-system Momo operating foundation is merged in PR #138 at `48630c62b9429238ab39b5b919d7689d189352f8`, applied through eight production migrations, and deployed as verified Sites version 5. Its source contract is `MOMO_100_READINESS_SEVEN_SYSTEM_CONTRACT.md`. Momo remains operationally blocked until real identities, owner-confirmed truth, permissioned media, provider access, and authenticated evidence are complete.

Read this file before planning, building, reviewing, merging, or deploying Veroxa. If an older roadmap, status note, or historical plan conflicts with this file, follow this file and Faraz's newest explicit instruction.

## Milestone

The next milestone is **Momo's House San Antonio 100% readiness**.

Momo's House San Antonio is Veroxa's only operational client and restaurant workspace for the remainder of this milestone. Team Faraz is being built to operate Momo end to end with the maximum safe level of AI assistance and automation.

The only capability that may operate across other restaurants during this milestone is the standalone, fully functional **Restaurant Audit Center** for non-client restaurants inside the Team Portal.

## Locked operating scope

### Momo's House San Antonio

All restaurant operations are Momo-specific:

- production identity, authorization, restaurant-scoped data, and storage;
- restaurant intelligence and owner-confirmed business truth;
- the locked restaurant growth infrastructure onboarding flow;
- media intake, rights, AI classification, quality review, tagging, and reuse;
- AI-assisted strategy, concepts, captions, platform variants, and approvals;
- content planning, scheduling, approved publishing, retries, and activity history;
- Facebook and Instagram handling through approved Meta Business access;
- Google Business Profile, local SEO, reviews, and visibility work;
- website and menu/contact-path SEO checks and prepared actions;
- delivery-platform presence monitoring where access and platform capabilities allow;
- client messages, requests, Team work, blockers, approvals, and notifications;
- verified weekly updates, monthly reports, and operating intelligence;
- monitoring, security, recovery, and readiness verification.

Do not build generic multi-client operating dashboards, client lists, onboarding queues, media queues, content operations, publishing, or reporting for other restaurants during this milestone.

### Other restaurants

Other restaurants may exist only as Team-owned audit records or prospects in the Restaurant Audit Center. An audited restaurant does not become an operational client unless Faraz separately and explicitly approves conversion.

The Audit Center must be able to:

- find or manually enter a restaurant;
- run and save an online-presence audit;
- review Google, website, social, menu/order paths, reviews, content, and local SEO;
- store Team notes, findings, evidence, and recommended actions;
- re-run an audit and compare changes over time;
- prepare a reviewed, honest audit report.

Auditing another restaurant must not automatically create:

- a client account;
- a restaurant operations workspace;
- onboarding;
- media or content workflows;
- operational Team work items;
- reporting or publishing access;
- a conversion into an active client.

Any future conversion from audit prospect to operational client requires Faraz's separate explicit approval.

## Automation target

Build Veroxa to automate as much internal preparation and safe execution as platform capabilities allow. Automation should analyze, classify, draft, recommend, organize, route, schedule, monitor, and report so Faraz primarily reviews exceptions, approvals, and material decisions.

Automation remains controlled:

- owner confirmation is required for hours, menu, prices, offers, access, services, dietary claims, and other business truth;
- AI output must pass the configured Veroxa approval gate before customer-visible use during the pilot;
- negative-review responses and reputation-sensitive language require human review;
- only approved work may publish automatically;
- external platform permissions and API capabilities must be verified rather than assumed;
- no invented metrics, activity, integrations, readiness, results, or restaurant facts.

This milestone authorizes the product direction toward production AI, automation, social handling, and SEO integration. It does not mean those systems are already active, and it does not independently authorize contacting Momo, creating external credentials, connecting owner-controlled accounts, or publishing before the required build and activation gates are satisfied.

For this milestone, **100% readiness** means the scoped Momo capabilities are persistent, truthful, tested end to end, monitored, recoverable, and able to pass their documented activation gates. It is not a claim that credentials, owner access, external connections, or publishing are already active. Separate approval remains required for Momo contact, owner-controlled accounts or credentials, owner-confirmed business truth, media rights, reputation-sensitive actions, and external publishing.

## Current verified technical state

- GitHub `main` includes merged PR #134 (`bb7ea6add62a0e7c337c23d9d48880a9d034c0d3`), which established the synchronized Sites delivery layer, current milestone, and ChatGPT-managed build protocol.
- GitHub PR #135 is merged to `main` at `184821f1b94d3801d23742c5bb7d9571e9be27e6`. Its SHA-locked reviewed head passed CI, Sites Verify, Supabase Verify, Veroxa Verify, and focused final delta RR covering latest-run review, audit identity/event integrity, Sites intake reliability, UI draft/navigation/accessibility, and repeat-review checkpoints. Vercel is retired.
- The connected Supabase project is healthy. All eight production migrations are applied; the Momo operating migration and advisor hardening passed clean-reset CI, pgTAP, database lint, production application, and post-apply verification. All 32 operating tables force RLS.
- Momo's House San Antonio is the only enabled operational restaurant scope. Legacy demo rows are preserved, and the ten broad M024 development policies are removed from the production migration chain.
- The Sites release source implements signed Supabase sessions, server route guards, active profile plus active Momo membership checks, RLS, private restaurant storage, magic-link-only sign-in, callback safety, and session refresh. Password sign-in/recovery remains disabled while compromised-password protection is off.
- Public Auth user creation is disabled. The approved Team identity is allowlisted but still requires supported Supabase Admin pre-provisioning before Faraz can sign in; no Momo client identity is provisioned.
- The Restaurant Audit Center is durable and separate from operational clients: signed public intake, consent, idempotency, rate limits, Team queue/manual entry, notes, evidence-backed findings, run history/comparison, reviewed-report gates, and immutable reviewed records are implemented.
- Final release hardening requires the latest reviewed run/report to close a request, separates same-name audit locations instead of auto-merging them, records append-only lifecycle events, validates failed-run reasons/timestamps/source snapshots, proves affected browser mutations, and labels the 100-row queue view truthfully.
- Remote catalog, RLS/role, public-intake isolation, and transactional Team workflow tests pass. The active migration chain matches all eight remote-applied versions; eight never-applied prototype migrations are archived outside the active directory. Advisor review records no error-level issue; the duplicate uploader index is removed. Intentional scoped security-definer helpers, fresh unused-index notices, legacy warnings, and disabled leaked-password protection remain documented; password login is therefore gated off.
- Exact merged runtime source is deployed as Sites version 5. The checkpoint and both custom domains are verified active with active SSL and no reported domain error.
- `RR_CHECKPOINT.md` and its machine-readable fingerprint record now route future work to delta or changed-boundary review, preventing unchanged evidence from being repeated.
- Owner-confirmed Momo business data, live onboarding, uploads, runtime AI, Meta/Google connections, social handling, SEO execution, publishing, outbound contact, and outcome metrics remain inactive.
- The deployed seven-system foundation provides fail-closed contracts and persistence for Restaurant Intelligence/onboarding, media intelligence, content/approvals/calendar, Meta, Google/local visibility, work/reports/recovery, and the final gate. It does not convert prepared adapters into live integrations.
- Real Team Auth provisioning is **blocked external authority**: the database allowlist exists, but the connector has no Auth Admin create-user method and this workflow has no privileged server key. The server-only idempotent provisioning and Auth/RLS smoke commands are prepared but have not been run.
- Runtime AI, Meta, Google writes, publishing, and visibility monitoring are **inactive pending authorized access**. No Momo owner truth or media rights are invented to make a readiness score pass.

## Mandatory two-lane tracking

Veroxa progress must track both the platform build and Momo's House operational readiness after every build. A green Veroxa build or deployment does not by itself mean Momo is ready.

- **Veroxa delivery state:** source, PR, checks, migrations, deployment, domain, security, and RR evidence.
- **Momo readiness state:** identity/access, business truth/onboarding, media/rights, AI/automation, Meta/social, Google/SEO/reviews, website/menu/ordering, operations/reporting/monitoring, and activation/recovery.
- `momo-readiness-tracker.json` is the machine-readable Momo readiness record. Every dimension requires evidence, blockers, and a next action.
- Do not calculate or publish a readiness percentage. Overall Momo readiness becomes verified only when every required dimension is verified and no blocker remains.
- This readiness tracker applies only to Momo's House San Antonio. Other restaurants remain Audit Center records only.

## Latest completed build and exact next build

The deployed release completed steps 1–9 below across source, data, GitHub, Supabase, and Sites. Step 10 remains blocked by real-world evidence and external authority.

The current deployed foundation is **Momo 100% Readiness Seven-System V1**:

- persist owner-confirmed restaurant identity, hours, address, phone, menu, services, dietary/halal claims, contacts, brand voice, goals, and required presence-stack state;
- provide Team review and Momo safe-empty/client-confirmation views backed only by verified records;
- make onboarding readiness measurable without contacting Momo, inventing facts, or connecting owner-controlled platforms;
- prepare modular adapters for later media, AI, Meta, Google, SEO, ordering, and publishing connections without adding new spend.

The deployed foundation also provides media rights/reuse, AI/content approvals/calendar, provider-neutral Meta/Google operations, work/retry/recovery/reporting, and the fail-closed final readiness gate. The runtime truth and evidence requirements are locked in `MOMO_100_READINESS_SEVEN_SYSTEM_CONTRACT.md`.

## Current build sequence

1. **Complete and deployed:** reconcile GitHub, Sites, current milestone memory, and truthful Momo states.
2. **Complete and deployed:** establish the secure Supabase foundation for Team Faraz and Momo only.
3. **Complete and deployed:** make the Team Restaurant Audit Center effective for non-client restaurants without creating operational workspaces.
4. **Complete and deployed foundation:** persistent Momo Restaurant Intelligence Profile and onboarding flow.
5. **Complete and deployed foundation:** Momo media intake, rights, Team review, reuse, and provider-neutral AI media intelligence.
6. **Complete and deployed foundation:** Momo content strategy, captions, platform variants, approvals, calendar, and provider-neutral publishing jobs.
7. **Complete and deployed foundation:** Meta and Google Business Profile connection/readiness contracts, local SEO, reviews, website checks, and visibility actions; live providers remain inactive.
8. **Complete and deployed foundation:** work orchestration, activity/evidence, retries, recovery, monitoring, and reporting.
9. **Complete and deployed foundation:** deterministic source/database/guardrail tests plus controlled external identity/Auth smoke commands that are not run by CI.
10. **Blocked until evidence is complete:** Momo 100%-readiness gate, owner walkthrough, and activation decision.

## Mandatory post-build continuity update

After every build, ChatGPT must update the durable record and Faraz's handoff. A build is not complete until the applicable items below are current:

1. Update this file with the completed work, actual current state, blockers, and exact next build.
2. Update `CURRENT_BUILD_STATUS.md` with the PR, commit, checks, merge state, deployment state, and runtime truth.
3. Update `momo-readiness-tracker.json` with evidence-backed Momo readiness status, blockers, and next actions for every affected dimension.
4. Update `VEROXA_LOCKED_OPERATING_MEMORY.md` when product direction, authority, scope, or a durable decision changes.
5. Update `ACTIVE_DOCS_INDEX.md` when the governing document set changes.
5. Record Sites, Supabase, integration, or custom-domain state when the build changes or verifies it.
6. Give Faraz a plain-language handoff covering what was built, what now works, what remains inactive, blockers, and the recommended next step.

For a held PR, record that the work is built but not merged or deployed. For a merged build, record the exact merged state. For an authorized deployment, record the verified production result and rollback status.
