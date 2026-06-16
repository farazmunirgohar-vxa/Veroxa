# Veroxa Launch Simplification Source of Truth


## 2026-06-15 — PR 100 RR patch: password recovery and active workspace enforcement

- Password reset completion was added/prepared for real-auth mode: reset email request remains client-safe, recovery links can show a set-new-password form, password mismatch is handled safely, and successful updates return the user to normal sign-in.
- Client real-auth access now requires an active profile, active restaurant membership, and an active linked restaurant workspace; missing, pending, disabled, or unsupported restaurant workspace states are denied.
- `AUTH_MODE` remains `placeholder`, `/api/pilot-access` remains the active safe pilot path, and the Momo owner walkthrough remains blocked until full Live Automation V1 is built and approved.
- No PR 101+ scope was added: no media uploads, storage, messages, profile correction persistence, activity log implementation, AI runtime calls, reports from real activity, integrations, publishing, payments, cron jobs, webhooks, or background jobs.

## 2026-06-15 — PR 100 Supabase Auth Foundation

- PR 100 added the Supabase Auth Foundation for Live Automation V1 behind the existing auth mode switch.
- `AUTH_MODE` remains `placeholder`; the current `/api/pilot-access` Momo House San Antonio and Team Faraz pilot login path remains the active safe access path.
- Real-auth readiness now includes active-only `user_profiles` validation, client/team role separation, active restaurant membership requirements for client users, password-reset preparation, and safe session loading behavior.
- Still not live: production auth activation, live database/data wiring, media uploads, storage buckets, messages, profile correction persistence, activity logs, AI runtime calls, generated reports from real activity, Google/Meta integrations, payments, publishing, webhooks, cron jobs, or background jobs.
- The Momo owner walkthrough remains blocked until full Live Automation V1 is built and approved.

## 2026-06-14 — PR 99 Live Automation V1 architecture only

- PR 99 added `LIVE_AUTOMATION_V1_ARCHITECTURE.md` as the source-of-truth architecture and schema design for Live Automation V1.
- This is architecture/design only: no live auth, Supabase migrations, database writes, storage bucket code, file upload behavior, real messaging behavior, live AI calls, Meta/Google APIs, payments, publishing, cron/background jobs, webhooks, or live customer-visible automation were added.
- The Momo owner walkthrough remains blocked until Live Automation V1 is built and approved through the future PR 100–PR 109 sequence.
- Current technical truth remains: `AUTH_MODE` is `placeholder`; pilot access is deterministic/manual; Momo Client Portal is polished but seeded/static; Team Portal is not yet Live Automation V1.

## 2026-06-14 — Automation-first pivot

- Faraz’s newest locked direction is automation-first before any Momo owner walkthrough.
- CP-V1 client portal is polished for the owner-facing Home, Media, Messages, Reports, Connections, and Profile shape.
- Profile is polished as the owner-editable business-truth surface where corrections should become Pending Veroxa Review rather than publish automatically.
- `AUTH_MODE` is still `placeholder`.
- Live data, production auth, storage uploads, messages, media handling, report generation, and live AI are not connected yet.
- Therefore the Momo owner walkthrough is blocked until **Live Automation V1** is built and approved.
- Older manual-first walkthrough docs remain historical context for current code limitations and safety language, but they are stale for the current Momo execution path unless Faraz explicitly re-approves manual-first.
- This status update is docs/source-of-truth alignment only: no production auth, database migrations, storage uploads, live AI calls, Google/Meta APIs, payments, publishing, or code behavior changes were added.

## 2026-06-07 — PR #82 Audit matcher safety and real-pilot onboarding polish

- PR #82 strengthened audit matcher safety after PR #81: state-only matches no longer count as city/state matched, and city/state conflicts reduce confidence.
- City mismatch now prevents confident exact audit-to-onboarding prefill unless strong identity proof exists: exact phone, exact domain, exact/strong address, or exact platform/domain link.
- Momo House San Antonio remains the first internal unpaid cooperation pilot; Team Faraz sees match reasons, location safety notes, owner verification gaps, missing fields, access blockers, and manual Google visibility readiness.
- Active portal experiences remain only Client Portal and Team/Internal Admin Portal. Retired demo routes remain disabled. Owner, Operator, Super Admin, generic Admin, and Execution portals remain parked/blocked.
- No live auth, database writes, storage uploads, live AI/OpenAI calls, Google/GBP or social connectors, payments, webhooks, cron/background jobs, or automated customer-visible publishing were added; `AUTH_MODE` remains `placeholder`.

## 2026-06-06 — Final pre-client polish completed, no live systems

