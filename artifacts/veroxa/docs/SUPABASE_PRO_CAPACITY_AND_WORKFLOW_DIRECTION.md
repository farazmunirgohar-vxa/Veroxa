# Supabase Pro Capacity and Workflow Direction

**Status:** current Veroxa capacity-governance authority

**Scope:** the Veroxa Dev Supabase organization and Veroxa operating system

**Verified:** 2026-08-21 — the connected organization reports plan `pro`; project `mwqkhsvdezeykdpqhqec` is `ACTIVE_HEALTHY` in `us-east-2`.

**Evidence boundary:** this record does not assert that Spend Cap, a particular backup posture, or any optional Pro feature is configured or live.

## Decision

Supabase Pro is governed capacity for Veroxa. Use it when it materially improves secure persistence, recovery, isolated verification, observability, or reliable internal automation. It is not permission to enable every available feature.

Before enabling a new metered, persistent, data-copying, or externally consequential capability, record the concrete need, current provider price and limit, expected usage, owner, rollback or cancellation path, evidence gate, and shortest justified lifetime. Preserve the standing spend rule and every external-action lock.

Pro does not authorize:

- provider calls, publication, scheduling, review replies, website writes, outreach, customer contact, re-upload, deletion, or a Ready transition;
- a production migration, persistent branch, compute change, PITR, replica, log drain, additional project, or other cost-bearing add-on without its scoped release and spend authority;
- production-data copies, wider tenant access, browser-held service-role credentials, or an RLS bypass;
- a claim that a feature is configured merely because the plan makes it available.

## Normal backbone

- **Postgres and RLS:** keep canonical tenant-scoped operational state, immutable lineage, audit events, exact hashes, and Team decisions in Supabase. Enable and force RLS where appropriate, preserve least privilege, and run negative cross-tenant cases.
- **Auth:** derive actors from verified sessions and current profile or membership state. Never use user-editable metadata as authorization.
- **Private Storage:** preserve authorized originals and governed derivatives with content hashes, rights lineage, retention decisions, and role-scoped readback.
- **Edge Functions:** keep adapters thin, bounded, authenticated by their explicit contract, idempotent, observable, and fail-closed. Secrets remain server-only; request, result, and error evidence remains durable.
- **Operational evidence:** use available logs, metrics, advisors, backup controls, and usage views proportionately. Verify actual configuration and retention before relying on any recovery claim.

## Conditional capabilities

- **Preview branches:** use a short-lived, data-minimized branch only when isolated migration or function verification materially reduces risk. Do not seed customer media, production secrets, or tenant data by default. Record owner, creation time, expected cost, test result, and removal target; remove it after evidence is preserved.
- **Queues:** a private PGMQ queue is appropriate only for retryable internal work that must survive an invocation. Every message needs a canonical work ID, idempotency key, visibility timeout, bounded retries, dead-letter or archival behavior, and immutable result evidence. Browser clients do not operate queues.
- **Cron:** schedule only bounded, idempotent, observable, fail-closed internal maintenance, reconciliation, monitoring, or queue-pull work. A schedule never authorizes a provider or public write.
- **Realtime:** use only for read-only status refresh when it materially improves Client or Team clarity. It is not canonical state, a permission check, or a command channel.
- **Vault and project secrets:** use only the narrowest server-side secret surface required by the caller. No service-role or provider secret belongs in browser code, public variables, client-visible logs, or reusable unsigned endpoints.

## Non-default capabilities

Keep PITR, replicas, compute upgrades, log drains, dedicated networking, extra persistent projects, and production-data copies off the default path. Consider one only when observed recovery, availability, latency, compliance, or support evidence justifies its recurring exposure. Reverify provider prerequisites, current price, retention, rollback, cancellation, and owner at the point of use.

Branches are data-less and short-lived by default. Any copy, restore, or seed of production data requires separate data-minimization, tenant, retention, access, and cleanup review.

## Spend and capacity controls

