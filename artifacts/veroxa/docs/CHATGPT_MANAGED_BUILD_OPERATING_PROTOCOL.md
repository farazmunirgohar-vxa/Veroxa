# ChatGPT-Managed Veroxa Build Operating Protocol

Status: active operating authority as of 2026-07-14.

## Purpose

Faraz uses ChatGPT as the primary Veroxa command center. Faraz and ChatGPT decide the next product outcome together, then ChatGPT invokes Codex and the connected engineering tools internally to complete the authorized work. Faraz does not need to open a separate Codex, GitHub, Sites, terminal, or IDE window or copy a prompt between them for routine Veroxa work.

The current milestone is to complete and prove the secure, persistent, human-controlled Momo operating loop and evidence-based onboarding gate. Momo's House San Antonio is the agreed free founding pilot and the only operational restaurant scope. Team Faraz is Momo-focused; the standalone Restaurant Audit Center is the only capability that may operate for non-client restaurants. An audited restaurant does not become an operational client unless Faraz separately and explicitly approves conversion. Runtime AI and external providers are later modular activations, not prerequisites for a truthful manual pilot. Read `VEROXA_CURRENT_MILESTONE.md` and `MOMO_FOUNDING_PILOT_COMMITMENT_AND_ONBOARDING_GATE.md` before planning or building.

PR #149 passed all four required workflows with zero unresolved review threads at reviewed head `0d2c6e47fbfe1c44a2f0ff19fbb158001ed9365a` and merged at `9749b68ce2cfc383deeae6aa63c413019ef61385`. Sites version 15 succeeded from checkout `e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0`; the verified 55-file source SHA-256 is `ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f`, and public/custom-domain checks passed. Supabase remains at 13 migrations with filename/content parity; PR #149 required no database apply. Machine state is `verified_reconciliation_cleanup_deployed`, and release state is `post_release_cleanup_deployed`. The evidence-only closeout PR changes no Sites source and therefore needs no Sites version 16. Runtime AI, credentials, Momo/client contact or provisioning, owner truth, media rights, providers, publishing, billing, activation, and new spend remain disabled. Branch deletion is unavailable, and the exact Vercel shutdown sentinel must remain until external Git disconnection is independently verified.

The platform responsibilities remain distinct:

- **Faraz** is the founder, product owner, source of business truth, and final authority for material business or real-world decisions.
- **ChatGPT** is the primary planning, orchestration, review, GitHub, and deployment interface for Faraz.
- **Codex** is the engineering capability ChatGPT uses for repository inspection, implementation, testing, hardening, and fixes.
- **GitHub `main`** is the canonical source of truth for product behavior, routes, code, operating memory, tests, and guardrails.
- **ChatGPT Sites** is Veroxa's primary application and deployment surface.
- **Vercel is retired.** Do not create, maintain, verify, or depend on a Vercel deployment or rollback path.

## Command contract

### `Build it`

This authorizes ChatGPT to complete the agreed scope end to end:

1. Refresh and inspect the current GitHub `main` state and active Veroxa memory.
2. Create or use a controlled task branch.
3. Invoke Codex to implement, review, harden, and test the work.
4. Create or update the GitHub pull request.
5. Run RR, repair reasonable in-scope defects, and fix CI failures.
6. Re-check the exact reviewed head commit, mergeability, required checks, review state, and safety boundaries.
7. Merge the exact reviewed commit into `main` only when the green gate passes.
8. Update Veroxa operating memory and build status when the change materially affects them.

`Build it` does not independently authorize a ChatGPT Sites production deployment or a real-world activation unless deployment or activation was explicitly included in the agreed scope.

### `Build it, but hold for review`

This authorizes the same branch, implementation, verification, RR, CI-repair, and pull-request work, but ChatGPT must stop at a verified green pull request. It must not merge or deploy until Faraz later authorizes that action.

### `Build and deploy it`

This authorizes the full `Build it` flow plus:

1. Confirm the approved pull request merged successfully into GitHub `main`.
2. Synchronize the exact merged GitHub source state to the ChatGPT Sites project.
3. Run the Sites build, route, lint, and artifact verification required for the changed scope.
4. Save and deploy a Sites checkpoint.
5. Verify the deployment, public access state, and `veroxasystems.com` custom-domain health.
6. Record the release result and any rollback note in the current build status.

GitHub merge and Sites deployment are separate actions. The current Sites setup does not automatically deploy every GitHub merge. Never leave a live-only Sites change as the product source of truth; deployed behavior must exist in GitHub first or be reconciled in the same controlled migration task.

### `RR`

`RR` means a deep review of GitHub code, docs, tests, CI, security boundaries, Veroxa product truth, Sites parity, deployment, access, and domain state. ChatGPT should fix reasonable in-scope defects during RR. `RR` by itself does not authorize merge, deployment, real-world activation, or a material scope expansion.

Before a new broad RR, read `RR_CHECKPOINT.md`, validate `RR_RELEASE_CHECKPOINT.json`, and compare the exact diff with its boundary fingerprints. Reuse unchanged evidence. A changed `full-on-change` boundary gets a focused boundary review plus direct consumers; a presentation-only change gets a delta review unless its exact diff crosses a full-review trigger. Do not reopen unchanged review domains merely because a new build occurred.