- Final pre-client polish completed for visual QA, docs authority cleanup, real-auth readiness audit, production preview-login checklist, and manual launch usability.
- Active docs authority is clarified: `ACTIVE_DOCS_INDEX.md` is the highest-level current docs index, and older current-looking docs must not override it.
- Real auth readiness was audited in `REAL_AUTH_READINESS_AUDIT.md`, but real auth was not activated; `AUTH_MODE` remains `placeholder`.
- Production preview-login guidance was added in `PRODUCTION_PREVIEW_LOGIN_CHECKLIST.md`, including the custom-domain expectation to disable public preview fallback login.
- Manual launch docs are indexed in `FIRST_CLIENT_MANUAL_LAUNCH_INDEX.md` for Faraz and future execution workers.
- Client/public/team copy and small mobile/responsive spacing were polished while keeping demo routes clearly sample/QA and real client routes in safe review/empty states.
- No production auth, Supabase migrations, database writes, storage uploads, live AI/OpenAI calls, Google/Meta/Yelp/TikTok connectors, payments, webhooks, cron/background jobs, or automated publishing were added.
- Next recommended step: owner visual review on Vercel preview, then first manual pilot/client walkthrough, then real-auth readiness PR only after the manual flow is approved.

## 2026-06-06 — PR #77 Manual First-Client Launch Pack completed, no live systems

- PR #77 completed the Manual First-Client Launch Pack for preview/manual first-client operations.
- Real-route zero metrics were added so authenticated/client-safe routes avoid demo metric leakage while live account data is still being prepared.
- Preview login hardening was completed and `AUTH_MODE` remains `placeholder`.
- SSRF scanner containment was completed for local/private/metadata/IPv6 redirect safety boundaries.
- Route/auth/data-boundary QA was completed for public, demo, client, and team route separation.
- No production auth, Supabase migrations, database writes, storage uploads, live AI, connectors, payments, webhooks, cron/background jobs, or automated publishing were added.
- Next recommended build: post-PR77 active-doc alignment, CI E2E wiring, scanner safety tests, and future live-data guardrails before any RR-approved live-system planning.

## 2026-06-05 — Final trim before AI + automation readiness

- PR #72 fixed preview-login safety, enlarged the centered public Veroxa header, removed client-facing technical wording, cleaned minor copy/code debt, and strengthened guardrails.
- This PR is the final trim before AI/automation readiness: homepage hero typography, hero pill copy, hidden marker cleanup, route inventory hygiene, client media/client portal copy, Team deferral clarity, and AI/automation boundary documentation.
- Veroxa remains preview/manual/pre-live. No paid/live systems were added: no production auth, database writes, storage uploads, payments, platform connectors, webhooks, cron jobs, background jobs, live AI, or automated customer-visible execution.
- The next build is an AI/automation readiness blueprint, not live AI activation.
- After the 80% mark, Faraz chooses the A-Z review route before paid systems are connected.


## 2026-06-04 — 90% pre-paid OS final alignment

- Final public launch offer is still **Complete Online Presence — $495/month** with weekly updates, monthly online presence report, website alignment/refinement if access is provided, and portal request response/review/answer within 24 hours.
- **Yelp is coming soon / not included at launch**; TikTok, Reels/video content, ads management, daily posting, automated publishing, and live integrations are also coming soon / not included.
- Add-ons are **new basic website +$95** and **missing Facebook/Instagram social profile creation +$45/profile**. Yelp setup is not a launch add-on.
- First-client loyalty discount policy: **20% off for the first 12 months, then kept only while continuously active. If the client leaves and returns later, the discount no longer applies.** This is policy/copy only, not checkout/payment logic.
- Internal-only value proof: **$9,900/month** is the minimum online-influenced sales channel value baseline for a $495 client at 5% margin; healthy is $15k–$25k/month, strong is $25k+/month with clearer action signals. This is not extra new sales and must not appear on public/client pages.
- Team Portal complexity remains deferred. Current priority is public/client/onboarding/reporting/proof/request-facing 90% readiness before paid systems.
- No live auth, storage, AI, API writes, production database work, payments, publishing connectors, webhooks, cron jobs, or automated customer-visible execution were added; `AUTH_MODE` remains `placeholder`.
- Next recommended build stage: Client-facing weekly update + monthly report polish; backend SOP docs for Pakistan execution; audit-to-onboarding flow polish; still no live systems yet.
## 2026-06-04 — Final launch offer lock / Post-PR67 alignment

