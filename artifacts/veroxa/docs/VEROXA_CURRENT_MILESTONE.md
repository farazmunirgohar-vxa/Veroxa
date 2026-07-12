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

- GitHub `main` currently ends at merged PR #133.
- Draft PR #134 contains the initial GitHub-synchronized ChatGPT Sites delivery layer and ChatGPT-managed build protocol.
- Commit `ac6d7321eb3037b3a8b3b8551bb8167abec78aae` on draft PR #134 records this Momo-only milestone, the fully functional non-client Audit Center exception, and the mandatory post-build continuity contract. It is not merged or deployed.
- ChatGPT Sites is public at `veroxasystems.com`; Client and Team routes remain non-sensitive pre-live shells.
- Production auth, durable persistence, real uploads, runtime AI, external platform connections, and publishing are not active.
- The connected Supabase project is Veroxa Dev and was inactive when last inspected on 2026-07-12.
- Momo owner walkthrough and real-world activation remain blocked until the milestone readiness gates are built, verified, and separately approved.
- The current critical readiness blockers are forgeable placeholder browser sessions, production-unsafe broad development RLS policies in the canonical migration chain, and a public audit flow that does not yet persist a durable Team-visible audit record.

## Latest completed build and exact next build

The latest completed documentation build is commit `ac6d7321eb3037b3a8b3b8551bb8167abec78aae` in draft PR #134. It adds the current milestone record and automated drift checks. Relevant strategy guardrails, direct TypeScript checks, Sites build/render tests, Sites lint, and whitespace checks pass. GitHub checks must be re-verified on the final branch head before any merge decision.

The exact next product build, after PR #134 is approved and merged, is **Momo Production Foundation V1**:

- replace the broad development RLS policies with production-safe Team and Momo authorization boundaries;
- implement Supabase Auth with server-verified sessions and explicit Team/Momo membership resolution;
- establish Momo-scoped database and storage ownership without introducing another operational client;
- add clean-migration and authorization tests for anonymous, Team, Momo, and denied cross-tenant access;
- keep real Momo data, production credentials, owner-controlled connections, external publishing, and runtime AI inactive until their separate gates pass.

The build immediately after that foundation is the fully functional Restaurant Audit Center V1 for non-client restaurants: durable audit intake, Team queue, saved evidence/findings, re-runs and comparisons, reviewed reports, abuse controls, and no automatic operational-client conversion.

## Current build sequence

1. Reconcile GitHub, Sites, current milestone memory, and truthful Momo states.
2. Establish the secure Supabase foundation for Team Faraz and Momo only.
3. Make the Team Restaurant Audit Center effective for non-client restaurants without creating operational workspaces.
4. Build the persistent Momo Restaurant Intelligence Profile and onboarding flow.
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
