# Veroxa Manual Browser Smoke Checklist

Run this checklist after each meaningful build or before a handoff that changes
routes, guards, portal copy, or product-facing documentation.

## Public routes

- `/`
- `/services`
- `/pricing`
- `/free-audit`
- `/login`
- `/demo`

## Public Client Demo routes

These routes should remain public, sample-data-only, and separate from real
portal routes:

- `/demo/client/dashboard`
- `/demo/client/media`
- `/demo/client/updates`
- `/demo/client/requests`
- `/demo/client/reports`

## Guarded Client Portal routes

Check while logged out. Each route should show the login/account guard rather
than a live client portal:

- logged-out `/client/dashboard`
- logged-out `/client/media`
- logged-out `/client/updates`
- logged-out `/client/requests`
- logged-out `/client/reports`

## Guarded Team Portal routes

Check while logged out. Each route should show the team login guard rather than
internal work surfaces:

- logged-out `/team/dashboard`
- logged-out `/team/upload-inbox`
- logged-out `/team/work-queue`
- logged-out `/team/direction-queue`
- logged-out `/team/report-queue`
- logged-out `/team/audit-leads`
- logged-out `/team/approval-queue`
- logged-out `/team/visibility-audit`
- logged-out `/team/first-client-readiness`

## Expectations

- Public demo routes should not require login.
- `/client/*` should show a login/account guard when logged out.
- `/team/*` should show a login guard when logged out.
- Demo sidebar navigation should stay inside `/demo/client/*`.
- The Client Portal should feel simple, premium, calm, and client-safe.
- The Team Portal should feel internal, action-focused, and calm — not like an
  AI lab, backend console, or strategy overload screen.
- No page should imply live uploads, live publishing, live AI, live payments, or
  real client data unless that capability is explicitly connected later.