- One active public offer: **Complete Online Presence — $495/month**. Starter, Growth, Premium, Local Presence, Full Presence, old Complete Presence, $295, and $995 language are historical/internal only and must not be shown as active public pricing.
- Included at launch: Google Business Profile support, Google Maps/local visibility basics, Local SEO/search visibility basics, existing website alignment/refinement if access is provided, Facebook support, Instagram support, picture-based content support, up to 3 posts/updates per week (media dependent), weekly updates, monthly online presence report, Client Portal access, portal request response/review/answer within 24 hours, and Veroxa team review before anything goes live.
- **Yelp is coming soon / not included at launch**, along with TikTok, Reels/video content, ads management, daily posting, automated publishing, and live integrations.
- Add-ons: **new basic website +$95** and **missing social profile creation +$45/profile** for Facebook or Instagram. Yelp setup is coming soon, not a launch add-on.
- First-client loyalty discount policy: **20% off for the first 12 months, then kept only while continuously active. If the client leaves and returns later, the discount no longer applies.** This is not checkout/payment logic and must not confuse the main $495/month public offer.
- Website alignment/refinement included scope: name/address/phone, hours, menu/order/contact links, Google/Facebook/Instagram links, simple description refinement, basic local SEO wording, and small content corrections if access is provided. New basic website add-on scope is a simple mobile-friendly restaurant website with NAP/hours, menu/order/contact links, Google/Facebook/Instagram links, basic local SEO wording, and best-seller/service highlights. Not included: custom-coded website, advanced design, hosting/domain/email troubleshooting, online ordering setup, speed optimization, plugin troubleshooting, advanced technical SEO, unlimited pages/edits.
- Onboarding expectation acknowledgement must say: “I understand Veroxa does not handle...” customer-service replies, comments, DMs, inboxes, refunds, complaints, order questions, full custom website development, hosting/domain/email troubleshooting, Yelp/TikTok/Reels/Ads yet, or guaranteed orders/revenue/rankings/profit/ROI/growth; and “I agree the restaurant is responsible for...” usable media, business info confirmation, hours/menu/prices confirmation, existing offer/promotion confirmation, access when needed, customer conversations, and understanding that 24-hour response means review/answer/next step, not guaranteed completion.
- Weekly update means what Veroxa worked on, what was posted/prepared, what is pending, what media is needed, what the client needs to confirm, and what is next. Monthly report remains the deeper proof/reporting layer.
- Advanced Team OS complexity is later. Current focus is public/client/onboarding/reporting/proof/request-facing 90% before paid systems. Team surfaces should remain stable and action-focused; do not add complex Team command-center features unless explicitly requested.
- No live auth/storage/AI/connectors/payments/API writes, publishing, webhooks, cron jobs, production database work, or automated customer-visible execution are added or allowed in this alignment. `AUTH_MODE` remains `placeholder`.


Status: Current as of 2026-06-04 for preview/manual/pre-live Veroxa.

## Locked launch model

Veroxa has one active public offer: **Complete Online Presence — $495/month**.

Public positioning: Veroxa manages your restaurant's complete online presence across Google, Maps/local visibility, website alignment, Facebook, and Instagram — then tracks what is working, what needs improvement, and what media helps your restaurant become easier to find, easier to trust, and easier to choose.

Public flow is **Home -> Audit -> Login**. Do not promote public demo routes, Client Demo CTAs, guided demo CTAs, or a public Services/Pricing split as the main sales flow. `/services` and `/pricing` may remain as hidden compatibility routes only and must not show multi-package cards.

## Included in Complete Online Presence

- Google Business Profile support
- Google Maps/local visibility basics
- Local SEO/search visibility basics
- Existing website alignment/refinement if access is provided
- Business info consistency across Google/website/socials
- Facebook support
- Instagram support
- Picture-based content support
- Up to 3 total posts/updates per week, media dependent
- Simple captions
- Basic content organization
- Media guidance/reminders
- Client Portal access
- Portal request response/review/answer within 24 hours
- Monthly online presence report
- Veroxa team review before anything goes live

## Coming soon / not included at launch

Yelp, TikTok support, Reels/video content support, ads management, daily posting, automated publishing, live integrations, and ads creative are coming soon / not included in the current launch package.

## Not included

Veroxa does not handle comments, DMs, inboxes, customer-service replies, refunds, complaints, order questions, full website redesign/development, custom website builds beyond the +$95 basic website add-on, hosting/domain/email troubleshooting, plugin fixes, speed optimization, advanced technical SEO, paid ad spend, guaranteed orders/revenue/rankings/profit/ROI/customers/walk-ins/growth, or automated customer-visible execution.

## Historical/deprecated public plans

