# AI-Ready But Not Connected Strategy
> Do not override current docs: read `ACTIVE_DOCS_INDEX.md` first. Any old pricing, role, auth, or automation language in this file is historical/deprecated unless the active docs index confirms it.


Status: Current architecture guidance for AI-shaped Veroxa systems before paid live AI is enabled.

Veroxa should be **AI-ready but not connected**. Build AI-shaped workflows now, connect paid AI later. Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated.

Active stack: **ChatGPT-managed GitHub + Codex + ChatGPT Sites**. **Vercel is temporary rollback only** and **Replit is historical**. Active roles are **Client and Team**. **Owner/Operator parked**. `AUTH_MODE` remains `placeholder`.

## Strategy

The current approach is to design the product and operating flow first:

- Deterministic/rule-based draft systems before OpenAI.
- Automation preview queues before live execution.
- Manual execution packs before platform publishing.
- Human approval before public/customer-visible action.
- Client confirmation before business-truth changes.
- Server-side-only future AI calls.
- No frontend AI keys.
- No auto-publishing.
- Required fallback behavior if AI is unavailable, too expensive, or unsafe.
- Required draft labels so no generated text looks automatically sent.
- Required budget caps before paid AI activation.
- Required activity logging before live AI activation.

Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.

## Current AI-ready areas

These areas can be built or improved in preview/manual mode without live AI:

- Caption draft placeholders.
- Media review logic.
- Weekly update draft builders.
- Monthly report draft builders.
- Audit summary draft systems.
- Lead/outreach draft systems if present.
- Manual execution packs.
- Client confirmation workflows.
- Brand voice checks.
- Automation preview queues.
- First-client ops drafts.
- Report queues.

## Required product behavior

Every AI-shaped system should:

- Produce draft/prepared language, not live execution.
- Use deterministic fallbacks by default.
- Label output as draft, prepared, in review, or queued for later.
- Require Veroxa team approval before public/customer-visible use.
- Require client confirmation for business-truth details such as hours, menu details, prices, offers, catering, religious/dietary claims, or sensitive complaint responses.
- Keep internal analysis separate from client-facing copy.
- Avoid guarantee language for revenue, orders, ROI, profit, rankings, walk-ins, customers, or growth.

## Future server-side AI boundary

When live AI is approved later:

- AI calls must run server-side only.
- No OpenAI or provider key may be exposed in frontend code.
- Each AI request must have a clear use case, budget cap, timeout, fallback, and audit trail.
- Generated output must remain draft-only until reviewed.
- Activity logs must record draft source, approval state, user action, and fallback state.
- The adapter must plug into existing draft builders rather than replacing the workflow.

## Activation checklist

Before live AI activation:

- [ ] Pre-Paid Activation Gate is satisfied.
- [ ] Server-side adapter design is approved.
- [ ] Budget caps are documented.
- [ ] No frontend key exposure is verified.
- [ ] Draft labels are enforced.
- [ ] Human approval gates are enforced.
- [ ] Client confirmation gates are enforced.
- [ ] Activity logging is ready.
- [ ] Fallback behavior is tested.
- [ ] Rollback path to deterministic drafts is documented.

## Current access and pricing markers

- Legacy preview-only credential strings are retired from active operating guidance and must never be reused as production authentication.
- Public Sites Client/Team routes remain non-sensitive pre-live shells until production identity and authorization are explicitly approved and verified.
- Historical/deprecated only: Starter $295, Growth $495, Premium $995. Current public offer is Complete Online Presence — $495/month.
