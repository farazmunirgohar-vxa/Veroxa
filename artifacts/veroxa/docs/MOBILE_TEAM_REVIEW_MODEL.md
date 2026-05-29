# Mobile Team Review Model (Stage 4)

The Veroxa Team (Faraz) reviews work on the go. This stage lays the **foundation**
for a mobile-first review experience: a single reusable card that reads cleanly on
a phone and frames every item as "here's what it is, here's the suggested next
step, here's what I can do about it."

## The component

`src/components/TeamReviewCard.tsx` — a mobile-friendly, reusable review card.

Props:

- `restaurantName` — whose work this is.
- `title` — what the item is (file label, task, etc.).
- `icon?` — optional leading icon.
- `context?` — the client's note / quote, shown plainly.
- `suggestedAction?` — calm "Suggested next: …" line.
- `status?` — `{ label, tone }` badge (uses the shared `StatusBadge` tones).
- `priority?` — optional priority badge.
- `meta?` — small secondary line (category, submitted time).
- `actions[]` — triage buttons; each is link **or** `onClick`, with optional icon
  and `testId`.
- `testId?` — root test id.

Design rules:

- Cards stack vertically and buttons wrap on small screens (no horizontal scroll).
- No backend / AI / internal jargon in any label.
- Wording is calm and blame-free.

## Where it's used now

- **Upload Inbox** (`/team/upload-inbox`) — each upload is a `TeamReviewCard` with
  triage actions (Mark In Review / Accept for Content / Needs Better Photo / Save
  for Later).
- The Team Dashboard "Today's Suggested Push" card shares the same calm vocabulary.

## Future (not built here)

- A dedicated mobile review queue route that pages through items one card at a
  time.
- Optional status write-back (today, triage on live read-only rows stays
  in-memory only — see the inbox `updateStatus` logic).
- Swipe gestures / keyboard shortcuts for fast triage.
