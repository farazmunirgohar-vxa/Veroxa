# Client Portal Full SaaS Foundation Design

Status: Design and guardrail prep only.  
Runtime state: Veroxa remains pre-live / review-mode.

This is the control document for the next Client Portal Full SaaS Foundation era. It does not enable production wiring. No migrations are created in this task. No production auth is enabled in this task. No storage uploads are enabled in this task. No live AI, live integrations, payments, connector execution, or production persistence are enabled in this task. The next implementation phase must still be RR-approved before runtime changes.

Veroxa's public positioning remains: “We help restaurants become easier to find, easier to trust, and easier to choose.” Internal opportunity targets must remain internal planning language only and must never become a public/client-facing guarantee.

## 1. Account model

### Proposed `restaurants` entity

Purpose: the restaurant/business being served, independent from any person who can log in.

Proposed fields:

- `id`
- `name`
- `slug`
- `legal_name`
- `primary_location_name`
- `address_line_1`
- `address_line_2`
- `city`
- `state`
- `postal_code`
- `timezone`
- `phone`
- `website_url`
- `google_business_profile_url`
- `instagram_url`
- `facebook_url`
- `tiktok_url`
- `menu_url`
- `ordering_url`
- `cuisine_type`
- `status`
- `created_at`
- `updated_at`

Status values:

- `demo`
- `prospect`
- `onboarding`
- `active`
- `paused`
- `canceled`
- `inactive`
- `archived`

### Proposed `restaurant_profiles` entity

Purpose: marketing-relevant profile, business-truth, and strategy information tied to a restaurant account.

Proposed fields:

- `restaurant_id`
- `best_sellers`
- `customer_types`
- `busy_days`
- `busy_times`
- `preferred_posting_days`
- `preferred_posting_times`
- `brand_voice_notes`
- `media_guidance_notes`
- `offers_notes`
- `catering_notes`
- `business_truth_notes`
- `client_confirmed_at`
- `created_at`
- `updated_at`

### Account model rules

- Restaurant account identity must be separate from client user identity.
- Every restaurant-owned record must be scoped by `restaurant_id` before production persistence is enabled.
- Real client account data must never be mixed with demo/sample data.
- Demo restaurants must remain clearly separate through status, seed source, and data-mode boundaries.
- Business-truth fields such as hours, offers, pricing, catering, dietary claims, and menu facts require client confirmation before public/customer-visible action.
- Do not create actual database migrations from this design until a later RR-approved runtime phase.

## 2. Client/team user model

### Proposed `users` entity

Purpose: authenticated person.

Proposed fields:

- `id`
- `email`
- `full_name`
- `phone`
- `created_at`
- `updated_at`

### Proposed `memberships` entity

Purpose: connect users to restaurants and roles.

Proposed fields:

- `id`
- `user_id`
- `restaurant_id`
- `role`
- `status`
- `invited_at`
- `accepted_at`
- `created_at`
- `updated_at`

Role values:

- `client_admin`
- `client_member`
- `team_member`

Membership status values:

- `invited`
- `active`
- `disabled`
- `removed`

### Active permission model

- Client users can access only their restaurant.
- Faraz/team can access operational data needed to review, approve, hold, and communicate work.
- Client can read own restaurant, media, requests, updates, and reports.
- Client can create own media submissions and requests.
- Client cannot see internal scoring, internal notes, raw AI/draft internals, other clients, or team-only queues.
- Team can view and manage operational records.
- Team actions must be logged.
- No Owner/Operator dashboards are active.
- Do not introduce active Owner/Operator roles.
- Future internal sub-roles may be documented later as future-only, not active runtime roles.
- Do not implement auth runtime from this design until an RR-approved phase.

## 3. Route/data boundary model

See `SAAS_ROUTE_DATA_BOUNDARY_PLAN.md` for the control plan.

Foundation rules:

- Public routes cannot access real client data, team data, or private account information.
- `/demo/client/*` remains sample/demo data only with no auth and no production writes.
- `/client/*` will require production auth in the future and must only show the authenticated client's own restaurant/account data.
- `/team/*` will require Faraz/team auth in the future and may show operational/internal records.
- `/client/*` and `/team/*` cannot use demo/sample fixtures once authenticated real mode is enabled.
- Client writes must be scoped to their restaurant and activity-logged.
- Team writes must be scoped to the affected restaurant or internal entity and activity-logged.
- Do not change route behavior in this design task.

## 4. RLS/security model

See `SAAS_RLS_SECURITY_MODEL.md` for proposed table-by-table policies.

Security principles:

- Client can only access own restaurant data.
- Team/Faraz can access operational data.
- Public routes cannot access real private records.
- Service role credentials must be server-only and must never be exposed to the browser.
- Demo/sample data must remain separate from real records.
- All sensitive writes require account scoping.
- All operational writes require activity logs.
- Do not add Supabase RLS policies, SQL migrations, or database tables in this task.

## 5. Storage/media lifecycle model

