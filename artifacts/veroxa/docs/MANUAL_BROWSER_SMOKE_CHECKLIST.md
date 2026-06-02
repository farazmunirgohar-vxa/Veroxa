# Veroxa Manual Browser Smoke Checklist

Run this checklist after each meaningful build or before a handoff that changes
routes, guards, portal copy, or product-facing documentation.

## Before Testing

- Pull latest main.
- Install dependencies if needed.
- Run typecheck/verify if testing locally.
- Confirm no production secrets are needed for demo/review-mode QA.

## Public routes

- `/`
- `/services`
- `/pricing`
- `/free-audit`
- `/login`
- `/demo`
- `/guided-demo`
- `/upload`

## Public Route Checks

- Loads without crash.
- Header/nav looks correct.
- No stale pricing.
- No fake guarantees.
- No hidden live integration claims.

## Public Client Demo routes

These routes should remain public, sample-data-only, and separate from real
portal routes:

- `/demo/client/dashboard`
- `/demo/client/media`
- `/demo/client/updates`
- `/demo/client/requests`
- `/demo/client/reports`

## Public Client Demo Checks

- Loads without login.
- Shows sample/demo labeling.
- Sidebar stays inside `/demo/client/*`.
- Client-safe wording.
- No backend/AI/internal terms.
- No fake live upload/publishing claims.

## Guarded Client Portal routes

Check while logged out. Each route should show the login/account guard rather
than a live client portal:

- logged-out `/client/dashboard`
- logged-out `/client/media`
- logged-out `/client/updates`
- logged-out `/client/requests`
- logged-out `/client/reports`

## Guarded Client Portal Checks

- Logged-out route shows login/account guard.
- Does not leak real portal data.
- Does not redirect to demo incorrectly.
- Does not imply production auth.

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

## Guarded Team Portal Checks

- Logged-out route shows team login guard.
- No Owner/Operator language.
- No live AI/publishing/storage claims.
- Team view feels internal and action-focused.

## Mobile QA

- Public Website.
- Client Demo.
- Client Portal.
- Team Portal.
- Team Dashboard Today View.

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

## Pass/Fail Table

| Route | Desktop | Mobile | Notes | Pass/Fail |
| ----- | ------- | ------ | ----- | --------- |
