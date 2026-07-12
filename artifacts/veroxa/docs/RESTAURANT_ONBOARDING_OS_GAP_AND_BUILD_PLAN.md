# Restaurant Onboarding OS Gap and Build Plan
> Do not override current docs: read `ACTIVE_DOCS_INDEX.md` first. Any old pricing, role, auth, or automation language in this file is historical/deprecated unless the active docs index confirms it.


Status: current foundation-continuity and behavior-parity plan. The preview/manual V1 foundation exists; production identity, persistence, and complete Sites behavior parity remain future approved work.

Restaurant Onboarding has not been seen recently in the product flow and is now a major missing layer. Veroxa should add a future **Restaurant Onboarding Center / Onboarding Wizard** before paid infrastructure is activated.

Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated. Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.

Active stack: **ChatGPT-managed GitHub + Codex + ChatGPT Sites**. **Vercel is temporary rollback only** and **Replit is historical**. Active roles are **Client and Team**. **Owner/Operator parked**. `AUTH_MODE` remains `placeholder`.

## Build philosophy

Onboarding should first be built in preview/manual mode:

- no production auth
- no database writes
- no real storage uploads
- no live integrations
- no payments
- no auto-posting

The first version should help Faraz collect and review restaurant setup information calmly without pretending Veroxa has production accounts, file storage, live platform access, or automated publishing.

## Future Restaurant Onboarding Center / Wizard

Required onboarding sections:

### Restaurant business info

- Restaurant name.
- Business type/cuisine.
- Service area or neighborhood.
- Current service package: Complete Online Presence — $495/month. Starter $295, Growth $495, and Premium $995 are deprecated/archive-only.
- Notes on whether Premium readiness assessment is needed.

### Contact person

- Primary contact name.
- Role at restaurant.
- Preferred contact method.
- Best time to reach them.

### Address, phone, and website

- Address.
- Phone number.
- Website URL.
- Current online ordering URL if separate.
- Reservation URL if applicable.

### Platform profile links

- Google Business Profile link.
- Instagram link.
- Facebook link.
- TikTok link if available.

### Menu and ordering

- Menu link or menu upload placeholder.
- Ordering link.
- Reservation link.
- Catering link if applicable.
- Menu details requiring confirmation.

### Best sellers and categories

- Best sellers.
- Food categories.
- Seasonal items.
- Catering/high-value items.
- Items Veroxa should avoid promoting.

### Brand tone and posting preferences

- Brand tone.
- Preferred language style.
- Posting preferences.
- Photo/video preferences.
- Any sensitive claims to avoid unless confirmed.

### Client media guidance

- What media Veroxa needs first.
- Examples of usable food, storefront, staff, menu, catering, and best-seller media.
- Quality reminders.
- Low-media fallback plan.

### Platform access checklist

- Google profile access status.
- Facebook page access status.
- Instagram access status.
- TikTok access status.
- Website/CMS access status if applicable.
- Ads account access only if Premium readiness has been approved.

### Business-truth confirmation checklist

Client confirmation is required before using or changing:

- hours
- holiday hours
- menu items
- prices
- discounts
- offers
- catering availability
- halal/organic/health/religious/dietary claims
- serious complaint responses

### First-week setup checklist

- Confirm business basics.
- Review Google Business Profile completeness.
- Confirm links.
- Collect initial media.
- Identify best sellers.
- Prepare first visibility update.
- Prepare first content ideas.
- Prepare first client update.
- Mark items needing client confirmation.

### Draft outputs

The onboarding system should prepare:

- welcome message draft
- media request draft
- first-week setup checklist
- business-truth confirmation checklist
- internal team setup checklist
- package-specific readiness note

Drafts are not sent automatically.

## Client Portal onboarding status

The Client Portal should eventually show a calm onboarding status such as:

- Getting set up.
- Veroxa is reviewing your restaurant details.
- We need a few items from you.
- Media needed.
- Business details need confirmation.
- Setup review ready.

Client surfaces must not expose backend, fixture, Supabase, RLS, connector, API, OpenAI, raw score, or internal risk language.

## Team Portal onboarding queue

The Team Portal should eventually include an onboarding queue for Faraz:

- New restaurant setup items.
- Missing details.
- Media needed.
- Platform access status.
- Business-truth confirmations needed.
- First-week setup actions.
- Prepared welcome/media request drafts.
- Package readiness status.

Team language can be internal, but it must remain clear that onboarding is preview/manual until a future approved activation.

## Recommended future major build

Recommended future major build: **Restaurant Onboarding OS V1**.

Suggested scope:

- Onboarding domain models.
- Demo/manual onboarding fixture state.
- Client Portal onboarding status page/card.
- Team Portal onboarding queue.
- Welcome/media request draft builders.
- Business-truth confirmation checklist.
- First-week setup checklist.
- Guardrails for no production auth, database writes, storage uploads, live integrations, payments, or auto-posting.

## Current markers

- Legacy preview-only credential strings are retired from active operating guidance and must never be reused as production authentication.
- Public Sites Client/Team routes remain non-sensitive pre-live shells until production identity and authorization are explicitly approved and verified.
- AI-ready but not connected
- integration-ready but not connected

## 2026-06-04 V1 foundation status

Restaurant Onboarding OS V1 foundation has been added in preview/manual/pre-live mode. The original gap is no longer unmodeled: Veroxa now has deterministic benchmark onboarding profiles, business info checklists, platform/profile link checks, media intake guidance, business-truth confirmation, proof input collection, first-week setup planning, client onboarding surfaces, and a Team onboarding queue.

This is not complete production onboarding. No production auth, database writes, storage uploads, live integrations, payments, auto-posting, live AI, real client data, or automated execution were added. Future production onboarding still requires explicit approval after the pre-paid activation gate.
