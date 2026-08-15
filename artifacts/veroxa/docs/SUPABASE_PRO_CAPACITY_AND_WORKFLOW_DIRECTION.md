# Supabase Pro Capacity and Workflow Direction

**Status:** current Veroxa capacity-governance authority  
**Scope:** the Veroxa Dev Supabase organization and the Veroxa operating system  
**Verified:** 2026-08-15 — the connected organization reports plan \`pro\`; its Veroxa Dev project is active in \`us-east-2\`.  
**This document does not assert that any optional feature below is configured or live.**

## Decision

Supabase Pro is approved capacity for Veroxa: use it whenever it materially improves secure persistence, recovery, testing, observability, or reliable internal automation.

Treat capacity as a governed resource, not as permission to turn on every feature. Before enabling a new metered, persistent, or externally consequential capability, establish the concrete benefit, current price/limit, owner, rollback, and evidence gate. Preserve the standing incremental-spend rule and all current external-action locks.

Pro membership does **not** authorize:

- external provider calls, publication, scheduling, review replies, website writes, outreach, re-upload, deletion, or Ready transition;
- a production migration, persistent database branch, compute increase, PITR, read replica, log drain, or any other paid add-on without the required scoped review;
- broader access to tenant data, a service-role credential in client code, or any RLS bypass;
- a claim that a feature is live merely because the plan makes it available.

## Capacity allocation

### Use as the normal Veroxa backbone

- **Postgres + RLS:** keep the canonical, tenant-scoped operational state, immutable lineage, audit events, package hashes, and Team decisions in Supabase. Enforce RLS on every exposed table; run negative cross-tenant tests.
- **Auth:** use approved identities, server-side session validation, active profile/membership checks, and least-privilege role claims. Never use user-editable metadata for authorization.
- **Private Storage:** preserve immutable original media and governed derivatives with content hashes, rights lineage, retention decisions, and safe role-scoped readback.
- **Edge Functions:** use thin, authenticated adapters for bounded server work. Keep secrets server-side, validate schemas, derive actors from verified identity, use idempotency keys, and persist request/result/error evidence.
- **Logs, metrics, advisors, and backups:** use the included operational visibility and daily-backup posture as the baseline. Review security/performance advisors after schema or access-control changes and check the provider usage dashboard during every release closeout.

### Activate only when a concrete workflow needs it

- **Preview branches:** use a short-lived branch for a high-risk migration, function, or integration change when isolated verification materially reduces production risk. Do not seed real production media, secrets, or tenant data. Record creation time, cost exposure, owner, test outcome, and expected removal; close/delete the branch as soon as its evidence is captured.
- **Queues (PGMQ):** use server-side durable queues for retryable, non-interactive internal work such as media assessment dispatch, reconciliation, or report assembly. Keep queues private to server consumers; do not expose queue operations to browser clients. Every message needs a canonical work ID, idempotency key, visibility timeout, bounded retry policy, dead-letter/archival path, and immutable result event.
- **Cron / scheduled invocation:** use only for internal maintenance, reconciliation, monitoring, and queue-pull work that is idempotent, observable, bounded, and fail-closed. A schedule does not authorize any provider or public write.
- **Realtime:** use for read-only status refresh where it improves Client or Team clarity. It is never the canonical state, a permission check, or a command channel.
- **Vault and project secrets:** use the narrowest server-only secret storage appropriate to the caller. Do not put service-role or provider secrets in browser code, public environment variables, client-visible logs, or reusable unsigned endpoints.

### Keep non-default until evidence warrants them

- **PITR:** Pro eligibility is useful, but it is a paid add-on and requires a compatible compute tier. Do not enable it until recovery-point objectives, current pricing, retention, cancellation control, and recurring cost have been reviewed.
- **Read replicas, compute upgrades, log drains, dedicated networking, and extra persistent projects:** evaluate only when observed availability, latency, recovery, compliance, or support needs justify the recurring exposure. Treat each as a separate cost-bearing build step.
- **Any capability that copies, restores, or seeds production data:** require a data-minimization plan, tenant review, retention control, and explicit verification. Branches are data-less by default; keep them that way unless separately justified.

## Spend and capacity controls

1. Prefer included Pro capacity for the one active Veroxa production project and normal internal development.
2. Keep the existing Supabase Spend Cap enabled; use the dashboard's organization/project usage views to review compute, branching, database disk, storage, egress, image transformation, log, and add-on consumption.
3. Classify each proposed capability before enabling it:
   - **included / low-risk:** no known incremental exposure; record the feature and observe usage;
   - **metered:** may consume usage-based resources; state the expected source of usage, soft stop, and monitoring cadence;
   - **recurring or add-on:** requires current provider-price verification and the existing scoped-spend approval before activation.
4. Do not create a persistent branch, resize compute, enable PITR, start a read replica, activate a log drain, or add a new paid project merely to make progress. Use the smallest credible resource for the shortest justified time.
5. For AI and media workflows, account for Supabase usage separately from model/provider costs. A database row, queued message, or successful callback does not prove a provider was called; retain the exact bounded evidence.
6. If a forecast or observed use approaches a limit, stop expansion, diagnose the source, and propose the smallest sustainable adjustment. Never silently raise capacity or accept a new recurring charge.

## Improved delivery workflow

### 0. Classify the change

State the user-visible outcome, affected tenants/roles, data sensitivity, external-action status, exact mutable surfaces, and whether it is source-only, branch-tested, production-bound, or a capacity decision.

### 1. Design the smallest complete path

Keep one canonical record and state transition. Define idempotency, authorization, retries, recovery, audit events, failure states, observability, and rollback before implementation. Bind any AI output to the exact input/media/truth snapshot and keep abstention a first-class state.

### 2. Select the Pro capability proportionately

Use the capacity matrix above. Create a preview branch only for a risk that needs database/function isolation. Use a private queue only for work that must persist across an invocation or needs controlled retries. Do not replace a clear synchronous transaction with a queue merely because queues are available.

### 3. Build with tenant and cost controls in place

Keep migrations forward-only and source-controlled. Keep functions thin and fail-closed. Preserve RLS, private storage, append-only audit evidence, and feature flags. Keep provider/public-write flags disabled unless their separate prerequisites have been met.

### 4. Verify in layers

Run the relevant source tests, migration/schema checks, RLS negative cases, idempotency/retry cases, package/lineage checks, and role-based browser checks. Run Supabase security and performance advisors after relevant database changes. A branch or source test is not production proof.

### 5. Release only exact reviewed bytes

Require the exact reviewed commit, green CI, zero unresolved review issues, and clear production authorization. Apply/merge/deploy only the reviewed change. Do not piggyback a capacity upgrade, optional add-on, or unrelated feature onto a functional fix.

### 6. Observe and close out

Inspect the live migration ledger/configuration, feature flags, logs/metrics, canonical records, and user-visible behavior. Record the evidence level, actual incremental spend, remaining resource exposure, external-action locks, and one next gate. Remove any short-lived branch or test resource after its evidence is preserved.

## Current invariants

- Supabase remains Veroxa's operational source of truth; GitHub remains canonical source for controlled code and migration history.
- Momo is a pilot tenant, not a product-wide inference shortcut. No data, rights, business truth, media, messages, or decisions may cross tenant boundaries.
- A Client supplies authorized media; Veroxa performs routine processing; Team controls the exact internal Ready approval or terminal discard. Ready never means scheduled, posted, or published.
- Current external-action holds remain fully in force: no provider/public write, publishing, scheduling, review reply, website write, re-upload, deletion, or Ready transition.
- All claims about configured features or live behavior require direct source, deployment, browser, or production evidence at the appropriate level.

## Required references before a capacity decision

Verify current provider terms and product behavior at the point of use:

- [Supabase pricing](https://supabase.com/pricing)
- [Branching usage](https://supabase.com/docs/guides/platform/manage-your-usage/branching)
- [Queues](https://supabase.com/docs/guides/queues)
- [Database backups and PITR](https://supabase.com/docs/guides/platform/backups)
- [Vault](https://supabase.com/docs/guides/database/vault)

This document complements, and never overrides, the guarded internal-AI rollout authority, media-readiness contract, cost rule, and release-verification requirements.