Starter, Growth, Premium, Local Presence, Full Presence, old Complete Presence, Google Optimization, Complete Plus Ads, and Ads Management Only are historical/deprecated/internal aliases only. They may remain in compatibility code, seed data, or migration docs with clear retired language, but they are not active public offers. Old active public prices $295 and $995 must not appear as current public pricing.

## Portal request and SLA model

Portal requests are the normal routine channel. Veroxa responds/reviews/answers within 24 hours with an answer, review status, client-input request, coming-soon note, not-included note, not-supported note, completion note, or manual-work scheduling note. This is not a promise that all work is completed within 24 hours. Routine texts/calls are not the normal service channel.

Included request types: google_profile_update, maps_visibility_update, seo_search_visibility_basics, website_alignment, seo_search_visibility_basics, facebook_picture_post, instagram_picture_post, picture_caption, media_guidance, monthly_report, up_to_3_posts_per_week_media_dependent, portal_request_review, business_info_correction, and link_menu_contact_update.

Coming soon / not included requests: yelp_profile_alignment, tiktok_request, reels_request, video_content_request, ad_management_request, ad_planning_request, daily_posting_request, and advanced_campaign_request.

Blocked/not supported requests: customer_service_request, dm_or_comment_reply_request, refund_or_complaint_request, order_question_request, full_website_redesign, custom_website_build, and technical_hosting_or_domain_support.

No-offer rule: Veroxa does not recommend or invent discounts, BOGO offers, price cuts, lower prices, or new promotions. If a restaurant already has an offer/promotion, Veroxa may ask the client to confirm exact details before preparing public copy.

## Website alignment scope

Included: business name/address/phone alignment, hours alignment, menu/order/reservation link alignment, Google/Facebook/Instagram link alignment, simple restaurant description refinement, best-seller/menu visibility alignment, basic local SEO wording, basic photo/menu freshness suggestions, and small website content corrections if access is provided.

Not included: full website redesign, custom development beyond the +$95 new basic website add-on, online ordering setup, hosting/domain/email troubleshooting, plugin fixes, speed optimization, advanced technical SEO, unlimited website edits, and emergency website support.

Client-safe wording: "Website alignment/refinement is included when access is provided. A new basic website is available as a +$95 add-on; full custom website development is not included."

## Yelp coming-soon scope

Yelp is coming soon and not included at launch; future Yelp coming-soon scope may include profile alignment/refinement, business info consistency, photos/profile freshness where appropriate, reputation visibility snapshot, review theme awareness, and Yelp link/website/menu consistency. Do not promise Yelp ranking improvements, review removal, review suppression, fake review growth, or Yelp ads results. Prefer "Yelp profile freshness update," "Yelp photo/profile update," or "Yelp business profile alignment" instead of "Yelp post."

## Audit model

The Audit page is the Restaurant Online Presence Audit. It reviews Google Business Profile, Google Maps/local visibility, Yelp coming-soon/future review area, website alignment, local SEO/search visibility basics, Facebook, Instagram, menu/order/contact link clarity, media quality/presence, online presence gaps, and whether Complete Online Presence — $495/month is a fit. It must recommend one of: Complete Online Presence — $495/month, Not ready / needs manual review, or Not a fit yet. It must not claim live Google/Facebook/Instagram scans, fake API results, ranking guarantees, revenue promises, or multi-tier recommendations.

Team Audit Leads should show Complete Online Presence fit, not fit/manual review, missing access/info, media quality, website alignment need, Google status and Yelp coming-soon status, and next team action. No multi-tier recommendation.

## Onboarding model

Restaurant Onboarding collects restaurant business info, Google Business Profile link/access status, Google Maps link, Yelp future review status, website link/access status, Facebook link/access status, Instagram link/access status, menu/order/reservation links, best sellers, food categories, media supply, business-truth confirmations, website alignment permissions, profile access checklist, and weekly update expectations, monthly report baseline inputs. Public-facing multi-package onboarding logic is retired; old benchmark scenarios are historical/internal/demo only. Yelp/TikTok/Reels/Ads may be mentioned only as coming soon.

## Media intelligence and draft logic

For current launch, image/photo media creates or represents three platform-specific draft directions: Facebook draft, Instagram draft, and Google Business Profile / Google update draft. Video/reel media creates or represents four draft directions: Facebook draft, Instagram/Reels draft, Google Business Profile / Google update draft, and TikTok draft. TikTok/Reels draft readiness is team/internal preview only and must be marked coming soon/client-not-included. Do not use single-platform-only fit language such as "good for Facebook but not Instagram" or "only good for Facebook."

Media intelligence may evaluate clarity, lighting, food visibility, duplicate/reuse risk, whether confirmation is needed, usability, caption angle, what media is working/not working, and what to send next. Client pages must not show raw scores.