1. Prefer included Pro capacity for the one active Veroxa project and normal internal development.
2. Treat Spend Cap configuration, usage, backup state, and optional-feature state as unverified until read directly from the appropriate current provider surface. Do not copy PR #192's former `Spend Cap enabled` wording into current authority.
3. Classify each proposed capability before enabling it:
   - **included / low exposure:** no identified incremental charge; record and observe usage;
   - **metered:** identify the usage source, expected ceiling, soft stop, and monitoring cadence;
   - **recurring / add-on:** reverify current price and limits, obtain the existing scoped-spend authority, and record cancellation.
4. Do not create a persistent branch, resize compute, enable PITR, start a replica, activate a drain, or create a paid project merely to accelerate progress. Use the smallest credible resource for the shortest justified period.
5. Account for Supabase consumption separately from AI or media-provider costs. A row, queue message, or callback is not proof that a provider was called.
6. If forecast or observed usage approaches a limit, stop expansion, diagnose the source, and propose the smallest sustainable adjustment. Never silently raise capacity or accept recurring spend.

## Exact delivery workflow

### 0. Classify

State the user-visible outcome, tenants and roles, data sensitivity, external-action status, exact mutable surfaces, cost class, and whether the work is source-only, branch-tested, production-bound, or only a capacity decision.

### 1. Design the smallest complete path

Define one canonical record and state transition, authorization, idempotency, retries, recovery, audit evidence, observability, failure states, and rollback before implementation. Bind AI output to exact input, media, and truth snapshots; keep abstention first-class.

### 2. Select capacity proportionately

Choose the least powerful capability that satisfies the concrete risk. Do not replace a clear synchronous transaction with a queue, a normal test with a preview branch, or a current resource with a larger one merely because Pro makes it available.

### 3. Build under existing locks

Keep migrations forward-only and source-controlled, functions thin, secrets server-only, RLS and private Storage intact, audit evidence append-only, and provider or public-write flags disabled unless their separate prerequisites are satisfied.

### 4. Verify in layers

Run relevant source tests, migration and schema checks, RLS negative cases, idempotency and retry cases, package and lineage checks, role-based portal checks, and current security or performance advisors after relevant database changes. Branch or source evidence is not production evidence.

### 5. Release exact reviewed bytes

Require the stable exact head, green required workflows, Copilot's exclusive assigned review with no unresolved blocking finding, and explicit production authority. Apply, merge, or deploy only that exact change; never piggyback an add-on or unrelated capacity change.

### 6. Observe and close out

Read back the live ledger, exact configuration, flags, logs, canonical records, user-visible result, resource exposure, and actual spend evidence. Remove short-lived resources only after their evidence is preserved. Keep unverifiable claims labeled unverified.

## Current invariants

- Supabase is Veroxa's operational source of truth; GitHub is canonical for controlled code and forward migration history.
- Momo is the founding pilot, not a product-wide inference shortcut. No tenant data, rights, media, business truth, messages, or decisions cross boundaries.
- A Client supplies authorized media; Veroxa performs routine processing; Team controls the exact internal Ready decision. Ready never means scheduled, posted, published, or founder GO.
- All current external-action locks remain closed. The synthetic, authenticated-portal, separate-Team-decision, and founder gates remain incomplete.
- Copilot alone reviews an assigned PR code diff. Codex implements, tests, fixes objective findings, verifies release evidence, and performs only separately authorized release execution.
- Every claim about configuration or live behavior requires direct source, deployment, browser, or production evidence at the appropriate level.

## Required provider references

At the point of a capacity decision, reverify current provider terms and behavior in Supabase's official pricing, usage, Branching, Queues, Cron, Realtime, backups/PITR, Vault, and platform documentation. Current provider evidence outranks remembered limits or PR #192's 2026-08-15 snapshot.

This authority complements and never overrides `CURRENT_STATE.json`, `CURRENT_MILESTONE.md`, the guarded internal-AI rollout authority, tenant and media contracts, release guards, or external-action locks.