## Green merge gate

A pull request is green only when all applicable conditions are true:

- the implemented scope matches the outcome agreed with Faraz;
- relevant local type checks, tests, lint, production builds, route checks, and guardrails pass;
- when the Sites delivery layer changes, its isolated build, rendered-route tests, lint, and artifact validation pass;
- required GitHub checks are successful;
- the four required workflows—`CI`, `Sites`, `Supabase`, and `Veroxa Verify`—are successful for the exact candidate head;
- the deployment manifest and deterministic source/migration trees verify, and CI preserves an attestation bound to the exact `GITHUB_SHA`;
- the pull request is mergeable and its exact head commit has not changed since the final review;
- no unresolved actionable review thread or known critical/high-severity defect remains;
- RR finds no fixable merge blocker;
- source-of-truth, access, product-safety, business-truth, and no-fake-data guardrails remain intact.

If the branch head changes after the final review, ChatGPT must re-run the applicable checks and repeat the pre-merge review before merging.

## Mandatory post-build continuity update

After every build, including a build held at a draft or green pull request, ChatGPT must finish with a durable progress update. A build is not complete until ChatGPT has:

1. Updated `VEROXA_CURRENT_MILESTONE.md` with the actual completed state, blockers, and exact next build.
2. Updated `CURRENT_BUILD_STATUS.md` with the branch/PR, exact commit, applicable checks, merge state, deployment state, and runtime truth.
3. Updated `momo-readiness-tracker.json` for every affected Momo readiness dimension with evidence, blockers, and the next action.
4. Updated `VEROXA_LOCKED_OPERATING_MEMORY.md` when scope, product direction, authority, or another durable decision changed.
5. Updated `ACTIVE_DOCS_INDEX.md` when the governing source-of-truth set changed.
6. Recorded verified Sites, Supabase, integration, custom-domain, and rollback state when applicable.
7. Given Faraz a plain-language handoff stating what was built, what now works, what remains inactive, known blockers, and the recommended next step.
8. Refreshed `RR_RELEASE_CHECKPOINT.json` when reviewed source, boundary fingerprints, merge state, or production verification changed.

For held work, the record must say that the change is not merged or deployed. For merged work, it must identify the exact merged state. For an authorized deployment, it must record the verified production result and rollback state. Do not describe planned or fixture behavior as completed runtime functionality.

## Autonomous scope and pause boundaries

Within an agreed build, ChatGPT should perform safe, reversible, normal engineering steps without asking Faraz to operate another platform. This includes repo inspection, planning, code and documentation edits, tests, branch and PR management, CI repair, RR fixes, an authorized green merge, and an explicitly authorized Sites deployment.

ChatGPT must pause and obtain specific direction when the work materially expands into:

- production authentication, credential creation, secret handling, or access-model changes;
- real customer/client data, privacy-sensitive data, or a security-boundary change;
- destructive data work or a production database/schema migration;
- billing, payments, subscriptions, purchases, or financial commitments;
- new external integrations, external account connections, or platform write access;
- public publishing, outbound owner/client contact, or customer-visible automated execution;
- unconfirmed business truth, sensitive claims, pricing changes, or new public promises;
- DNS/domain-record changes, ownership actions, or account-holder-only steps;
- Momo owner walkthrough, pilot activation, or broader client exposure;
- a material product or business-direction change outside the agreed scope.

A command applies only to the agreed task. It is not blanket authority to merge unrelated existing pull requests or to broaden real-world authority silently.

## Current hosted-state truth

As last verified on 2026-07-14:

- PR #149 reviewed head `0d2c6e47fbfe1c44a2f0ff19fbb158001ed9365a` passed all four required workflows with zero unresolved review threads and merged to canonical GitHub `main` at `9749b68ce2cfc383deeae6aa63c413019ef61385`;
- Sites version 15 succeeded from checkout `e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0`, with 55-file source SHA-256 `ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f`;
- Supabase remains at 13 applied migrations with exact filename/content parity, and PR #149 required no database apply;
- machine/release state is `verified_reconciliation_cleanup_deployed` / `post_release_cleanup_deployed`;
- the Veroxa Sites project is active and publicly accessible;
- `veroxasystems.com` and `www.veroxasystems.com` were verified with the Sites v15 release;
- future verified Sites deployments use the existing domains and do not require routine Namecheap edits;
- the evidence-only closeout PR changes no Sites source and requires no Sites version 16;
- Vercel is retired; Sites checkpoints and GitHub source provide the deployment and recovery path;
- branch deletion remains unavailable, and the Vercel shutdown sentinel remains because external Git disconnection is not verified;
- Faraz's approved Gmail Team identity, Team/Momo access, protected-route Safari smoke, and approved-user password sign-in are verified; hosted reauthentication and old-session revocation remain unverified;
- Momo client identity, owner-confirmed data, external publishing, payments, live platform integrations, runtime AI, and new spend remain blocked.

Public marketing and audit intake remain anonymous. Protected portal data must continue to require signed sessions, active profile/membership authorization, server guards, and RLS; no real Momo client data may be entered until an approved client identity and owner-confirmed records exist.
