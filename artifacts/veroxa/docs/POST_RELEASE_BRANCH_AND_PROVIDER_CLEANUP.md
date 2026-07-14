# Post-release branch and provider cleanup

Status reviewed: 2026-07-14.

This record keeps cleanup truthful after the PR #148 production reconciliation. It does not authorize product activation, Momo contact, Client provisioning, provider connection, publishing, or spend.

## GitHub branches

The review found 37 remote branch refs including `main`, leaving 36 non-main branches:

- 16 branches correspond to merged pull requests and are deletion candidates after repository-owner review.
- `docs/lock-momo-founding-pilot-onboarding-direction` belonged to closed, superseded PR #147 and is a deletion candidate.
- Two branches belonged to closed, unmerged PRs #121 and #122 and require an owner decision before deletion.
- Two Codex branches have no pull request: one is fully behind `main`; one has two divergent commits and requires content review.
- 15 `diagnostic/vercel-*` branches are obsolete diagnostic candidates but diverged history must not be discarded without repository-owner review.

The connected GitHub surface does not provide branch deletion. No branch was repointed or deleted as a substitute. `branchDeletionAllowed` therefore remains false in the release records until a branch-delete capability is available and the applicable owner review is complete.

## Legacy Vite application

`artifacts/veroxa` is retained as recoverable history but archived from active development. ChatGPT Sites under `artifacts/veroxa-sites` is the only canonical deployable application. The legacy source is not deleted because historical controls and evidence still reference it.

## Vercel shutdown boundary

The legacy Vercel Git integration cannot be inspected or disconnected through the connected tools. `vercel.json` remains the required inert shutdown sentinel. It must not be removed until the external Vercel Git integration is independently disconnected and that state is verified.

## Remaining safe actions

1. Delete reviewed branch candidates when a supported branch-delete capability is available.
2. Inspect the two no-PR Codex branches and the two closed/unmerged PR branches before deciding whether to preserve or delete them.
3. Disconnect the external Vercel Git integration through an authorized Vercel administration surface.
4. Verify the disconnection, then separately review removal of the shutdown sentinel.
