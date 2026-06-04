# Restaurant Onboarding OS V1

## Purpose

Restaurant Onboarding OS V1 gives Veroxa a preview/manual way to move a restaurant from interested or signed into a structured first-week setup flow before any paid/live systems are activated.

It answers what Veroxa needs from the restaurant, what media is missing, what platform links need review, what business details require confirmation, what first-week work Faraz should prepare, and what proof/value inputs should be collected early.

## What it does

- Creates a typed deterministic `restaurantOnboarding` domain.
- Provides five benchmark onboarding scenarios: Starter ready benchmark, Starter low-media benchmark, Growth media-ready benchmark, Growth incomplete-links benchmark, and Premium readiness benchmark.
- Builds checklist engines for business info, platform/profile links, media guidance, business-truth confirmation, first-week setup, proof inputs, package rules, onboarding status, and Team queue grouping.
- Adds a client-safe onboarding page for `/client/onboarding` and `/demo/client/onboarding`.
- Adds a Team onboarding queue for `/team/onboarding`.
- Adds light onboarding context to the Client Dashboard, Team Dashboard, Team Work Queue, First-Client Ops, First-Client Readiness, and Manual Execution Center.

## What it does not do

- No production auth.
- No database writes.
- No storage uploads.
- No live integrations.
- No payments.
- No auto-posting.
- No live AI runtime calls.
- No platform publishing.
- No real client data.
- No offer invention or discount recommendation.
- No ROI, profit, order, ranking, revenue, customer, or walk-in guarantees.

## Client onboarding model

The Client Portal shows a calm setup checklist:

- Business info.
- Platform links.
- Media.
- Business details to confirm.
- First-week setup.

Client wording stays simple: Veroxa asks for missing information, missing media, missing links, and details to confirm. Client pages do not expose internal math, internal priority, or technical implementation terms.

## Team onboarding model

The Team Portal shows an action-focused manual queue:

- Needs business info.
- Needs media.
- Needs platform links.
- Needs business-truth confirmation.
- Needs first-week setup.
- Ready for manual service.
- Blocked / paused.

The Team view can show blockers, warnings, ready signals, package rules, draft messages, proof input notes, and first-week manual tasks.

## Proof input model

Proof inputs are early value-context fields, not promises. They help Faraz understand which online actions matter most later:

- Average ticket optional.
- Current monthly customer goal optional.
- Main customer type.
- Most wanted action.
- Best sellers.
- Current weak points.
- Order/menu link availability.
- Current Google/social confidence.
- Owner-reported baseline notes.
- Whether tracking signals may be available later.

Proof inputs are used internally to understand value signals, not to promise ROI.

## Media guidance model

Media guidance requests clear current media without real storage upload behavior:

- Food photos.
- Best seller photos.
- Short food prep videos for Growth/Premium.
- Storefront photo.
- Menu photo/link.
- Staff/team optional.
- Dining room optional.
- Catering/large order optional.
- Seasonal item optional.
- Customer-safe ambience optional.

## Platform checklist

Platform checks are deterministic and local only:

- Google Business Profile.
- Google Maps.
- Website.
- Menu link.
- Order link.
- Reservation link.
- Catering link.
- Facebook.
- Instagram.
- TikTok for Growth/Premium.
- Premium ad readiness placeholder for Premium only.

There is no lookup, scraping, platform API call, or connector activation.

## Business-truth confirmation

Business-truth confirmation protects public accuracy before Veroxa prepares anything public:

- Hours.
- Holiday hours.
- Phone.
- Address.
- Menu items.
- Menu prices if mentioned.
- Existing offers/promotions only if the restaurant already provides them.
- Catering availability.
- Halal/organic/health claims.
- Ordering/reservation links.
- Ad budget acknowledgement for Premium.

If an existing offer is provided, the required language is: “Please confirm the exact offer, dates, terms, and pricing before Veroxa prepares anything public.”

## First-week setup

First-week setup remains manual and draft-only:

- Verify business info.
- Review Google/Maps presence.
- Collect first usable media batch.
- Identify best sellers to highlight.
- Prepare first picture-based content.
- Prepare Growth reels/TikTok path if applicable.
- Prepare Premium ad readiness review if applicable.
- Prepare client-safe first update.
- Prepare Team manual execution plan.
- Confirm business-truth details before public claims.

## No-offer-recommendation rule

Veroxa must not recommend discounts, BOGO offers, lower prices, or new promotions. If a restaurant already has an offer, Veroxa may ask the restaurant to confirm exact details before any public copy is prepared.

## No live systems

Restaurant Onboarding OS V1 is preview/manual/pre-live. It does not activate production auth, database writes, storage uploads, live integrations, payments, auto-posting, live AI, background jobs, webhooks, or publishing connectors.

## Future connection boundary

Future production onboarding may connect to approved auth, data, storage, and integrations only after the pre-paid activation gate and explicit implementation approval. V1 is a deterministic foundation that paid systems can connect into later; it is not production SaaS onboarding.

## 2026-06-04 real-route onboarding safety hotfix

Public demo onboarding may show benchmark onboarding profiles. Real guarded `/client/dashboard` and `/client/onboarding` must not display benchmark onboarding data as a real client account. Until real onboarding data is connected, real client routes show a setup/review empty state: restaurant onboarding is being prepared, the checklist appears after activation, real client onboarding data is not connected in this preview, and nothing goes live without Veroxa team review.
