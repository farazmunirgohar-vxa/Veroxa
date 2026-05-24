# Google Business Profile + Local SEO Plan

> **Docs only.** Veroxa has **no Google Business Profile API
> integration** today. The `/demo/client/google` page is a
> demo / read-only visual only. No website SEO automation exists. No
> GBP edits, no review responses, no posts are sent to Google.

## Current state

- `/demo/client/google` shows static demo metrics (views, searches,
  trend indicators) and is **read-only**.
- No Google Business Profile API integration.
- No Google OAuth, no GBP tokens, no GBP write paths.
- No website SEO automation (no scraping, no schema injection, no
  ranking calls).

## Future Google Business Profile tasks

- Profile completeness checklist (hours, categories, photos,
  services, attributes).
- Services / categories tracking against best practices.
- Weekly Google posts (offer / event / what's-new) — drafted in
  Veroxa, human-approved, then either pushed via GBP API (later) or
  posted manually.
- Photo updates (cover, food, interior) — uploaded to GBP after
  approval.
- Review monitoring (new reviews surfaced to the operator).
- Review response suggestions (drafted, never auto-sent).
- Q&A monitoring + suggested answers.

## Local SEO tasks

- Keyword tracking against a per-client target list.
- Citation consistency monitoring (NAP — name / address / phone —
  across major directories).
- Menu schema planning (`Menu`, `MenuItem`, `Offer` schema.org
  guidance for the client website).
- Location-page guidance (single-location vs multi-location
  structure).
- Review velocity tracking (rate of new reviews, response rate).

## Human involvement

- **GBP edits require operator review.** No automated GBP write
  goes out without an operator decision.
- **Review responses must be approved** by an operator (and ideally
  the client owner) before being posted.
- **SEO strategy needs human judgment** — keywords, categories, and
  positioning are not picked by a model alone.

## Not promised

- No first-page Google ranking guarantees.
- No instant SEO results.
- No fake or incentivized reviews.
- No keyword stuffing, hidden text, or other tactics that violate
  Google's guidelines.

## Future integration

- Google Business Profile API integration is **later** (see
  `docs/PRODUCTION_LAUNCH_RUNBOOK.md` stages).
- Search / keyword tools integration is **later** and must be
  evaluated for cost and accuracy first.
- The **manual workflow ships first** (Veroxa drafts, humans publish
  on GBP / website), then API integration is added once the manual
  workflow is stable.

## Cross-references

- `docs/AI_AGENT_ARCHITECTURE_PLAN.md`
- `docs/SOCIAL_PUBLISHING_PLAN.md`
- `docs/PRODUCTION_LAUNCH_RUNBOOK.md`
- `docs/WORKFLOW_STATE_MACHINES.md`
