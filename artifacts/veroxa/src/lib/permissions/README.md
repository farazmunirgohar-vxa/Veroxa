# Veroxa Role Permission Contracts

This folder contains the Veroxa permission system as **TypeScript contracts only**.

## What this is

- Pure TypeScript constants, types, a permission matrix, and helper functions.
- No runtime authentication enforcement.
- No protected routes.
- No login, session, or token handling.

The portal UI is not gated by these contracts yet. When the project moves to a
real auth layer, the backend and API middleware should enforce exactly these same
rules before they are mirrored client-side.

## Current active role system

Active human roles are only:

| Role | Description |
|------|-------------|
| `client` | Restaurant Partner. High-level, client-safe visibility only — media submission, requests, updates, and reports. |
| `team` | Veroxa Team / Internal Admin. Reviews uploads, prepares work, handles approvals, and manages the active internal workflow. |

`system` remains a non-human automated-process role for internal contract data
only. It has no portal dashboard or human login.

Operator and Owner are **not active runtime roles** in the current Veroxa model.
Older permission or planning language that mentioned them is deprecated/historical
only and must not be reintroduced into active navigation, auth contracts, portal
routes, or user-facing docs. Do not use Super Admin language.

## Naming rules

- Current active human role names are **Client / Restaurant Partner** and
  **Team / Internal Admin**.
- Do not describe Operator or Owner as active portal roles.
- Never use **Super Admin** or **Execution Dashboard** — these terms are not part
  of the current Veroxa role system.

## Files

| File | Purpose |
|------|---------|
| `roles.ts` | Active role constants and `UserFacingRole` union type |
| `actions.ts` | `PermissionAction` constants (view, create, edit, approve, trigger, receive_alert) |
| `resources.ts` | `PermissionResource` constants (all portal modules) |
| `permissionMatrix.ts` | Typed matrix mapping each role to allowed actions per resource |
| `helpers.ts` | Pure functions: `can()`, `getAllowedActions()`, `getAllowedResources()` |
| `index.ts` | Barrel export for the entire permissions folder |

## Current builder model

Codex is the primary engineering/build/hardening partner for this repo. Replit is
secondary/preview-only unless Faraz explicitly says otherwise. Permission changes
should stay aligned with `authContract.ts` and the two active human roles.

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
