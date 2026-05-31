# Veroxa Documentation Index

The Veroxa frontend is a **demo platform** plus an **architecture
package** for the production system that will follow. This index links
to every important planning, safety, and architecture doc.

> **Demo-safe defaults.** No active real auth, no real writes, no
> real uploads, no Supabase Storage buckets, no AI API integration,
> no publishing integrations, and no Google Business Profile
> integration exist today. The Supabase frontend client is anon
> read-only for the Client Portal demo only.
>
> **Canonical auth state (audit: 2026-05-27):** `AUTH_MODE` is
> `"placeholder"` (`src/lib/auth/authMode.ts`). Real Supabase Auth
> code (`getSession`, `onAuthStateChange`, `user_profiles` lookup,
> gated `signInWithPassword`) is **wired but inactive**. Activation
> is gated on the human dev-test pass for M001–M006 — see the
> current-state section in [`BUILD_STATUS.md`](./BUILD_STATUS.md)
> before acting on any auth-flip plan.

## Current safety / status references

Read these **first** before proposing any auth, SQL, or backend
work. They reflect the latest audit and override older "next
phase" language elsewhere in this index.

- [`BUILD_STATUS.md`](./BUILD_STATUS.md) — top section is the
  authoritative current-state summary, current next-step ladder,
  and the allowed / forbidden next prompt themes.
- [`FIRST_CLIENT_READINESS_FOUNDATION.md`](./FIRST_CLIENT_READINESS_FOUNDATION.md)
  — first 1–5 client operating model, manual execution boundary,
  launch gate, and readiness checklists for Faraz and future builders.
- [`CLIENT_HEALTH_ENGINE_CONTRACT.md`](./CLIENT_HEALTH_ENGINE_CONTRACT.md)
  — authoritative outputs of `ClientHealthEngine` and latest
  per-page drift audit.
- [`CLIENT_HEALTH_SURFACE_MAP.md`](./CLIENT_HEALTH_SURFACE_MAP.md)
  — per-page inventory of every surface that renders
  health-derived content.
- [`PORTAL_QUERY_SAFETY_PLAN.md`](./PORTAL_QUERY_SAFETY_PLAN.md)
  — what the portal is allowed to read, scoped grep sweeps,
  latest audit pass.
- [`PORTAL_QUERY_SAFETY_CHECKLIST.md`](./PORTAL_QUERY_SAFETY_CHECKLIST.md)
  — the exact grep commands that must pass before any portal
  query change.
- [`sql_drafts/dev_test/README.md`](./sql_drafts/dev_test/README.md)
  — master M001–M006 dev-test execution order with all
  correction subfiles inserted in the correct position. Human
  execution gate.
- [`FIXTURE_COHERENCE_AUDIT.md`](./FIXTURE_COHERENCE_AUDIT.md) —
  planning-only audit of demo fixture domains (clients, health,
  financials, reports, media, agents, operations, system status),
  their portal consumers, drift risks, and the safe future
  cleanup direction. No runtime behavior change.

## Status & process

- [`BUILD_STATUS.md`](./BUILD_STATUS.md) — what is shipped, what is
  draft, what is next.
- [`SAFETY_AUDIT_CHECKLIST.md`](./SAFETY_AUDIT_CHECKLIST.md) — what
  is forbidden in the codebase today and what must be true before
  real auth / writes / uploads ship.
- [`PRODUCTION_LAUNCH_RUNBOOK.md`](./PRODUCTION_LAUNCH_RUNBOOK.md) —
  staged plan from demo → production, including rollback principles.

## Auth & access

- [`AUTH_ARCHITECTURE_PLAN.md`](./AUTH_ARCHITECTURE_PLAN.md) — high-
  level auth + role model design (placeholder hook, future hook,
  route shells).
- [`REAL_AUTH_READINESS_CHECKLIST.md`](./REAL_AUTH_READINESS_CHECKLIST.md)
  — gating checklist before wiring real Supabase Auth.
- [`MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md`](./MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md)
  — manual Supabase steps the project owner runs by hand before the
  `AUTH_MODE` flip.
- [`AUTH_TEST_USER_MATRIX.md`](./AUTH_TEST_USER_MATRIX.md) — per-role
  test users + expected access scope.
- [`AUTH_QA_CHECKLIST.md`](./AUTH_QA_CHECKLIST.md) — pre-flip,
  post-flip, regression, and security checks.
- [`AUTH_ROLLBACK_PLAN.md`](./AUTH_ROLLBACK_PLAN.md) — safe rollback
  procedure if real auth misbehaves.
