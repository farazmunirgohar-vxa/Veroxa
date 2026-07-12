# Veroxa Current Milestone

Status: highest-priority current milestone as of 2026-07-12.

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
- GitHub PR #135 implements Momo Production Foundation V1 and Restaurant Audit Center V1. Source RR and all GitHub Actions checks, including the clean Supabase reset/pgTAP/lint workflow, pass; the PR remains unmerged and Sites remains undeployed while the external Vercel rollback status is rechecked.
- The connected Supabase project is healthy. Five production-foundation migrations are applied: versioned Team/Momo tenancy, Audit Center, advisor hardening, release-blocker hardening, and trigger type safety.
- Momo's House San Antonio is the only enabled operational restaurant scope. Legacy demo rows are preserved, and the ten broad M024 development policies are removed from the production migration chain.
- The Sites release source implements signed Supabase sessions, server route guards, active profile plus active Momo membership checks, RLS, private restaurant storage, magic-link-only sign-in, callback safety, and session refresh. Password sign-in/recovery remains disabled while compromised-password protection is off.
- Public Auth user creation is disabled. The approved Team identity is allowlisted but still requires supported Supabase Admin pre-provisioning before Faraz can sign in; no Momo client identity is provisioned.
- The Restaurant Audit Center is durable and separate from operational clients: signed public intake, consent, idempotency, rate limits, Team queue/manual entry, notes, evidence-backed findings, run history/comparison, reviewed-report gates, and immutable reviewed records are implemented.
- Remote catalog, RLS/role, public-intake isolation, and transactional Team workflow tests pass. The active migration chain now matches the five remote-applied versions; eight never-applied prototype migrations are archived outside the active directory. Advisor review also records six legacy mutable-search-path warnings, legacy-table performance notices, intentional scoped security-definer functions, and disabled leaked-password protection; password login is therefore gated off.
- The currently live Sites deployment is still the prior version until the exact green GitHub release is merged and checkpointed.
- Real Momo business data, onboarding, uploads, runtime AI, Meta/Google connections, social handling, SEO execution, publishing, outbound contact, and outcome metrics remain inactive.

## Latest completed build and exact next build

The current release build completes steps 1–3 below at the source/data layer. Final completion still requires green GitHub checks, exact merge, exact-source Sites checkpoint, and live verification. Final PR/checkpoint identifiers belong in `CURRENT_BUILD_STATUS.md` and the post-deployment handoff.

The exact next product build after this release is **Momo Restaurant Intelligence + Onboarding V1**:

- persist owner-confirmed restaurant identity, hours, address, phone, menu, services, dietary/halal claims, contacts, brand voice, goals, and required presence-stack state;
- provide Team review and Momo safe-empty/client-confirmation views backed only by verified records;
- make onboarding readiness measurable without contacting Momo, inventing facts, or connecting owner-controlled platforms;
- prepare modular adapters for later media, AI, Meta, Google, SEO, ordering, and publishing connections without adding new spend.

## Current build sequence

1. **Implemented at source/data layer; pending green merge and Sites checkpoint:** reconcile GitHub, Sites, current milestone memory, and truthful Momo states.
2. **Implemented at source/data layer; pending green merge and Sites checkpoint:** establish the secure Supabase foundation for Team Faraz and Momo only.
3. **Implemented at source/data layer; pending green merge and Sites checkpoint:** make the Team Restaurant Audit Center effective for non-client restaurants without creating operational workspaces.
4. **Next:** build the persistent Momo Restaurant Intelligence Profile and onboarding flow.
5. Connect Momo media intake, Team review, and AI media intelligence.
6. Connect Momo AI content preparation, approvals, calendar, social handling, and approved publishing.
7. Connect Google Business Profile, local SEO, reviews, website checks, and visibility actions.
8. Connect Momo messages, requests, work orchestration, activity logging, and reporting.
9. Add monitoring, recovery, security, browser, authorization, and integration tests.
10. Run the Momo 100%-readiness gate before any owner walkthrough or activation decision.

## Mandatory post-build continuity update

After every build, ChatGPT must update the durable record and Faraz's handoff. A build is not complete until the applicable items below are current:

1. Update this file with the completed work, actual current state, blockers, and exact next build.
2. Update `CURRENT_BUILD_STATUS.md` with the PR, commit, checks, merge state, deployment state, and runtime truth.
3. Update `VEROXA_LOCKED_OPERATING_MEMORY.md` when product direction, authority, scope, or a durable decision changes.
4. Update `ACTIVE_DOCS_INDEX.md` when the governing document set changes.
5. Record Sites, Supabase, integration, or custom-domain state when the build changes or verifies it.
6. Give Faraz a plain-language handoff covering what was built, what now works, what remains inactive, blockers, and the recommended next step.

For a held PR, record that the work is built but not merged or deployed. For a merged build, record the exact merged state. For an authorized deployment, record the verified production result and rollback status.
