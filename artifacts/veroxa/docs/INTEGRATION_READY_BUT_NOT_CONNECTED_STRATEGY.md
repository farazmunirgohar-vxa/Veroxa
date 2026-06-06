# Integration-Ready But Not Connected Strategy
> Do not override current docs: read `ACTIVE_DOCS_INDEX.md` first. Any old pricing, role, auth, or automation language in this file is historical/deprecated unless the active docs index confirms it.


Status: Current architecture guidance for preparing future providers without activating paid/live systems.

Veroxa should be **integration-ready but not connected**. Build adapter contracts and UI flows before connecting paid/live providers. Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated.

Active stack: **GitHub + Codex + Vercel**. **Replit is historical only**. Active roles are **Client and Team**. **Owner/Operator parked**. `AUTH_MODE` remains `placeholder`.

Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.

## Shared integration rules

For every future provider:

- Current preview/manual workflows must keep working without the provider.
- Adapter contracts may be planned now.
- UI states may be built now as preview/manual states.
- Live credentials, writes, publishing, payments, storage, and external API calls are blocked now.
- Activation requires the Pre-Paid Activation Gate.
- Rollback requirements must exist before activation.
- Activity logs must exist before activation.
- Human approval is required where public/customer-visible action is possible.

## Future Supabase auth/database adapter

- Current state: `AUTH_MODE` is `placeholder`; no production auth/database writes are active.
- Allowed now: contracts, docs, placeholder/demo adapters, route guards, review state, auth planning.
- Blocked now: production auth, migrations, RLS activation, real client data writes, service-role frontend access.
- Must exist before activation: final auth plan, data-boundary review, role model limited to Client and Team, protected routes, key handling plan, migration/RLS review, rollback plan.
- Activation checklist: pass Pre-Paid Activation Gate, approve costs, apply migrations intentionally, verify no anon real-client access, verify client/team route separation.
- Rollback requirement: ability to return to placeholder/manual review state.
- Activity log requirement: auth/session/data-access events planned before real client data.
- Human approval requirement: required for customer-visible work even after real data exists.

## Future Supabase storage adapter

- Current state: no real storage uploads are active.
- Allowed now: media guidance, upload placeholders, review cards, storage adapter contracts, manual media intake planning.
- Blocked now: real file uploads, bucket creation for production, public upload URLs, real media persistence.
- Must exist before activation: file size/type policy, access control, moderation/review policy, retention policy, fallback/manual intake path.
- Activation checklist: pass gate, approve storage cost, test upload/read/delete paths, verify no service role exposure.
- Rollback requirement: disable storage writes and return to manual media instructions.
- Activity log requirement: upload, review, approve, reject, delete/retain events.
- Human approval requirement: required before media is used publicly.

## Future OpenAI adapter

- Current state: AI-ready but not connected; no live AI runtime calls.
- Allowed now: deterministic draft builders, prompt contracts, draft UI, review workflows, fallback copy.
- Blocked now: live OpenAI calls, frontend API keys, auto-send/auto-publish behavior.
- Must exist before activation: server-side adapter, budget caps, safety filters, fallback behavior, draft labels, approval gates.
- Activation checklist: pass gate, verify key isolation, test fallbacks, test cost controls, test logs.
- Rollback requirement: deterministic drafts remain available.
- Activity log requirement: request purpose, output state, approval state, fallback state, cost estimate.
- Human approval requirement: always required before public/customer-visible action.

## Future Google adapter

- Current state: Google Maps/Profile work is prepared manually; no Google API connector is active.
- Allowed now: Google Business Profile readiness checks, local visibility tasks, prepared updates, review-reply drafts, manual execution packs.
- Blocked now: Google API writes, live profile edits, live posts, review replies, OAuth connection.
- Must exist before activation: account permission flow, rate limit handling, business-truth confirmation gate, approval queue integration, rollback/undo plan.
- Activation checklist: pass gate, verify permissions, test read-only mode, test approval-to-execution path, test failure states.
- Rollback requirement: connector can be disabled and work can return to manual copy/paste.
- Activity log requirement: prepared, approved, attempted, succeeded, failed, rolled back.
- Human approval requirement: required before any profile update, post, or review reply.

## Future Meta/TikTok adapters

- Current state: social work is prepared manually using client-provided media; no Meta/TikTok connector is active.
- Allowed now: caption drafts, media review, content calendars, manual execution packs, posting rhythm guidance.
- Blocked now: social publishing APIs, page/account connection, scheduled posts, inbox/comment handling.
- Must exist before activation: permission model, content/media readiness, rate limits, platform failure states, approval queue integration, rollback plan.
- Activation checklist: pass gate, verify account ownership/permission, test read-only connection first, test draft-to-approved-to-execute path.
- Rollback requirement: disable connector and return to manual execution.
- Activity log requirement: draft, approval, scheduled/queued, attempted, published/failed, rollback note.
- Human approval requirement: required before publishing.

## Future payment adapter

- Current state: no payments, checkout, subscriptions, billing, or Stripe are active.
- Allowed now: pricing copy, cancellation policy copy, billing readiness docs, adapter planning.
- Blocked now: payment collection, checkout, subscription records, invoices, webhook billing events.
- Must exist before activation: legal/pricing review, cancellation flow, billing support plan, tax/receipt plan, account state rules, rollback/refund process.
- Activation checklist: pass gate, approve provider/cost, test checkout in sandbox, test cancellation, test failed-payment states, test no accidental charges.
- Rollback requirement: disable checkout and continue manual billing/offline process if needed.
- Activity log requirement: checkout started, paid, failed, canceled, refunded, plan changed.
- Human approval requirement: required before plan changes or ad budget commitments.

## Future notification adapter

- Current state: no production notification provider, webhooks, cron jobs, or background jobs are active.
- Allowed now: notification copy drafts, reminder schedules as manual/checklist items, activity-feed preview states.
- Blocked now: automated emails/SMS, webhooks, cron jobs, background jobs, auto-reminders.
- Must exist before activation: opt-in/opt-out rules, message approval rules, rate limits, failure states, unsubscribe/compliance handling.
- Activation checklist: pass gate, test provider in sandbox, verify no auto-send without approval, verify logs.
- Rollback requirement: disable provider and return to manual reminders.
- Activity log requirement: draft, approved, queued, sent, failed, canceled.
- Human approval requirement: required before client-visible messages until Faraz approves a narrower automated reminder policy.

## Current markers

- [faraz@client.com](mailto:faraz@client.com) / farazclient
- [faraz@team.com](mailto:faraz@team.com) / farazteam
- Historical/deprecated only: Starter $295, Growth $495, Premium $995. Current public offer is Complete Online Presence — $495/month.
