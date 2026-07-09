# Momo Restaurant Intelligence Operating Board

Status: PR #132 source of truth for `/team/momo/intelligence` as the internal Restaurant Intelligence operating board.

## Scope

Restaurant Intelligence is organization only. It consolidates verified and unverified restaurant knowledge into one Team Faraz workspace so the team can answer: what Veroxa currently knows, what is verified, what is missing, and what blocks safe operations.

## Safety lock

- No activation.
- No real auth activation.
- No credentials.
- No Momo's House contact.
- No external publishing.
- No Google, Meta, DoorDash, Yelp, TikTok, delivery, or external platform connection.
- No AI generation or AI provider call.
- No fake data, fake metrics, fake media, fake approvals, fake readiness, or fake reports.
- No database reads or writes.
- AUTH_MODE remains placeholder.
- `/api/pilot-access` remains active.
- Roles remain client/team only.
- Momo owner walkthrough remains blocked.
- Future activation requires explicit Faraz approval.

## Board sections

The board organizes:

1. Restaurant Identity — name, address, phone, hours, cuisine, and website status labeled Verified, Needs Owner Confirmation, or Unknown.
2. Business Truth — confirmed facts, unconfirmed facts, blocked public claims, and sensitive claims with a link to `/team/momo-business-truth`.
3. Media Inventory — available, missing, needs usage rights, and blocked media with a link to `/team/momo-media-content`.
4. Brand Voice — brand personality, content pillars, AI restrictions, and tone rules with a link to `/team/momo-brand-ai-rules`.
5. Operational Readiness — Business Truth, Media, Brand Rules, AI, Reports, Dry Run, and Readiness labeled Ready, Needs Review, Blocked, or Internal Only.
6. Current Risks — internal blockers including incomplete truth, media rights, sensitive claims, owner confirmation, real auth disabled, and activation blocked.
7. Safe Next Actions — internal review links only; owner contact, publishing, AI generation, pilot activation, and platform connections remain blocked.
