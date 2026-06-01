# Client Portal Media, Requests, Updates, and Reports Model

This note captures the current client-safe product shape for the first-client build.

## Media tracker

Client media uses the shared lifecycle in `src/lib/clientMediaLifecycle.ts`:

Uploaded → Reviewed → Ready → Scheduled → Posted

The Media page keeps three buckets (Uploaded, Ready, Posted) and a detail tracker. The tracker may show a safe exception status such as `Needs better media`, but it must not expose internal queue, scoring, risk, implementation, or team-member language.

## Requests

Requests are optional direction from the restaurant, not a formal support queue. The client should feel like they are simply telling Veroxa what they want.

Supported client request types:

- Use this media
- Save for later
- Push a special/event
- Avoid an item
- General note

Client-facing request statuses stay limited to:

- Received
- In Review
- Handled
- Waiting for you

Client request creation may create local/demo-safe team workflow items, but it must not make production writes or imply live publishing.

## Updates

Updates are a progress lane, not a report page. They should show reviewed, ready, scheduled, and posted media plus anything Veroxa needs from the client. Do not add analytics, fake performance metrics, or internal queue details here.

## Reports

There is one Reports nav item. Reports are an archive-style page with Weekly Reports and Monthly Reports sections.

Weekly reports can summarize work completed, media used or posted, what is next, what Veroxa needs from the client, and a simple visibility note when available.

Monthly reports can summarize posts completed, top content only when data exists, local visibility progress only when verified, improvements, next month focus, and honest limitations. Never invent metrics.
