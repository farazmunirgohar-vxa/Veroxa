# Active Docs Index

Status: active contributor guide for current source-of-truth docs.

## Current source-of-truth docs

These files reflect the current Veroxa manual/pre-live model and override historical/archive strategy notes:

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

## Pricing truth

The only active public launch offer is **Complete Online Presence — $495/month**. Starter, Growth, Premium, Local Presence, Full Presence, old Complete Presence, $295, $995, $977, and $488 references are historical/deprecated/archive-only unless a current source-of-truth doc explicitly says otherwise.

## Archive rule

Historical docs remain useful as reference, but they must not override current source-of-truth docs. If an older file includes old pricing, multi-package language, Owner/Operator/Super Admin/generic Admin/Execution dashboards, or future automation plans, treat it as archive/reference only unless it has been explicitly refreshed as active.

## Deployment/auth truth

Production/custom domains should set `VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN=false`. Preview deployments may use fallback preview credentials only for review. `AUTH_MODE` remains `placeholder` until real-auth readiness is explicitly approved.
