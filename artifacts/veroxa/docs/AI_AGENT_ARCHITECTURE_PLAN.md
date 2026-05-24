# Veroxa AI Agent Architecture — Plan

> **Docs only.** No AI API integration exists in the Veroxa frontend.
> All "AI" surfaces today (e.g. `/demo/team/ai-review`) are **static
> simulated previews**. No OpenAI / Anthropic / Gemini / OpenRouter /
> other provider calls are made.

## Staged rollout

### V1 — Demo (today)

- Static / simulated AI previews only.
- No API calls.
- AI cards exist purely to communicate the future product shape.

### V1.5 — Rule-based

- Rule-based scoring; **no external AI provider**.
- Examples:
  - Media checklist (file type, size, brightness heuristics).
  - Caption template suggestions from a fixed library.
  - Posting-window suggestions from cadence rules.

### V2 — Real AI provider

- First real API integration (OpenAI or comparable).
- Use cases:
  - Media review summary.
  - Caption drafts (multiple variants).
  - Brand voice consistency checks.
  - Weekly / monthly report summary drafts.
- All outputs **drafts only** — human review required before any
  client-facing surface or any publishing action.

### V3 — Autonomous AI OS

- Agents collaborate across the workflow (concept → draft →
  scheduling → reporting).
- Human approval still required for any client-facing or external
  action (publishing, GBP edits, report sign-off).

---

## Agents

For each agent: input data, output, human approval requirement, risk
level, **all not built yet**.

### Media Review Agent

- **Input:** uploaded `media_assets` rows + file blobs.
- **Output:** quality tags, recommended use, rejection reasons,
  summary text.
- **Human approval:** required before `approved` status flip.
- **Risk:** medium (wrong tag wastes team time).
- **Status:** not built.

### Content Strategist Agent

- **Input:** `clients`, `onboarding_items.answer_payload`, recent
  performance.
- **Output:** content concepts aligned to brand + posting cadence.
- **Human approval:** required before concept → `ready_for_review`.
- **Risk:** medium (off-brand suggestions).
- **Status:** not built.

### Caption Agent

- **Input:** approved concept + brand voice profile.
- **Output:** 1–3 caption variants per concept.
- **Human approval:** required before draft variant →
  `operator_approved`.
- **Risk:** medium-high (tone, factual accuracy, halal-appropriate
  language).
- **Status:** not built.

### Brand Voice Agent

- **Input:** brand voice profile + a candidate caption / report
  paragraph.
- **Output:** pass / fail + suggested rewrite.
- **Human approval:** required before any external surface.
- **Risk:** medium.
- **Status:** not built.

### Scheduling Agent

- **Input:** approved posts, post slots, audience-window heuristics.
- **Output:** recommended slot assignments.
- **Human approval:** required before `scheduled` state.
- **Risk:** low–medium.
- **Status:** not built.

### Publishing Readiness Agent

- **Input:** post + linked media + platform connection + caption.
- **Output:** ready / blocked + missing items.
- **Human approval:** required to flip `ready_to_schedule`.
- **Risk:** low.
- **Status:** not built.

### Reporting Agent

- **Input:** posts published, reach, GBP signals, prior reports.
- **Output:** weekly / monthly report draft summaries.
- **Human approval:** operator must approve before
  `published_to_client`.
- **Risk:** medium (factual claims to the client).
- **Status:** not built.

### Alert / Risk Agent

- **Input:** operational signals (missing media, missed windows,
  health drops, review velocity).
- **Output:** prioritized operator alerts.
- **Human approval:** alerts are informational; mitigations require
  human action.
- **Risk:** low (false positives create noise).
- **Status:** not built.

### Operator Assistant

- **Input:** operator workspace context.
- **Output:** triage suggestions, summary of what needs attention.
- **Human approval:** suggestions only.
- **Risk:** low.
- **Status:** not built.

### Owner Assistant

- **Input:** business signals (MRR, churn risk, fulfillment load).
- **Output:** business decision summaries.
- **Human approval:** suggestions only.
- **Risk:** low.
- **Status:** not built.

---

## Safety principles

- AI **cannot** publish directly in V1 or V2. Publishing requires
  human approval (see `docs/SOCIAL_PUBLISHING_PLAN.md`).
- AI **cannot** edit Google Business Profile directly. GBP edits go
  through operator review (see `docs/GOOGLE_SEO_GBP_PLAN.md`).
- AI **cannot** approve reports without an operator.
- All AI-generated content **must** be reviewed before reaching the
  client surface.
- Client trust and halal business ethics require **transparency**:
  whenever AI is used to generate or recommend content, that should
  be discoverable in audit logs.

## Cross-references

- `docs/WORKFLOW_STATE_MACHINES.md`
- `docs/SOCIAL_PUBLISHING_PLAN.md`
- `docs/GOOGLE_SEO_GBP_PLAN.md`
- `docs/PRODUCTION_LAUNCH_RUNBOOK.md`
