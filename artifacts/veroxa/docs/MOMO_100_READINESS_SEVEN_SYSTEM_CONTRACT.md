# Momo 100% Readiness — Seven-System Contract

Status: full-automation contract and historical foundation record, reviewed 2026-07-14. This document separates source readiness, deployment, runtime connection, and activation so a prepared adapter or screen is never reported as a live provider connection.

This contract does not replace the narrower founding-pilot onboarding authority in `MOMO_FOUNDING_PILOT_COMMITMENT_AND_ONBOARDING_GATE.md`. Momo may begin the already-agreed free pilot after the secure, persistent, human-controlled manual operating loop and exact evidence gate pass; runtime AI, Meta, Google, and automated publishing remain later modular activations. The 100% seven-system gate still governs any claim of full automation readiness.

Current delivery state: PR #148 is the verified deployed application release at `165ff82ab46b0a0985605ffcfb6efa687982eca5`; Sites version 14 is live from Sites source commit `57ccb8d1cce596baf782b03525c80161c11af8f3`; production Supabase has 13 applied migrations. A post-release cleanup candidate is reconciling migration 12/13 filenames to the applied ledger without SQL-byte changes and archiving legacy Vite from active development paths. Exact filename-ledger parity remains pending until that cleanup merges. This release does not enable runtime AI, contact Momo, provision a Client, connect a provider, publish, bill, activate, or approve new spend; the Momo readiness decision remains No-Go. The Vercel shutdown sentinel remains until external Git disconnection is independently verified.

## Status vocabulary

- **Release candidate** — the provider-neutral contract, persistence, permissions, UI state, and deterministic tests are present on the current branch; this does not mean merged or deployed.
- **Deployed foundation** — the exact source and database migration are verified in production; this does not mean credentials, owner data, or a provider connection exist.
- **Continuity target** — committed evidence names the required post-merge deployment version but does not predict its own merge SHA or claim that deployment is already complete; external GitHub and Sites metadata provide the final identity.
- **Inactive pending authorized access** — the surrounding Veroxa system is prepared, but no provider call, write, publishing action, or monitoring claim is allowed.
- **Blocked external authority** — completion requires a credential, owner-controlled access, real identity, client confirmation, or specific external action that is not available to the current workflow.
- **Ready** — every required check has evidence and the fail-closed readiness result is exactly 100%. No partial score, adapter, fixture, or empty record may satisfy this state.

## Current release truth before PR #148 (historical)

- PR #143 reviewed head `009276dbbf2639dc1eb5296bf62906f9f8ac45f1` merged at operational commit `49a5250d6ce7bd8d78f19e415641563e2260ace8`. Sites version 9 deployed successfully from checkout source `69871c51f8e80d1802539a6bca52e3ce5b4ff71c`, and both custom domains are active with healthy SSL.
- The connected Supabase project is healthy and has all nine production migrations applied and verified, including `momo_full_operating_system_v1`, its advisor hardening, and the zero-cost operating rehearsal. All scoped operating tables force RLS; clean reset, pgTAP, error-level database lint, migration application, and post-apply verification passed.
- The ninth migration filename is reconciled to remote version `20260713191147_momo_zero_cost_operating_rehearsal_v1.sql`; its SQL, schema, content, and migration count are unchanged at SHA-256 `07cdb0a41b3d81e23e2c9432b139ae219c2b4671fed7cd18f761d4c4d6a79f2a`.
- PR #144 is the behavior-neutral repository-and-Sites-evidence continuity release. Its database-source delta is limited to that filename/ledger reconciliation; database schema, migration content, and migration count do not change. Because PR #144 changes Sites-bundled readiness evidence, verified Sites version 10 is required after merge and is not already deployed. Never embed or predict PR #144's merge SHA; external GitHub PR metadata and Sites checkpoint metadata are the future authorities.
- The protected allowlist is aligned to Faraz's approved Gmail Team identity. Its Auth email is confirmed, a real email-link sign-in occurred, the protected trigger created an active Team profile plus active Momo membership, and the authenticated Team/Momo route was verified in Safari. The mistaken secondary identity has disabled profile/membership access.
- `scripts/src/provision-approved-team-identity.ts` remains the preferred server-only, explicit-ack, idempotent Admin path for future identities. It takes approved values only from environment, relies on the protected database allowlist trigger as authority, verifies active access, and rolls back an unaccepted new user. It must not run from CI or browser code.
- Sites version 9 passes only a validated Supabase project URL and publishable key from the existing dynamic login/protected routes; all privileged keys remain server-only, the marketing root remains cacheable, secure email-link recovery is verified, and Faraz confirmed approved-user password sign-in works. Hosted reauthentication and rejection of an old session after password replacement remain unverified and must not be claimed complete.
- No real Momo owner-confirmed address, phone, hours, menu, services, dietary/halal claim, contacts, brand voice, goals, media rights, platform access, or performance data has been entered. Safe-empty and pending-owner states are correct; fixtures and inferred public facts are not owner confirmation.
- Runtime AI, Meta, Google Business Profile, social publishing, Google writes, visibility monitoring, and external retries remain **inactive pending authorized access**. Provider-neutral contracts return blocked states and must not simulate success.
- No new spend is approved. The deployed foundation provides interfaces, queues, evidence, approval gates, deterministic checks, and recovery behavior without activating a chargeable provider.