## Value proof, reach, and reporting

Value Proof / Restaurant Reach tracks Google/search reach, Google Maps reach, Facebook reach, Instagram reach, website/menu/order link clarity, calls, direction clicks, website clicks, menu/order clicks, profile actions, customer mentions, owner-reported signals, media working/not-working, and content consistency.

Client-safe reporting covers what Veroxa handled, Google/Maps/website alignment progress; Yelp stays coming soon, Facebook/Instagram posting/content progress, media used, what media worked, what media did not work, what media is needed next, reach/action signals, limitations, and next month focus. Report language: "This is what worked, what needs improvement, and what Veroxa needs next." No fake metrics, promises, raw internal scores, invented discounts/offers, or public/client profit math.

Team-only value proof may include internal cost/value status, attribution confidence, proof strength, risk of under-proving value, and Profit Fit Layer review. The internal break-even formula `requiredDailyOrders = monthlyFee / netMargin / averageTicket / 30`, break-even progress, net margin, and exact proof math are internal only and not public/client-facing guarantee language.

## Safety and live-system guardrails

No production auth, Supabase migrations, RLS, production database wiring, real client data writes, real storage uploads, live AI/OpenAI runtime calls, Google/Meta/TikTok/YouTube APIs, publishing connectors, payments, Stripe, checkout, subscriptions, invoices, billing, webhooks, cron jobs, background jobs, automated customer-visible execution, Owner/Operator/Super Admin/generic Admin/Execution dashboards, or routine text/call workflow were added. `AUTH_MODE` remains `placeholder`; production/custom-domain login now uses Real Login V1 pilot portal access language and deterministic/manual account records for Momo House San Antonio and Team Faraz only.

Veroxa should be built to about 90% complete in preview/manual/pre-live mode before paying for outside/live systems. Future paid systems should plug into prepared interfaces, not be used while designing the product.

## SaaS foundation continuity

SaasDataMode, RepositoryBundle, ActivityLogRepository, assertNoDemoFixturesInAuthenticatedMode, ProfitValidationSnapshotRecord, placeholder repository, demo repository, and future production adapter requires RR approval remain the SaaS boundary markers. Real client routes must not show demo seed data unless they are public demo routes.

## 2026-06-04 — Post-PR67 alignment cleanup

- PR aligns the latest one-offer launch plan: Complete Online Presence — $495/month.
- Yelp moved to coming soon / not included at launch.
- Weekly updates added alongside the monthly online presence report.
- Add-ons added: new basic website +$95 and missing social profile creation +$45/profile.
- First-client loyalty policy added: 20% off for first 12 months, then kept only while continuously active; returning clients do not retain it after leaving.
- Client onboarding expectation acknowledgement added in preview/manual mode.
- Advanced Team OS complexity deferred; Team surfaces remain stable/action-focused.
- No live production auth, storage, AI, connectors, payments, publishing, webhooks, cron jobs, database writes, or automated customer-visible execution added.

## 2026-06-05 — Mega Build: 90% Pre-Paid Manual OS readiness

This build adds the 90% pre-paid/manual operating layer while keeping Veroxa preview/manual/pre-live only.

### Completed foundations

- Client readiness domain for onboarding, media supply, request channel, weekly updates, monthly reports, website alignment, Google/Maps/local visibility, Facebook/Instagram content, add-ons, missing confirmations, and account activation state.
- CP-V1 Client Portal alignment for Momo House: primary navigation is Home, Media, Messages, Reports, Connections, and Profile.
- Home answers what Veroxa has done, what Veroxa needs from the owner, and what Veroxa is currently doing.
- Media includes specific media needed, honest manual/pre-live intake structure, and one continuous media feed with Veroxa notes.
- Messages replaces owner-facing Requests as an inbox-style communication model. Hidden compatibility aliases may remain guarded, but Requests is not primary client navigation.
- Reports contains both Weekly Updates and Monthly Reports; Weekly Updates are no longer a separate primary client nav item.
- Connections V1 tracks only Meta Business Suite and Google Business Profile statuses; no live account integrations or OAuth flows are added.
- Profile is the owner-editable business-truth page; edits become Pending Veroxa Review and never publish automatically.
- Onboarding expectation acknowledgement for what Veroxa does, what Veroxa does not handle, restaurant responsibilities, confirmations, 24-hour response meaning, no guarantees, add-ons, and coming-soon items.
- Add-on logic for new basic website +$95 and missing Facebook/Instagram profile creation +$45/profile; no checkout or payment logic.
- Client-safe value proof messaging and internal value proof baseline guardrails. Internal value proof remains $9,900/month minimum online-influenced sales channel value baseline at 5% margin and is not extra new sales.
- Media intelligence client-safe labels and guidance for best-seller photos, clearer photos, saved-for-later media, business confirmation, picture-based content, and video channels coming soon.
- Audit-to-onboarding and audit-to-first-client documentation.
- Backend SOP docs for operating principles, weekly update, monthly report, media review, website alignment, and portal request handling.
- First 5 client readiness plan.
- 90% pre-paid OS readiness map.
- Guardrails for SOP presence, client-safe proof math, discount confusion, one-offer launch alignment, and Team deferral.

