---
name: Veroxa nav count invariant
description: Three places must stay in sync when adding/removing operator portal nav items.
---

## Rule
When adding or removing a visible nav item to the operator portal, update ALL three locations:

1. `artifacts/veroxa/src/lib/operatorPortalNav.ts` — the array itself + the `VISIBLE NAV COUNT:` comment
2. `artifacts/veroxa/src/lib/demoRoutes.ts` — the `// visible_nav count:` comment above `operatorDemoRoutes`
3. The actual route entry in `operatorDemoRoutes` with `visibility: "visible_nav"`

**Why:** The codebase has explicit count comments that serve as a consistency check. Drift between these three places causes confusion during audits.

**Current counts (as of Evidence Engine V1 addition):**
- Client: 6, Team: 7, Operator: 24, Owner: 7 (section headers not counted)

**How to apply:** Always grep for "visible_nav count" across both nav files when adding a new page.
