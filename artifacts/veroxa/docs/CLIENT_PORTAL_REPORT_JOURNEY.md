# Client Portal Report + Journey Foundation

## Purpose

This foundation gives the Client Portal one calm, client-safe data model for the restaurant-partner journey: media uploads, requests, Veroxa work, weekly updates, monthly reports, and local visibility progress.

The intended client feeling is simple: **Veroxa is handling my online presence. I only need to upload media, share important updates, confirm sensitive details, and review simple progress.**

## Client journey from upload/request to report

1. The restaurant uploads media or sends a request/business update.
2. Veroxa reviews the submission and shows a simple status such as `Submitted`, `In review`, or `Needs your input`.
3. Veroxa prepares the next useful work item in client-safe language.
4. If business facts are sensitive, the client sees a clear confirmation need before Veroxa proceeds.
5. Completed work becomes recent progress.
6. Recent progress feeds weekly updates and monthly reports.
7. Local visibility progress is summarized as Google profile freshness, review response support, photo freshness, business details confirmation, menu/order link checks, local search focus, and next visibility action.

## Data sources feeding the journey today

The deterministic local aggregation layer combines current demo/local foundations:

- client workflow items from media submissions and requests
- client-visible workflow status events
- prepared action client-safe summaries
- visibility audit client-safe summaries
- local weekly update generation
- local monthly report generation

The key module is `src/domain/clientPortalJourney/`.

Primary helpers:

- `getClientPortalJourney(clientId)`
- `getClientProgressSummary(clientId)`
- `getClientNeedsFromYou(clientId)`
- `getClientRecentProgress(clientId)`
- `getClientVisibilityProgress(clientId)`
- `getClientNextSteps(clientId)`
- `generateClientWeeklyUpdate(clientId)`
- `generateClientMonthlyReport(clientId)`
- `getClientLocalVisibilityProgress(clientId)`

## Weekly update generation

`generateClientWeeklyUpdate(clientId)` builds a client-safe weekly update from journey items. It includes:

- completed work
- in-progress work
- what Veroxa needs from the client
- local visibility progress
- content progress
- review response support
- next week focus
- one client-safe summary sentence

Example language:

- “Veroxa reviewed new media.”
- “A local visibility update is being prepared.”
- “More food photos would help next week’s content.”
- “Review response support is in progress.”

## Monthly report generation

`generateClientMonthlyReport(clientId)` builds a client-safe monthly report foundation. It includes:

- executive summary
- visibility progress
- media and content summary
- review reputation summary
- completed work
- pending client input
- next month focus
- client-safe recommendations

The monthly report foundation avoids fake revenue claims, ranking guarantees, and invented live performance metrics.

## Google Maps / local visibility client-safe wording

Client-facing surfaces should use plain terms:

- Google profile freshness
- Local visibility
- Visibility update
- Review response
- Photo freshness
- Business details confirmation
- Menu/order link check

Avoid client-facing language that implies live integrations, hidden machinery, raw scores, ranking guarantees, or automatic public changes.

## What clients never see

Clients should never see:

- AI agent internals
- OpenAI
- Supabase
- RLS
- fixture
- backend
- connector
- API
- raw scoring
- internal risk/approval logic
- internal IDs
- execution internals

## Current fixture/demo limitations

Today this is a deterministic local/demo aggregation layer. It does not persist new journey records to a database, does not call external services, and does not publish anything. Some current demo records provide representative work items so the Client Portal can show the intended flow before production persistence exists.

## Future Supabase persistence stage

A future persistence stage can store journey items, weekly update records, monthly report records, and client needs in Supabase tables. The Client Portal should keep calling the same helper-shaped API so page components do not need to know where the data lives.

## Future AI report drafting stage

A future drafting stage may prepare report drafts for Veroxa team review. It must keep the same approval gates: drafts are not public, nothing goes live automatically, and the client only sees reviewed, client-safe summaries.

## Future real metrics stage

A future metrics stage can add real account data such as profile activity, website clicks, calls, directions, review counts, post performance, and content consistency. Until real data is available, the Client Portal should use careful wording such as “work completed,” “support in progress,” and “opportunities,” not fake numbers or guarantees.
