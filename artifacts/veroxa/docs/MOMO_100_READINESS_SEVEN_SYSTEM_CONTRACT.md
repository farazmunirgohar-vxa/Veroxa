# Momo 100% Readiness — Seven-System Contract

Status: deployed-foundation contract as of 2026-07-13. This document separates source readiness, deployment, runtime connection, and activation so a prepared adapter or screen is never reported as a live provider connection.

## Status vocabulary

- **Release candidate** — the provider-neutral contract, persistence, permissions, UI state, and deterministic tests are present on the current branch; this does not mean merged or deployed.
- **Deployed foundation** — the exact source and database migration are verified in production; this does not mean credentials, owner data, or a provider connection exist.
- **Inactive pending authorized access** — the surrounding Veroxa system is prepared, but no provider call, write, publishing action, or monitoring claim is allowed.
- **Blocked external authority** — completion requires a credential, owner-controlled access, real identity, client confirmation, or specific external action that is not available to the current workflow.
- **Ready** — every required check has evidence and the fail-closed readiness result is exactly 100%. No partial score, adapter, fixture, or empty record may satisfy this state.

## Current release truth

- GitHub `main` contains PR #141 at merged commit `46d01c44f0411a4e870cd490d5bfcd8e58ee0e59`; its exact Sites source is deployed as verified version 7 and both custom domains are active with active SSL.
- The connected Supabase project is healthy and has all eight production migrations, including `momo_full_operating_system_v1` and its advisor hardening. All 32 operating tables force RLS; clean reset, pgTAP, and error-level database lint passed.
- The protected allowlist is aligned to Faraz's approved Gmail Team identity. Its Auth email is confirmed, a real email-link sign-in occurred, the protected trigger created an active Team profile plus active Momo membership, and the authenticated Team/Momo route was verified in Safari. The mistaken secondary identity has disabled profile/membership access.
- `scripts/src/provision-approved-team-identity.ts` remains the preferred server-only, explicit-ack, idempotent Admin path for future identities. It takes approved values only from environment, relies on the protected database allowlist trigger as authority, verifies active access, and rolls back an unaccepted new user. It must not run from CI or browser code.
- Sites version 7 passes only a validated Supabase project URL and publishable key from the existing dynamic login/protected routes; all privileged keys remain server-only, the marketing root remains cacheable, and secure email-link login is verified. The current unmerged candidate adds approved-user password sign-in plus protected password replacement; it is not deployed or activated yet.
- No real Momo owner-confirmed address, phone, hours, menu, services, dietary/halal claim, contacts, brand voice, goals, media rights, platform access, or performance data has been entered. Safe-empty and pending-owner states are correct; fixtures and inferred public facts are not owner confirmation.
- Runtime AI, Meta, Google Business Profile, social publishing, Google writes, visibility monitoring, and external retries remain **inactive pending authorized access**. Provider-neutral contracts return blocked states and must not simulate success.
- No new spend is approved. The deployed foundation provides interfaces, queues, evidence, approval gates, deterministic checks, and recovery behavior without activating a chargeable provider.

## Seven systems

### 1. Restaurant Intelligence + Onboarding V1

- Source target: persistent restaurant truth with explicit confirmation states for identity, location/address, phone, hours, menu, services, dietary/halal claims, contacts, brand voice, goals, presence, readiness, and Team/client confirmation views.
- Current state: **deployed foundation / safe-empty runtime**.
- Required gate: owner-confirmed truth and Team verification must be represented separately; neither inferred evidence nor a Team draft may count as owner confirmation.
- Client read boundary: operational base tables remain Team-only. Client confirmation/readiness data must come through the role-sanitized `veroxa_momo_client_snapshot_v1` RPC, which checks active Momo client membership, returns only approved client-safe columns, and cannot be called by anonymous users.

### 2. Team identity + authenticated Team/Momo access

- Source target: database allowlist, Auth Admin provisioning, active `team` profile, active Momo membership, approved-user password or secure-email-link session, RLS, and authenticated Team/Momo smoke evidence.
- Current state: deployed Auth/RLS foundation plus a confirmed, signed-in, active Team/Momo identity and verified Safari protected-route smoke. Secure email-link access is live on Sites version 7. The current unmerged candidate adds password sign-in and protected password replacement. No Momo client identity is approved or provisioned.
- Required gate: preserve the supported Admin path, approved email, redirect allowlist, active profile/membership checks, API/RLS boundary, and browser route smoke. Public signup and service-role exposure remain forbidden. Before password activation is claimed, enable and verify hosted Supabase reauthentication for password changes, deploy the candidate, and complete a real password sign-in smoke with a unique non-breached password.

