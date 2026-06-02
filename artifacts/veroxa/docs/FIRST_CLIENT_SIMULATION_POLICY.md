# First-Client Simulation Policy

This policy defines the boundaries for Veroxa's pre-live first-client simulation. It supports honest demo/review-mode validation before production auth, storage, AI, publishing, payments, or platform connectors are approved.

## Allowed

- Demo data
- Review data
- Browser/session actions
- Prepared actions
- Internal queues
- Copy/paste workflows
- Deterministic suggestions
- Honest placeholders
- Client-safe previews
- Local-only team decisions

## Not Allowed

- Real client data
- Production auth
- Cloud storage
- Live AI
- Live publishing
- Payments
- Auto messages
- Auto posting
- Fake metrics
- Customer-visible actions without approval

## Success Criteria

The pre-live simulation is successful when:

- A restaurant can understand what Veroxa does from public/demo pages
- A client can see how to upload/request/report in demo/review mode
- Faraz can see what to review, approve, queue, ask client, or hold
- Reports and updates show honest placeholders if data is unavailable
- Manual execution can be tracked without live connectors
- Guardrails prevent fake-live wording