### New/updated docs index

- `MEGA_BUILD_EXECUTION_PLAN.md`
- `VEROXA_90_PERCENT_PREPAID_OS_READINESS_MAP.md`
- `BACKEND_SOP_OPERATING_PRINCIPLES.md`
- `SOP_WEEKLY_UPDATE.md`
- `SOP_MONTHLY_REPORT.md`
- `SOP_MEDIA_REVIEW.md`
- `SOP_WEBSITE_ALIGNMENT.md`
- `SOP_PORTAL_REQUEST_HANDLING.md`
- `FIRST_5_CLIENT_READINESS_PLAN.md`
- `AUDIT_TO_FIRST_CLIENT_FLOW.md`
- `ADDON_NEW_BASIC_WEBSITE_SCOPE.md`
- `ADDON_SOCIAL_PROFILE_CREATION_SCOPE.md`
- `PRE_PAID_ACTIVATION_GATE.md`
- `PRICING_SOURCE_OF_TRUTH.md`
- `PACKAGE_BOUNDARY_AND_REQUEST_ENFORCEMENT.md`
- `VALUE_PROOF_AND_RESTAURANT_REACH_LAYER.md`
- `MEDIA_INTELLIGENCE_LAYER.md`

### No live systems

No production auth, database, storage upload, live AI/OpenAI call, Google/Meta/Yelp/TikTok integration, payment/checkout, publishing connector, webhook, cron/background job, or automated customer-visible execution was added. `AUTH_MODE` remains `placeholder`.

### Team complexity

Advanced Team OS remains deferred. Team stays supporting/action-focused; this build does not add Owner/Operator/Super Admin/generic Admin/Execution dashboards or complex Team command-center features.

### Next recommended build

Client-facing final visual polish, audit-to-onboarding polish, CI/QA guardrail hardening, and RR before any paid/live system planning.

## 2026-06-05 — Post-PR70 RR cleanup alignment

PR #70 built the 90% pre-paid/manual OS foundations for client readiness, weekly updates, monthly reports, launch add-ons, SOPs, readiness mapping, value-proof guardrails, and client portal readiness surfaces. This cleanup fixed RR issues around preview login, the public header, loaded weekly/monthly client data states, client dashboard setup/demo separation, old tier leakage in onboarding, request boundary counts, public/client polish, and guardrail coverage. Veroxa remains manual/pre-live: no production auth, storage, database writes, live AI, connectors, payments, webhooks, cron jobs, or automated customer-visible execution were added. Team complexity remains deferred and supporting/action-focused. The next big build should wait until this cleanup passes RR and should focus on a dormant live-system blueprint and post-launch-pack QA hardening, not paid/live systems yet.

## 2026-06-05 — PR72 hotfix/polish alignment

- Restricted fallback preview login to localhost, `127.0.0.1`, and Vercel preview deployments ending in `.vercel.app`; custom domains require explicit preview-login env opt-in or explicit preview credential env vars.
- Documented that `VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN=true` is required if a Veroxa custom domain needs temporary preview login for review, while `VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN=false` remains the hard fallback disable.
- Polished the public header so the centered Veroxa brand remains the only public header item and appears larger/premium.
- Removed client-facing technical wording from onboarding preview language and kept the meaning client-safe: no legal onboarding signature, no live platform access, nothing sent automatically, and nothing goes live without Veroxa team review.
- Cleaned minor duplicate copy and monthly report lookup code without changing reporting behavior.
- Strengthened guardrails against broad custom-domain preview fallback, public header regression, public/client technical wording, and `AUTH_MODE` drift.
- Veroxa remains preview/manual/pre-live. No paid/live systems were added, and Team Portal complexity was not expanded. The next big build remains the dormant live-system blueprint / post-launch-pack QA hardening.

## 2026-06-06 — AI readiness blueprint started, no live activation