- [`AUTH_MODE_SWITCH_PLAN.md`](./AUTH_MODE_SWITCH_PLAN.md) — scope
  contract for the one-line `AUTH_MODE` flip prompt.
- [`PRODUCTION_RLS_FINALIZATION_CHECKLIST.md`](./PRODUCTION_RLS_FINALIZATION_CHECKLIST.md)
  — RLS requirements, table list, pre-apply test matrix, do-not-apply
  conditions.

## Data & write surfaces

- [`FIRST_WRITE_SURFACE_PLAN.md`](./FIRST_WRITE_SURFACE_PLAN.md) —
  prioritized first writes (Priority 1–4), prerequisites, audit
  expectations.
- [`CLIENT_DATA_MAPPING.md`](./CLIENT_DATA_MAPPING.md) — demo UI
  field → future DB field mapping for onboarding and media.
- [`WORKFLOW_STATE_MACHINES.md`](./WORKFLOW_STATE_MACHINES.md) —
  planned states, transitions, role gating, audit actions per entity.

## Real MVP readiness

- [`REAL_MVP_READINESS_PLAN.md`](./REAL_MVP_READINESS_PLAN.md) — the
  10-step sequence from demo to real MVP, MVP boundary, and the
  rule that every future demo feature must justify itself.
- [`CUSTOMER_GROWTH_PRIORITY.md`](./CUSTOMER_GROWTH_PRIORITY.md) —
  Veroxa's #1 priority (bring restaurants more customers) and the
  6-question feature filter.
- [`ROUTE_VISIBILITY_STRATEGY.md`](./ROUTE_VISIBILITY_STRATEGY.md) —
  route visibility history. Current active routing is public pages,
  `/demo/client/dashboard`, `/client/*`, and guarded `/team/*`.
- [`ROUTE_ARCHITECTURE.md`](./ROUTE_ARCHITECTURE.md) — full map of
  public, internal demo, and future real routes.
- [`INTERNAL_DEMO_PROTECTION_PLAN.md`](./INTERNAL_DEMO_PROTECTION_PLAN.md)
  — historical internal-demo protection notes; current active roles are
  Restaurant Partner / Client and Veroxa Team / Faraz only.
- [`PRE_AUTH_TECHNICAL_CHECKLIST.md`](./PRE_AUTH_TECHNICAL_CHECKLIST.md)
  — every item that must be ticked before proposing Real Auth V1.
- [`NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md`](./NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md)
  — draft of the next prompt; do not execute until approved.

## AI, publishing, SEO

- [`ADAPTIVE_IMPROVEMENT_ENGINE_PLAN.md`](./ADAPTIVE_IMPROVEMENT_ENGINE_PLAN.md)
  — long-term adaptive growth principle: auto-recommend by default,
  human approval for anything sensitive.

- [`MEDIA_GUIDANCE_ENGINE_PLAN.md`](./MEDIA_GUIDANCE_ENGINE_PLAN.md)
  — rule-based restaurant media guidance, restaurant types covered,
  V1 → V3 rollout, safety principles. Source of truth lives in
  `src/lib/mediaGuidance.ts`.
- [`AI_AGENT_ARCHITECTURE_PLAN.md`](./AI_AGENT_ARCHITECTURE_PLAN.md)
  — agent inventory, staged rollout (V1/V1.5/V2/V3), safety
  principles.
- [`SOCIAL_PUBLISHING_PLAN.md`](./SOCIAL_PUBLISHING_PLAN.md) —
  publishing phases, requirements, hard rules.
- [`GOOGLE_SEO_GBP_PLAN.md`](./GOOGLE_SEO_GBP_PLAN.md) — Google
  Business Profile + local SEO scope, human-in-the-loop rules, and
  what is explicitly **not** promised.

## Draft database directories (none applied)

- [`database/auth-draft/`](./database/auth-draft/) — `user_profiles`,
  `team_client_assignments`, role enum, and draft RLS direction.
- [`database/write-draft/`](./database/write-draft/) — first write
  surfaces and `audit_logs` table draft.
- [`database/onboarding-draft/`](./database/onboarding-draft/) —
  `onboarding_items.answer_payload` shape + draft column extensions.
- [`database/media-draft/`](./database/media-draft/) — future
  `veroxa-client-media` bucket plan + `media_assets` extension
  draft + `client_media_guidance_profiles` draft.

> All SQL files in `database/*-draft/` are **commented** and explicitly
> marked `DO NOT RUN`.
