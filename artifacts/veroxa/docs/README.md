# Veroxa Documentation Index

The Veroxa frontend is a **demo platform** plus an **architecture
package** for the production system that will follow. This index links
to every important planning, safety, and architecture doc.

> **Demo-safe defaults.** No real auth, no real writes, no real
> uploads, no Supabase Storage buckets, no AI API integration, no
> publishing integrations, and no Google Business Profile integration
> exist today. The Supabase frontend client is anon read-only for the
> Client Portal demo only.

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

## AI, publishing, SEO

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
  draft.

> All SQL files in `database/*-draft/` are **commented** and explicitly
> marked `DO NOT RUN`.
