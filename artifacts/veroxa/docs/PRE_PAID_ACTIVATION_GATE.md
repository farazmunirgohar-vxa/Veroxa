# Pre-Paid Activation Gate

Status: Required gate before Veroxa spends more money on production auth/database, storage uploads, live AI, platform APIs, payments, or paid monitoring/logging tiers.

Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated. Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.

## Scope of this gate

This gate must be reviewed before enabling paid or live versions of:

- Supabase production auth/database.
- Storage uploads.
- OpenAI/live AI.
- Google APIs.
- Meta/TikTok APIs.
- Payments.
- Monitoring/logging paid tiers.

Active stack: **GitHub + Codex + Vercel**. **Replit is historical only**. Active roles: **Client and Team**. **Owner/Operator parked**.

Current review credentials:

- [faraz@client.com](mailto:faraz@client.com) / farazclient
- [faraz@team.com](mailto:faraz@team.com) / farazteam

`AUTH_MODE` must remain `placeholder` until a separate approved production auth activation.

## 1. Public site gate

- [ ] Homepage is clear and current.
- [ ] Services and Pricing are separated.
- [ ] Services page explains service layers and contains no prices.
- [ ] Pricing page contains $295, $495, and $995 with plan-service lists.
- [ ] Free Audit is safe, honest, and does not imply live lookup/integration if none exists.
- [ ] No fake guarantees for revenue, orders, profit, rankings, ROI, walk-ins, customers, or growth.
- [ ] No public/client internal profit math.

## 2. Preview login/demo gate

- [ ] [faraz@client.com](mailto:faraz@client.com) / farazclient works in placeholder preview mode.
- [ ] [faraz@team.com](mailto:faraz@team.com) / farazteam works in placeholder preview mode.
- [ ] Public client demo at `/demo/client/dashboard` works.
- [ ] Real client routes remain guarded.
- [ ] Real team routes remain guarded.
- [ ] Demo and login flows remain separate.

## 3. Client Portal gate

- [ ] Client demo feels premium and honest.
- [ ] Onboarding status is visible or a clear Restaurant Onboarding plan exists.
- [ ] Media, request, update, and report flows are understandable.
- [ ] Client-facing pages use calm service language.
- [ ] No client-facing AI internals, backend terms, raw scores, fixture labels, connector/API language, Supabase/RLS language, or internal risk logic.

## 4. Team Portal gate

- [ ] Team Dashboard is usable for Faraz.
- [ ] Manual Execution Center is usable.
- [ ] First-Client Ops is usable if present.
- [ ] Work Queue is usable.
- [ ] Report Queue is usable.
- [ ] Audit Leads is usable.
- [ ] First-Client Readiness is usable.
- [ ] Pages clearly state pre-live/manual/draft status where relevant.
- [ ] No auto-posting or live paid integrations are implied.

## 5. Restaurant Onboarding gate

- [ ] Restaurant Onboarding Center / Onboarding Wizard exists or a clear approved plan exists.
- [ ] Business info checklist exists.
- [ ] Media checklist exists.
- [ ] Platform access checklist exists.
- [ ] Business-truth confirmation checklist exists.
- [ ] First-week setup checklist exists.
- [ ] Client Portal onboarding status exists or is planned.
- [ ] Team Portal onboarding queue exists or is planned.

## 6. AI-ready gate

- [ ] AI draft interfaces exist.
- [ ] Captions, reports, updates, audits, and outreach drafts have deterministic fallbacks.
- [ ] Human approval is required before public/customer-visible action.
- [ ] Server-side-only future AI boundary is documented.
- [ ] Budget caps are planned.
- [ ] No frontend key exposure is possible.
- [ ] Draft labels are clear.
- [ ] Activity logging is planned before live AI.
- [ ] Veroxa remains AI-ready but not connected until explicit activation.

## 7. Integration-ready gate

- [ ] Adapter contracts are planned.
- [ ] Error states are planned.
- [ ] Rollback plan is planned.
- [ ] Rate limits are planned.
- [ ] Activity logs are planned.
- [ ] Permission boundaries are planned.
- [ ] Human approval gates exist where customer-visible action is possible.
- [ ] Veroxa remains integration-ready but not connected until explicit activation.

## 8. Security gate

- [ ] No service role key reaches frontend code.
- [ ] No exposed API keys.
- [ ] `AUTH_MODE` is still intentionally controlled and remains `placeholder` until approved.
- [ ] Protected routes are protected.
- [ ] Guardrails pass.
- [ ] Production auth/storage/live AI/connectors/payments are not described as active.

## 9. Cost gate

- [ ] Estimated cost is approved before turning on paid systems.
- [ ] Client/pilot readiness is confirmed.
- [ ] Manual operation is possible without paid automation.
- [ ] Cancellation/rollback path is documented before activation.
- [ ] Activation is approved in a focused future build.

## Blocked until this gate passes

Do not activate production auth, production database writes, storage uploads, live OpenAI calls, Google APIs, Meta/TikTok APIs, payments, webhooks, cron jobs, background jobs, automated publishing, or paid monitoring tiers until this gate passes and Faraz explicitly approves the relevant activation.