## Seven systems

### 1. Restaurant Intelligence + Onboarding V1

- Source target: persistent restaurant truth with explicit confirmation states for identity, location/address, phone, hours, menu, services, dietary/halal claims, contacts, brand voice, goals, presence, readiness, and Team/client confirmation views.
- Current state: **deployed foundation / safe-empty runtime**. The production Team/client operating path covers all 18 locked truth fields, append-only owner decisions, evidence-backed onboarding updates, presence review, and an explicit client-identity handoff; the provisioning helper remains unexecuted and no owner identity or fact is present.
- Required gate: owner-confirmed truth and Team verification must be represented separately; neither inferred evidence nor a Team draft may count as owner confirmation.
- Client read boundary: operational base tables remain Team-only. Client confirmation/readiness data must come through the role-sanitized `veroxa_momo_client_snapshot_v1` RPC, which checks active Momo client membership, returns only approved client-safe columns, and cannot be called by anonymous users.

### 2. Team identity + authenticated Team/Momo access

- Source target: database allowlist, Auth Admin provisioning, active `team` profile, active Momo membership, approved-user password or secure-email-link session, RLS, and authenticated Team/Momo smoke evidence.
- Current state: deployed Auth/RLS foundation plus a confirmed, signed-in, active Team/Momo identity, verified Safari protected-route smoke, secure-email-link recovery, and user-confirmed approved-user password sign-in on Sites version 9. A separate explicit-ack Momo client provisioning command and mock fixture are production-available but have not been run. No Momo client identity is approved or provisioned.
- Required gate: preserve the supported Admin path, approved email, redirect allowlist, active profile/membership checks, API/RLS boundary, and browser route smoke. Public signup and service-role exposure remain forbidden. Hosted reauthentication and old-session rejection still require a separate authenticated verification before those controls can be claimed complete.

### 3. Media intake + intelligence

- Source target: private intake, rights history, quality review, AI classification state, tags, reuse eligibility, use history, and Team/client-safe views.
- Current state: **deployed foundation / no real media or rights record**. The production foundation locks the exact `momo-media-rights-v1` owner attestation, Team quality review, human tagging, and an auditable manual classification fallback. AI classification remains inactive pending an authorized provider and incremental-spend approval if applicable.
- Required gate: permissioned media, verified rights, private object access, review evidence, and a non-simulated provider or explicitly manual classification path.

### 4. AI content strategy + calendar

- Source target: confirmed-truth inputs, permissioned-media inputs, strategy, concepts, captions, platform variants, approval queues, calendar, immutable approval evidence, and failure states.
- Current state: **deployed foundation / runtime AI inactive**. The deterministic six-pillar manual content cycle, transactional validation of owner-confirmed truth and permissioned media, immutable input fingerprints, approval controls, and database-timezone scheduling are production-available without calling an AI provider. Missing real inputs keep execution blocked.
- Required gate: authorized provider configuration, no unconfirmed business truth, Team/Faraz review, owner review where required, and no customer-visible or scheduled output without recorded approval.