See `SAAS_MEDIA_STORAGE_LIFECYCLE.md` for the proposed storage and media lifecycle.

Foundation rules:

- Media belongs to one restaurant.
- Private uploaded files are not public assets.
- Raw, prepared, and final assets are distinct.
- No storage uploads are enabled yet.
- No public use happens before review and approval.
- Future editing output must remain tied to original media and activity logs.

## 6. Persistence model

See `SAAS_PERSISTENCE_MODEL.md` for proposed production entities.

Foundation rules:

- Core workflow records must be scoped to `restaurant_id`.
- Prepared actions enter review before any public/customer-visible execution.
- Connectors remain future-only and cannot execute live work from this design.
- Opportunity scores are team/internal only and are not public guarantees.
- No database tables, real data writes, or migrations are created yet.

## 7. Activity log model

See `SAAS_ACTIVITY_LOG_MODEL.md` for the activity log design.

Foundation rules:

- No future write should ship without activity logging.
- Team writes must log actor, entity, summary, and restaurant where applicable.
- Client writes must log actor and restaurant.
- System actions must be marked system.
- Client-visible log summaries must not leak sensitive internal metadata.
- Runtime activity logs are not implemented yet.

## 8. Billing-ready account-state model

See `SAAS_BILLING_READY_ACCOUNT_STATE.md` for the account-state design.

Foundation rules:

- Payments are not implemented yet.
- Manual billing is acceptable at first if documented.
- Plan state and account status must be tracked separately from restaurant identity.
- First-client discount eligibility must be auditable.
- Premium cannot become active without readiness assessment, client approval, and agreed ad budget.
- Ad spend remains separate from Veroxa subscription billing.
- No Stripe or payment integration is added in this task.

## 9. SaaS-era guardrails

The SaaS foundation readiness guardrail is design-focused. It should verify that the control docs exist, the nine foundation areas remain documented, and the hard restrictions remain visible before runtime implementation begins.

Guardrail expectations:

- Required SaaS foundation docs exist.
- The nine foundation areas are mentioned: account model, client/team user model, route/data boundary model, RLS/security model, storage/media lifecycle model, persistence model, activity log model, billing-ready account-state model, and SaaS-era guardrails.
- Docs state no production auth enabled yet, no storage uploads enabled yet, no migrations created yet, no live AI enabled yet, and no payments enabled yet.
- Public/client guarantee language remains blocked.
- `/client/*` and `/team/*` cannot use demo/sample fixtures once authenticated real mode is enabled.
- No future write should ship without activity logging.

## Future AI/connectors safety plan

- Live AI calls are not enabled yet.
- Google, Meta, TikTok, publishing, CRM, and payment connectors are not enabled yet.
- Future AI/connectors may only prepare or execute work after explicit RR approval, account scoping, activity logging, and Faraz approval gates are in place.
- Public/customer-visible actions require Faraz approval.
- Business-truth changes require client confirmation before approval/execution.
- Connector attempts, successes, and failures must be activity-logged.
- Service credentials must be server-only and never available to browser code.

## 2026-06-03 pricing/profit-fit alignment

- Active public pricing is Starter $295/month, Growth $495/month, and Premium $995/month.
- Growth is the main recommended package for strong-fit restaurants; Starter is the low-friction entry plan; Premium is selective and readiness-gated.
- Premium requires readiness assessment, client approval, and an agreed ad budget; ad spend is separate.
- Profit Fit Layer is internal/team-only and uses `requiredDailyOrders = monthlyFee / netMargin / averageTicket / 30` with conservative defaults of $15 average ticket and 5% net margin.
- Online-influenced orders/actions include online orders, phone/order clicks, direction/address clicks that become visits, menu/order-link clicks, Google profile actions, customer mentions, social content-driven visits, and repeat-customer attention.
- Public/client surfaces must not promise orders, profit, ROI, customers, revenue, rankings, or exact order targets.
- This update does not mark production auth, migrations, storage, live AI, connectors, payments, or runtime SaaS wiring as built.
## Profit validation and online-influenced action layer (internal only)

Veroxa sells online presence publicly, but internally validates whether the work is becoming cost-justifiable through profitable online-influenced orders/actions. This is an internal operating model, not public/client-facing guarantee language.

- Starter internal 2-month proof standard: 20 online-influenced actions/day for right-fit restaurants.
- 2–3 months: service delivery plus cost justification through tracking setup, Google/Maps cleanup, best sellers, and order/contact paths.
- 6–9 months: profit progress should be visible through careful signal review, not service delivery volume alone.
- 12 months: online presence should be reviewed as a meaningful order channel when attribution confidence is strong enough.
- Tracking hierarchy: business outcome signals, conversion/action signals, attention signals, engagement signals, and execution signals.
- Attribution confidence must stay explicit: confirmed, strong signal, directional, owner reported, or unknown.
- Break-even progress and exact proof math are internal only and must not appear as public/client guarantees.

No runtime SaaS implementation is added by this layer: no production auth, database migrations, storage uploads, live AI, connectors, payments, or real client data writes.