- AI readiness blueprint work has started in [`AI_AUTOMATION_READINESS_BLUEPRINT.md`](./AI_AUTOMATION_READINESS_BLUEPRINT.md), alongside the existing boundary in [`AI_AUTOMATION_READINESS_BOUNDARY.md`](./AI_AUTOMATION_READINESS_BOUNDARY.md).
- Existing server-side AI draft code is inventoried in [`AI_SERVER_CODE_INVENTORY.md`](./AI_SERVER_CODE_INVENTORY.md) and remains protected by internal API access, gated by `VEROXA_ENABLE_AI_ROUTES`, and disabled unless explicitly enabled in a future approved activation build.
- This update adds dormant prompt contracts, review gates, client-visibility validation rules, planning seed examples, and guardrails only.
- No new live AI, OpenAI calls, live automations, production auth, database/storage writes, payments, connectors, webhooks, cron jobs, background jobs, or automated customer-visible execution were added.
- Future live AI requires production auth, database/storage architecture, logs, rollback plan, QA, guardrails, and RR approval.
- Faraz still chooses the A-Z review route after the 80% mark before paid systems are connected.

## 2026-06-06 — A–Z cleanup completed, no live systems

- A–Z review cleanup added the master [Veroxa OS System Map](./VEROXA_OS_SYSTEM_MAP.md) so future RR can start from one route/domain/guardrail overview.
- Demo/QA route policy was strengthened for `/demo`, `/guided-demo`, `/demo/client/*`, and `/upload`; public homepage/nav/footer still do not promote demo routes.
- Backend execution pack docs were added for daily workflow, weekly updates, monthly reports, request responses, and Faraz escalation.
- Client portal premium copy polish was completed without adding workflows, fake metrics, live data claims, or AI marketing.
- [AI Activation Prerequisites](./AI_ACTIVATION_PREREQUISITES.md) now documents what must exist before live AI can be enabled.
- No live systems were added: no production auth, database/storage, payments, connectors, webhooks, cron/background jobs, live AI, or automated customer-visible execution.
- Next recommended step: owner review of A–Z cleanup, then continue post-launch-pack QA and active-doc alignment before any paid/live system planning.

## 2026-06-06 — Final deletion/quarantine review

- Final deletion/quarantine review completed.
- No delete-now page files are confirmed.
- Parked/future/debug/AI draft pages are hard-quarantined and require owner approval, route inventory update, route surface map update, guardrail update, and RR before routing.
- Active demo/QA routes remain active, labeled, and guarded from public promotion.
- Route inventory now distinguishes active routes from demo aliases with `active_routed + demo_alias`.
- No live systems were added: no production auth, database/storage writes, live AI, payments, connectors, publishing, webhooks, cron jobs, background jobs, or automated customer-visible execution.
- Next recommended step: post-PR77 active-doc alignment, CI E2E wiring, scanner safety tests, future live-data guardrails, and RR before any paid/live system planning.


## 2026-06-07 — Real pilot mode lock

- Veroxa is moving from public demo/preview portal exposure into **real pilot pre-live/manual mode**.
- Public demo/preview portals are no longer part of the active live app surface; `/demo`, `/guided-demo`, `/upload`, and `/demo/client/*` must remain disabled from active routing.
- Active app portal experiences are only **Client Portal** and **Team/Internal Admin Portal**. Owner, Operator, Super Admin, generic Admin, and Execution portals remain parked/blocked.
- First real pilot client: **Momo House San Antonio**. Momo House is an internal unpaid cooperation pilot account for initial Veroxa improvement work, not a public pricing change.
- Internal operations identity: **Team Faraz**.
- Locked audit-to-onboarding workflow: public/initial audit → prefilled onboarding profile → owner verification → credential/platform connection → gap completion by owner + Veroxa team → final onboarding approval.
- Onboarding must show which fields were prefilled by Veroxa, need owner verification, are missing, were corrected by owner, or were completed by Veroxa.
- Safety remains pre-live/manual only: no production auth, database writes, storage uploads, live AI, connectors, payments, webhooks, cron, or automated customer-visible execution; `AUTH_MODE` remains `placeholder`.

## 2026-06-07 — Real Login V1 / pilot portal access

- `/login` now presents real portal wording: “Sign in to Veroxa” and “Access your Veroxa portal.”
- Preview/review login language and public preview credentials are removed from the production/custom-domain login experience.
- Active pilot account records are Momo House San Antonio for the Client Portal and Team Faraz for the Team/Internal Admin Portal.
- `AUTH_MODE` remains `placeholder`; this is deterministic/manual V1 pilot access, not secure production auth.
- Active portals remain Client and Team only; `/demo`, `/guided-demo`, `/upload`, and `/demo/client/*` remain retired.
- No live AI, storage uploads, integrations, payments, publishing, cron/background jobs, database writes, or customer-visible automation were added.