### 5. Meta social handling

- Source target: provider-neutral connection state, scope verification, approval-controlled publication jobs, idempotency, retries, provider receipts, and reconciliation.
- Current state: **inactive pending authorized Meta Business access**. Meta is not connected and nothing is published. The deployed database-only, no-credential preflight proves execution remains blocked without owner authorization, verified capability, and a connected record; it never contacts Meta.
- Required gate: owner-authorized Business Portfolio/Page/Instagram access, verified scopes, test publication path, approval evidence, rollback/recovery evidence, and Faraz's specific publishing authorization.

### 6. Google Business Profile + local visibility

- Source target: connection state, Google Business Profile actions, local SEO checks, reviews, website/menu/contact-path checks, visibility observations, evidence, and reviewed actions.
- Current state: **inactive pending authorized Google Business Profile access**. No Google write, review response, ranking claim, or visibility measurement is active. The deployed fail-closed database-only preflight applies the same authority/capability/connection checks for Google and never contacts Google.
- Required gate: owner-authorized account/location access, verified scopes, evidence-backed observations, reputation-sensitive human review, and separate authorization for writes.

### 7. Work orchestration + reporting + final gate

- Source target: jobs, dependencies, attempts, exponential retry scheduling, dead-letter/recovery state, events, notifications, evidence-backed weekly/monthly reports, monitoring, and a fail-closed 100%-readiness result.
- Current state: **deployed foundation / final gate blocked** by missing owner truth, media rights, inactive providers, and incomplete monitoring/recovery evidence. The applied and verified ninth migration implements transactional work transitions, bounded retries, monitor/alert evidence, linked recovery runs, client-safe report evidence, an immutable gate snapshot, and a rehearsal-only No-Go decision. No Go or activation action is exposed.
- Required gate: every required readiness check is passed with evidence; score is 100; no required blocker remains; authenticated end-to-end tests, monitoring, recovery, deployment, and external integration evidence are current.

## Provider-neutral source contracts

The canonical TypeScript contracts are under `artifacts/veroxa/src/domain/momoOperationsV1/`:

- `types.ts` locks confirmation, connection, provider-result, and readiness states.
- `providerAdapters.ts` keeps media AI, content AI, publishing, and visibility behind fail-closed adapters. The default adapter returns `provider_not_authorized` or `incremental_spend_not_approved` and never a fabricated completion.
- `readiness.ts` returns `ready` only at 100% with no required blocker, rejects duplicate/invalid weights, and requires evidence for every passed check.

## Verification and controlled external commands

- `pnpm --filter @workspace/scripts run check-momo-seven-system-readiness-contract`
- `pnpm --filter @workspace/scripts run check-approved-team-identity-provisioning`
- `pnpm --filter @workspace/scripts run check-approved-momo-client-identity-provisioning`
- `pnpm run verify:veroxa`
- Later, from an authorized server environment only: `VEROXA_PROVISION_APPROVED_TEAM_IDENTITY=YES pnpm --filter @workspace/scripts run provision-approved-team-identity`
- Later, only after an approved owner email is allowlisted: `VEROXA_PROVISION_APPROVED_MOMO_CLIENT_IDENTITY=YES pnpm --filter @workspace/scripts run provision-approved-momo-client-identity`
- Later, after redirect configuration and provisioning: `VEROXA_RUN_APPROVED_TEAM_AUTH_SMOKE=YES pnpm --filter @workspace/scripts run smoke-approved-team-auth`

The external identity and Auth smoke commands are deliberately excluded from `verify:veroxa`; CI must never provision users, generate production magic links, or require privileged secrets.

The Team provisioning command requires server-only `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VEROXA_APPROVED_TEAM_EMAIL`, and the explicit acknowledgement. The client command uses the same server-only boundary plus `VEROXA_APPROVED_MOMO_CLIENT_EMAIL` and its own explicit acknowledgement. The Auth/RLS smoke additionally requires `SUPABASE_PUBLISHABLE_KEY` and an allowlisted production `VEROXA_AUTH_REDIRECT_TO`. The commands validate the hosted Supabase URL, never print a key, email, link, token, session, or user ID, and do not place privileged values in any `NEXT_PUBLIC_` variable.
