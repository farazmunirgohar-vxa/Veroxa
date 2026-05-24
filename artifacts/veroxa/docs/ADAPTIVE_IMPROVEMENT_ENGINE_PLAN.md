# Adaptive Improvement Engine — Plan

> **Docs only.** Nothing in this plan is built. No AI API is wired.
> No automation, no schedulers, no webhooks. This file locks the
> long-term principle and the safe staging path.

## Core idea

Veroxa should become an **adaptive restaurant growth operating
system.** It should observe incoming data, evaluate outcomes,
recommend improvements, and gradually improve how it guides
clients, team members, operators, and the owner.

The Adaptive Improvement Engine is the umbrella concept that ties
the rule-based Restaurant Media Guidance Engine (today), the AI
agents (later), and the operator approval surface together.

## Locked principle

- **Auto-recommend by default.**
- **Auto-adjust only low-risk internal guidance.**
- **Require human approval for anything sensitive, external,
  financial, client-facing, or security-related.**

## Veroxa's #1 priority

Helping restaurants **bring more customers** is the main objective.
Every adaptive improvement must be measurable against that goal.
See [`CUSTOMER_GROWTH_PRIORITY.md`](./CUSTOMER_GROWTH_PRIORITY.md).

## Signals Veroxa may eventually learn from

- Client uploads (volume, cadence, kinds).
- Media quality (approval / reshoot ratios).
- Restaurant type / cuisine.
- Content performance (reach, saves, conversions).
- Posting consistency.
- Google visibility (impressions, profile views, photo views).
- Review activity (new reviews, rating trend, response rate).
- Team execution delays.
- Operator approvals / rejections.
- Client health signals (engagement with the portal, response
  times).
- Report outcomes (whether the client read / acted on a report).
- Failed or blocked posts.
- Client feedback (explicit and inferred).
- Seasonal events and local opportunities.

## Safe auto-improvements (later, no human approval each time)

- Restaurant-specific photo / video guidance.
- Weekly capture plans.
- Content supply score guidance.
- Posting-time suggestions.
- Caption angle suggestions.
- Google photo gap suggestions.
- Operator priority lists.
- Client risk alerts (internal — surfaced to operator only).
- Media quality recommendations.
- Report draft language improvements (suggested, not auto-sent).
- Restaurant-specific content playbooks.
- Client effort reminders (gentle nudge, not external posting).

## Human approval **always** required for

- Publishing posts to social platforms.
- Editing Google Business Profile.
- Sending review responses.
- Sending client-facing reports.
- Changing pricing or billing.
- Changing contracts or client promises.
- Applying database migrations.
- Changing auth / RLS / security rules.
- Using service-role credentials.
- Creating external API integrations.
- Exposing or storing third-party tokens.
- Allowing AI-generated content to go live.
- Making guaranteed-result claims.

## Future architecture layers

1. **Observation Layer.** Collects signals (uploads, performance,
   review activity, operator actions). Append-only.
2. **Evaluation Layer.** Scores outcomes against the rule sets
   (e.g. Restaurant Media Guidance, posting consistency).
3. **Recommendation Layer.** Produces improvement candidates for
   clients, team, operators, and Veroxa itself.
4. **Approval Layer.** Gates anything sensitive behind human
   approval (operator or owner).
5. **Change Log Layer.** Records what was changed, by whom, why,
   and what the prior state was — built on `audit_logs`.
6. **Learning Layer.** Updates rule weights / templates over time;
   AI-driven only in V2+.

## First safe implementation path

Order matters — each step is small, demo-friendly, and does not
require AI:

1. **Restaurant Media Guidance Engine.** *(shipped — rule-based
   demo. See [`MEDIA_GUIDANCE_ENGINE_PLAN.md`](./MEDIA_GUIDANCE_ENGINE_PLAN.md).)*
2. **Weekly Capture Plan.** *(shipped as part of (1).)*
3. **Content Supply Score.** Operator-visible health number per
   client.
4. **Google Photo Gap Detector.** Compare current GBP photo
   categories vs the engine's `googleSpecificShots`.
5. **Operator Risk Radar.** Cross-client risk surface.
6. **Veroxa Trust / Consistency Score.** Client-visible "are we
   showing up consistently?" indicator.
7. **"Why This Post" explanation card.** Surface the reasoning
   behind every scheduled post (rule-based first).

**No AI API is required for the first version of any of these.**

## Islamic foundation note

This principle aligns with **amanah** (trust), **sidq**
(truthfulness), **ihsan** (excellence), **adl** (justice), and
**tawakkul** (reliance with effort). Veroxa should improve itself
to **serve clients better, not to manipulate them** or to overpromise
results. Auto-recommendations must be honest, auditable, and
overrideable by the operator at any time.