## 2026-06-15 — PR #101 Database Foundation for Live Automation V1

- Database Foundation added for Live Automation V1 with Supabase migration/schema, RLS baseline, indexes, updated-at triggers, and TypeScript contracts.
- Migration/schema/contracts added at `supabase/migrations/20260615010100_live_automation_v1_database_foundation.sql` and `artifacts/veroxa/src/domain/liveAutomation/`.
- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains the active safe pilot login path.
- No live portal DB wiring was added.
- No media uploads, messages runtime, profile correction runtime, activity log runtime, AI runtime, or report generation was added.
- Momo owner walkthrough remains blocked until full Live Automation V1 is built and approved.


## 2026-06-15 — PR #102 Media Upload + Storage Foundation

- PR #102 adds the Media Upload + Storage foundation for Live Automation V1 after the PR #100 auth foundation and PR #101 database foundation.
- A private `restaurant-media` storage bucket migration and conservative authenticated client/team storage policies were added.
- Upload validation, restaurant-scoped path generation, and media asset creation service code were added behind safe gates.
- The Client Media upload panel is gated by `AUTH_MODE === "real"`, active client session/restaurant access, configured Supabase, and `VITE_VEROXA_MEDIA_UPLOAD_ENABLED=true`; placeholder mode does not show active or fake upload controls.
- `AUTH_MODE` remains `placeholder`, and `/api/pilot-access` remains the active safe Momo/Team Faraz pilot access path.
- Uploaded media is for Veroxa review only; it is not published, posted, approved, live on Google, live on Instagram/Facebook, or part of a public campaign.
- No social publishing, AI runtime, reports, real messages, profile correction runtime, full activity log module, Google/Meta integration, payments, cron jobs, background jobs, or webhooks were added.
- Momo owner walkthrough remains blocked until full Live Automation V1 is built and approved.

## 2026-06-16 — PR #102 RR patch: storage path + media metadata security hardening

- Storage object policies were hardened to require the full restaurant/date/object UUID media path shape before client upload or client/team read access is allowed.
- Raw filename storage paths and arbitrary nested paths under a restaurant prefix are rejected by SQL helper/policy enforcement, not only by frontend code.
- `media_assets` client inserts now require validated media metadata at the DB/policy layer: safe private path, parsed restaurant match, `status = uploaded`, null public/review fields, allowed file type/MIME pairing, positive file size, and 25 MB image / 100 MB video limits.
- `AUTH_MODE` remains `placeholder`, `/api/pilot-access` remains active, and upload remains inactive in placeholder mode.
- Uploaded media remains received for Veroxa review only; it is not published, posted, approved, public, live on Google, live on Instagram/Facebook, or part of a marketing campaign.
- Momo owner walkthrough remains blocked until full Live Automation V1 is built and approved.

## 2026-06-16 — PR #104 Profile Corrections foundation

- Added the Live Automation V1 Profile Corrections foundation only.
- Client correction submission is gated behind real auth, authenticated client role, active restaurant/clientId, and `VITE_VEROXA_PROFILE_CORRECTIONS_ENABLED=true`. Placeholder mode remains honest and does not fake correction submission.
- Team Faraz can review correction requests when real auth and the explicit flag are active; approval updates internal Veroxa `restaurant_profile_fields` only.
- Profile corrections are not public/platform updates, and nothing publishes automatically.
- `AUTH_MODE` remains `placeholder`; `/api/pilot-access` remains active; Momo owner walkthrough remains blocked.
- Activity Log runtime, AI Drafting, Reports, Team Automation Control Center, integrations, publishing, payments, cron jobs, background jobs, and webhooks remain future PRs.

## 2026-06-16 — GitHub PR #104 Real Messages / Portal Threads foundation

- Profile Corrections already merged as GitHub PR #103.
- PR #104 adds gated real portal message helpers, Client Portal Messages real-auth composer/thread, Team `/team/messages` inbox/reply route, and Supabase RLS insert/status policies for `messages`.
- `AUTH_MODE` remains `placeholder`; `/api/pilot-access` remains active; real messages require `AUTH_MODE === "real"` and `VITE_VEROXA_MESSAGES_ENABLED=true`.
- Placeholder mode remains honest and does not fake sent messages, delivered state, replies, or persistence.
- Portal messages are not SMS, email automation, DMs, comments, customer-service inbox handling, external chat, Activity Log runtime, AI runtime, integrations, publishing, payments, webhooks, cron jobs, or background jobs.
- Activity Log remains PR #105, AI Drafting remains PR #106, and Momo owner walkthrough remains blocked.
