# Active Docs Index

Status: highest-level active contributor guide and current source-of-truth index. Read this file before relying on any older Veroxa doc.

## Current source-of-truth docs

These files reflect the current Veroxa manual/pre-live model and override historical/archive strategy notes. If another doc conflicts with this index, do not override this index; treat the conflicting note as stale until Faraz explicitly refreshes it:

- `CURRENT_BUILD_STATUS.md`
- `PRICING_SOURCE_OF_TRUTH.md`
- `VEROXA_OS_SYSTEM_MAP.md`
- `ROUTE_PAGE_INVENTORY.md`
- `VEROXA_ROUTE_SURFACE_MAP.md`
- `PRE_PAID_ACTIVATION_GATE.md`
- `MANUAL_FIRST_CLIENT_LAUNCH_PACK.md`
- `FIRST_CLIENT_CLIENT_INSTRUCTIONS.md`
- `FIRST_CLIENT_TEAM_CHECKLIST.md`
- `FIRST_WEEK_EXECUTION_CHECKLIST.md`
- `FIRST_WEEK_WEEKLY_UPDATE_TEMPLATE.md`
- `FIRST_MONTH_MONTHLY_REPORT_TEMPLATE.md`
- `PAKISTAN_TEAM_EXECUTION_SOP.md`
- `FARAZ_ESCALATION_RULES.md`
- `FIRST_CLIENT_MANUAL_LAUNCH_INDEX.md`
- `REAL_AUTH_READINESS_AUDIT.md`
- `PRODUCTION_PREVIEW_LOGIN_CHECKLIST.md`

## Pricing truth

The only active public launch offer is **Complete Online Presence — $495/month**. Starter, Growth, Premium, Local Presence, Full Presence, old Complete Presence, $295, $995, $977, and $488 references are historical/deprecated/archive-only unless a current source-of-truth doc explicitly says otherwise.

## Archive rule

Historical docs remain useful as reference, but they must not override current source-of-truth docs. Do not override current docs with older current-looking files, changelog sections, or archived strategy notes. If an older file includes old pricing, multi-package language, Owner/Operator/Super Admin/generic Admin/Execution dashboards, or future automation plans, treat it as archive/reference only unless it has been explicitly refreshed as active.

## Deployment/auth truth

Production/custom domains should set `VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN=false`. Preview deployments may use fallback preview credentials only for review. `AUTH_MODE` remains `placeholder` until real-auth readiness is explicitly approved.


## 2026-06-07 — Real pilot mode lock

- Veroxa is moving from public demo/preview portal exposure into **real pilot pre-live/manual mode**.
- Public demo/preview portals are no longer part of the active live app surface; `/demo`, `/guided-demo`, `/upload`, and `/demo/client/*` must remain disabled from active routing.
- Active app portal experiences are only **Client Portal** and **Team/Internal Admin Portal**. Owner, Operator, Super Admin, generic Admin, and Execution portals remain parked/blocked.
- First real pilot client: **Momo House San Antonio**. Momo House is an internal unpaid cooperation pilot account for initial Veroxa improvement work, not a public pricing change.
- Internal operations identity: **Team Faraz**.
- Locked audit-to-onboarding workflow: public/initial audit → prefilled onboarding profile → owner verification → credential/platform connection → gap completion by owner + Veroxa team → final onboarding approval.
- Onboarding must show which fields were prefilled by Veroxa, need owner verification, are missing, were corrected by owner, or were completed by Veroxa.
- Safety remains pre-live/manual only: no production auth, database writes, storage uploads, live AI, connectors, payments, webhooks, cron, or automated customer-visible execution; `AUTH_MODE` remains `placeholder`.

## 2026-06-07 — PR #82 matcher safety and onboarding alignment

- Audit matching is conservative for location conflicts: state-only is not city/state matched, city/state mismatches are penalized, and city-conflicting Momo House inputs must not exact-prefill San Antonio unless strong proof exists (phone, domain, strong address, or platform/domain link).
- Audit-to-onboarding prefill statuses are: `prefilled_by_veroxa`, `needs_owner_verification`, `missing`, `owner_corrected`, `completed_by_team`, and `blocked_needs_access`.
- Active portals remain only Client Portal and Team/Internal Admin Portal; retired demo/preview routes remain disabled.
- No live auth, writes, storage uploads, live AI, connectors, payments, cron/background jobs, or automated publishing were added.
