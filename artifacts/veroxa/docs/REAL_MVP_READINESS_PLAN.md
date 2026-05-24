# Real MVP Readiness Plan

> **The project is now shifting from demo expansion to real MVP
> readiness.** Demo Veroxa explains and sells the system. Real
> Veroxa will operate the system. From this point on, demo and real
> live side by side, but **demo is no longer the project**.

## Current strategy

- **Demo Veroxa** (`/demo/*`) — explains and sells the system; helps
  the team align on shape; surfaces what real routes will eventually
  do.
- **Real Veroxa** (`/client/*`, `/team/*`, `/operator/*`, `/owner/*`) —
  operates the system. Currently placeholder shells behind
  `RequireRole`.
- Both continue side by side, but **future demo work must be
  justified.** Demo is not allowed to grow indefinitely.

## Locked rule — every future demo feature must do at least one of

1. **Help sell Veroxa.** Improves the prospect-facing client demo.
2. **Clarify a real workflow.** Makes a future real surface easier
   to design or test.
3. **Prepare a real data model.** Shapes a schema we will actually
   build.
4. **Improve future client / operator experience.** Tightens
   something we will ship for real.

If a proposed demo feature does **none** of the four, **skip it**.

## Veroxa's #1 priority

**Helping restaurants bring more customers is Veroxa's number one
priority. Everything inside Veroxa must revolve around that.**

Every feature, every workflow, every screen must answer at least one
of:

- Does this help the restaurant get **discovered**?
- Does this make customers **more likely to visit / order**?
- Does this improve **trust** on Google / social media?
- Does this improve **posting consistency**?
- Does this **reduce friction** for the owner?
- Does this help Veroxa **act before the client loses momentum**?

If a feature does none of these, it is not Veroxa-shaped — defer or
cut it. See [`CUSTOMER_GROWTH_PRIORITY.md`](./CUSTOMER_GROWTH_PRIORITY.md).

## Real MVP sequence

Strict order. Each step gates the next. Manual review at every
boundary.

1. **Pre-auth code readiness.** *(in progress in this pass —
   auth contract, route registries, `RealRoutePlaceholder`, doc set.)*
2. **Real Supabase Auth V1.** Read-only session handling
   (`getSession` + `onAuthStateChange`); no writes. Draft at
   [`NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md`](./NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md).
3. **Real `user_profiles` + role routing.** Resolve role from
   profile, pick `getRoleHomePath(role)`.
4. **Real protected route shell.** Wire `RequireRole` to the new
   real auth hook; demo behavior unchanged.
5. **First real `/client/dashboard` read-only.** A single live
   client surface; no writes.
6. **Remove production anon read access** before real client data
   ever lands in Supabase. See
   [`PRODUCTION_RLS_FINALIZATION_CHECKLIST.md`](./PRODUCTION_RLS_FINALIZATION_CHECKLIST.md).
7. **First real onboarding save.** Smallest possible write,
   `audit_logs` row required. See
   [`FIRST_WRITE_SURFACE_PLAN.md`](./FIRST_WRITE_SURFACE_PLAN.md).
8. **First real media upload.** Private bucket only. See
   [`database/media-draft/001_media_storage_plan.md`](./database/media-draft/001_media_storage_plan.md).
9. **Team / operator workflow writes.** Approvals, reviews,
   scheduling. State machines per
   [`WORKFLOW_STATE_MACHINES.md`](./WORKFLOW_STATE_MACHINES.md).
10. **AI / publishing / Google integrations.** Much later, gated by
    [`AI_AGENT_ARCHITECTURE_PLAN.md`](./AI_AGENT_ARCHITECTURE_PLAN.md),
    [`SOCIAL_PUBLISHING_PLAN.md`](./SOCIAL_PUBLISHING_PLAN.md), and
    [`GOOGLE_SEO_GBP_PLAN.md`](./GOOGLE_SEO_GBP_PLAN.md).

## MVP boundary

**MVP does NOT need:**

- Full AI.
- Automatic publishing.
- Full Google API integration.
- Billing.
- Advanced analytics.
- Autonomous agents.

**MVP DOES need:**

- Real login.
- Role-based protection.
- Client-specific data isolation (RLS).
- Real client onboarding (saved).
- Real media upload (private bucket).
- Visible team / operator workflow.
- Reporting (even if hand-prepared).
- `audit_logs` rows before any write.

## Cross-references

- [`ROUTE_VISIBILITY_STRATEGY.md`](./ROUTE_VISIBILITY_STRATEGY.md)
- [`ROUTE_ARCHITECTURE.md`](./ROUTE_ARCHITECTURE.md)
- [`PRE_AUTH_TECHNICAL_CHECKLIST.md`](./PRE_AUTH_TECHNICAL_CHECKLIST.md)
- [`REAL_AUTH_READINESS_CHECKLIST.md`](./REAL_AUTH_READINESS_CHECKLIST.md)
- [`ADAPTIVE_IMPROVEMENT_ENGINE_PLAN.md`](./ADAPTIVE_IMPROVEMENT_ENGINE_PLAN.md)
- [`CUSTOMER_GROWTH_PRIORITY.md`](./CUSTOMER_GROWTH_PRIORITY.md)
