# Legacy Veroxa Vite Application Archive

Status: retained as recoverable historical source; archived from active development on 2026-07-14.

The Vite application in this directory is not the canonical production application, a deployment target, or a rollback authority. PR #148 at `165ff82ab46b0a0985605ffcfb6efa687982eca5` is the verified deployed application release, delivered through ChatGPT Sites version 14. Current product work belongs in `artifacts/veroxa-sites` and must follow the active Veroxa source-of-truth documents.

This directory remains in Git history for reference and recovery. It is excluded from the root pnpm workspace, root typecheck/build, and direct GitHub CI E2E paths. Historical static guardrails may still read it as regression evidence. Do not resume feature development here without an explicit product-direction decision and a reviewed reactivation plan.

The frozen runtime scope contains 670 files across `src`, `public`, `e2e`, and the root Vite configuration, bound with the path-null-content-null SHA-256 `34c9133b9e672f9396357cbb7ba1fa46d7d2f3c5d513548fde9e31c32f566a49`. Current documentation is intentionally outside that archive hash. Any runtime hash change requires an explicit reactivation decision or a separately reviewed archive correction.

The documentation under `artifacts/veroxa/docs` remains active where identified by `ACTIVE_DOCS_INDEX.md`; archiving the Vite runtime does not archive those governing documents.

Runtime AI, Momo/client contact or provisioning, owner-confirmed truth, media rights, external providers, publishing, billing, activation, and incremental spend remain disabled. The root Vercel shutdown sentinel must remain unchanged until the external Git integration is independently verified disconnected.
