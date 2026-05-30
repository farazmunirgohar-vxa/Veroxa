---
name: Veroxa nav count invariant
description: Keep the operator-portal visible-nav count in sync across three locations when adding/removing items.
---

## Rule
When adding or removing a *visible* nav item in the operator portal, update ALL three locations together:

1. `artifacts/veroxa/src/lib/operatorPortalNav.ts` — the nav array itself plus its `VISIBLE NAV COUNT:` comment.
2. `artifacts/veroxa/src/lib/demoRoutes.ts` — the `// visible_nav count:` comment above `operatorDemoRoutes`.
3. The matching route entry in `operatorDemoRoutes` with `visibility: "visible_nav"`.

**Why:** The codebase uses explicit count comments as a self-consistency check. Drift between the comment and the actual array has repeatedly caused false audit/review failures (a reviewer trusts the comment, the array disagrees). Treat the live array as source of truth; the comments must follow it, never lead it.

**How to apply:** Before editing operator nav, grep `visible_nav count` and `VISIBLE NAV COUNT` across both files, then re-sync both comments to the actual array length in the same change. Do not record the current count here — read it from the array.
