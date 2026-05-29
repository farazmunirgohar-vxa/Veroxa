# Lead Intelligence + Outreach Engine

Rule-based foundation that turns a saved audit lead into a structured sales
picture: a conversion-opportunity score, a segment, top reasons, a recommended
sales angle, a public-only contact-path checklist, ready-to-edit outreach
drafts, and a lead → audit → onboarding next-step playbook.

Everything here is **deterministic and rule-based**. The optional AI layer only
rewrites copy; it never changes scores, decisions, or whether something is sent.
Nothing is ever sent, called, or texted automatically. A human reviews every
outreach draft before any contact happens.

## Where it lives

```
artifacts/veroxa/src/lib/leadIntelligence/
  leadIntelligenceTypes.ts   # types + label maps (segments, contact paths, fit tiers)
  leadScoringEngine.ts       # analyzeLeadIntelligence(input) + inputFromAuditLead(record)
  contactPathEngine.ts       # buildContactPaths() from public/audit fields only
  outreachDraftEngine.ts     # buildOutreachDraftSet() / buildOutreachDraft()
  leadConversionPlaybook.ts  # buildConversionPlaybook() lead→audit→onboarding steps
```

UI surfaces:

- `src/pages/team-audit-leads.tsx` — full per-lead intelligence + outreach panel.
- `src/pages/team-dashboard.tsx` — `LeadIntelligenceSummaryStrip` (counts).
- `src/pages/team-work-queue.tsx` — `LeadGenTasksList` (prospecting tasks,
  kept separate from the client work pipeline).
- `src/components/LeadIntelligencePanel.tsx` — the two shared surfaces above.

## Data flow

1. A lead is captured by Free Audit V1 and stored locally
   (`lib/leads/localAuditLeadStore.ts`, `AuditLeadRecord`).
2. `inputFromAuditLead(record)` maps the stored record into a storage-decoupled
   `LeadIntelligenceInput` (public + audit + internal-flag fields only).
3. `analyzeLeadIntelligence(input)` returns a `LeadIntelligenceProfile`:
   - `score` — four dimensions (improvement room, possible marketing-investment
     signal, execution inconsistency, reachability) plus an overall
     conversion-opportunity score (0–100).
   - `segment` / `segmentLabel` / `segmentDescription`.
   - `fitTier`, `topReasons`, `recommendedSalesAngle`.
   - `marketingInvestment`, `inconsistency`, `reachability` signals.
   - `contactPaths` (from `buildContactPaths`).
   - `nextActions` (from `buildConversionPlaybook`).
4. `buildOutreachDraftSet(profile, input)` produces cautious, value-based drafts:
   email, follow-up email, call opener, voicemail, walk-in opener, and a
   discovery/meeting agenda — each with guardrail notes.

## Scoring dimensions

| Dimension | Meaning |
| --- | --- |
| Improvement room | How much measurable upside the public audit suggests. |
| Possible marketing-investment signal | Soft signal a business may already invest in digital presence. Never treated as confirmed spend. |
| Execution inconsistency | Gaps between presence and execution (e.g. listed but broken/missing links). |
| Reachability | How easy it is to reach a decision-maker via public/known paths. |

The overall conversion-opportunity score combines these. It is a **prioritization
aid for humans**, not a promise of any outcome.

## Contact-path checklist

`buildContactPaths` only uses public or audit-provided fields (website contact
page, public phone, public listing, public social profiles, physical walk-in).
Each path carries a confidence: `available`, `likely`, or `needs_research`. It
never instructs anyone to scrape private data or bypass access controls.

## Outreach drafts

Drafts are starting points for a human. They are:

- Cautious and value-based — focused on the lead's own audit findings.
- Never disparaging of any current vendor or agency.
- Free of guarantees or promised results.
- Marked clearly that human review + manual sending is required.

The "Mark ready for outreach" action only flags a lead for a human to review
and send manually. It does not send anything.

## AI layer (optional)

Draft types `lead_outreach_email`, `lead_follow_up_email`, `lead_call_script`,
and `lead_meeting_agenda` can be rewritten by the server AI draft endpoint when
`OPENAI_API_KEY` is configured server-side. If it is not configured or the call
fails, the deterministic rule-based draft is used as a safe fallback. The API
key is never exposed to the client. See `AI_DRAFT_ENDPOINT_CONTRACT.md`.

## Guardrails

See `OUTREACH_COMPLIANCE_GUARDRAILS.md` for the full list. In short: human
review required, no auto-send/call/text, no private scraping, no payments or
notifications, no confirmed-spend claims, no vendor insults, no guarantees,
Free Audit V1 untouched.
