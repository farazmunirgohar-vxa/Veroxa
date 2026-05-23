# Veroxa Role Permission Contracts

This folder contains the Veroxa permission system as **TypeScript contracts only**.

## What this is

- Pure TypeScript constants, types, a permission matrix, and helper functions.
- No runtime authentication enforcement.
- No protected routes.
- No login, session, or token handling.

The portal UI is not gated by these contracts yet. When the project moves to a real auth layer, the backend and API middleware should enforce exactly these same rules before they are mirrored client-side.

## Role system

| Role | Description |
|------|-------------|
| `client` | Restaurant owner. High-level visibility only — scheduled posts, reports, alerts. |
| `team` | Content team member. Executes the full media → concept → draft → schedule workflow. |
| `operator` | Agency operations manager. Oversight and report approval. Does not manage daily execution. |
| `owner` | Agency owner. Strategic view — revenue, client health, commercial account control. |
| `system` | Automated process. Creates logs, triggers derived values, marks post/media status. |

## Naming rules

- Roles are always: **Client, Team, Operator, Owner** (and System for automated processes).
- Never use **Admin**, **Super Admin**, or **Execution Dashboard** — these terms are not part of the Veroxa role system.

## Files

| File | Purpose |
|------|---------|
| `roles.ts` | Role constants and `UserFacingRole` union type |
| `actions.ts` | `PermissionAction` constants (view, create, edit, approve, trigger, receive_alert) |
| `resources.ts` | `PermissionResource` constants (all portal modules) |
| `permissionMatrix.ts` | Typed matrix mapping each role to allowed actions per resource |
| `helpers.ts` | Pure functions: `can()`, `getAllowedActions()`, `getAllowedResources()` |
| `index.ts` | Barrel export for the entire permissions folder |

## Build order

This layer is Step 3 in the Veroxa build sequence:

| Step | Description |
|------|-------------|
| 1 | Schema contracts ✓ |
| 2 | Seed / demo data refactor ✓ |
| 3 | Role permissions ← **you are here** |
| 4 | Real database connection |
| 5 | API layer |
| 6 | Authentication |
| 7 | Uploads |
| 8 | Automation engine |
| 9 | AI integration |
| 10 | Publishing and reporting integrations |

## Future enforcement

The `can()` helper and `permissionMatrix` in this folder represent the source of truth.
When building the API layer (Step 5) and auth layer (Step 6):

1. Middleware should resolve the authenticated user's role.
2. Each API route should call `can(role, action, resource)` before proceeding.
3. Client-side gates (hiding UI elements) should mirror — but never replace — server-side enforcement.