### 3. Media intake + intelligence

- Source target: private intake, rights history, quality review, AI classification state, tags, reuse eligibility, use history, and Team/client-safe views.
- Current state: **deployed foundation / no real media or rights record**. AI classification is inactive pending an authorized provider and incremental-spend approval if applicable.
- Required gate: permissioned media, verified rights, private object access, review evidence, and a non-simulated provider or explicitly manual classification path.

### 4. AI content strategy + calendar

- Source target: confirmed-truth inputs, permissioned-media inputs, strategy, concepts, captions, platform variants, approval queues, calendar, immutable approval evidence, and failure states.
- Current state: **deployed foundation / runtime AI inactive**.
- Required gate: authorized provider configuration, no unconfirmed business truth, Team/Faraz review, owner review where required, and no customer-visible or scheduled output without recorded approval.

### 5. Meta social handling

- Source target: provider-neutral connection state, scope verification, approval-controlled publication jobs, idempotency, retries, provider receipts, and reconciliation.
- Current state: **inactive pending authorized Meta Business access**. Meta is not connected and nothing is published.
- Required gate: owner-authorized Business Portfolio/Page/Instagram access, verified scopes, test publication path, approval evidence, rollback/recovery evidence, and Faraz's specific publishing authorization.

### 6. Google Business Profile + local visibility

- Source target: connection state, Google Business Profile actions, local SEO checks, reviews, website/menu/contact-path checks, visibility observations, evidence, and reviewed actions.
- Current state: **inactive pending authorized Google Business Profile access**. No Google write, review response, ranking claim, or visibility measurement is active.
- Required gate: owner-authorized account/location access, verified scopes, evidence-backed observations, reputation-sensitive human review, and separate authorization for writes.

### 7. Work orchestration + reporting + final gate

- Source target: jobs, dependencies, attempts, exponential retry scheduling, dead-letter/recovery state, events, notifications, evidence-backed weekly/monthly reports, monitoring, and a fail-closed 100%-readiness result.
- Current state: **deployed foundation / final gate blocked** by missing owner truth, media rights, inactive providers, and incomplete monitoring/recovery evidence.
- Required gate: every required readiness check is passed with evidence; score is 100; no required blocker remains; authenticated end-to-end tests, monitoring, recovery, deployment, and external integration evidence are current.

## Provider-neutral source contracts

The canonical TypeScript contracts are under `artifacts/veroxa/src/domain/momoOperationsV1/`:

- `types.ts` locks confirmation, connection, provider-result, and readiness states.
- `providerAdapters.ts` keeps media AI, content AI, publishing, and visibility behind fail-closed adapters. The default adapter returns `provider_not_authorized` or `incremental_spend_not_approved` and never a fabricated completion.
- `readiness.ts` returns `ready` only at 100% with no required blocker, rejects duplicate/invalid weights, and requires evidence for every passed check.

## Verification and controlled external commands

- `pnpm --filter @workspace/scripts run check-momo-seven-system-readiness-contract`
- `pnpm --filter @workspace/scripts run check-approved-team-identity-provisioning`
- `pnpm run verify:veroxa`
- Later, from an authorized server environment only: `VEROXA_PROVISION_APPROVED_TEAM_IDENTITY=YES pnpm --filter @workspace/scripts run provision-approved-team-identity`
- Later, after redirect configuration and provisioning: `VEROXA_RUN_APPROVED_TEAM_AUTH_SMOKE=YES pnpm --filter @workspace/scripts run smoke-approved-team-auth`

The two external commands are deliberately excluded from `verify:veroxa`; CI must never provision users, generate production magic links, or require privileged secrets.

The provisioning command requires server-only `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VEROXA_APPROVED_TEAM_EMAIL`, and the explicit acknowledgement. The Auth/RLS smoke additionally requires `SUPABASE_PUBLISHABLE_KEY` and an allowlisted production `VEROXA_AUTH_REDIRECT_TO`. The commands validate the hosted Supabase URL, never print a key, email, link, token, session, or user ID, and do not place privileged values in any `NEXT_PUBLIC_` variable.
