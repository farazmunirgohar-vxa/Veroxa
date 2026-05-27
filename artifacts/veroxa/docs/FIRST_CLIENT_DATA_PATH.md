# First-Client Data Path (M021)

End-to-end description of the real data flow Veroxa will run once the
first paying restaurant goes live. Everything below is the *intended*
shape; in this build it is still demo/session-only.

## Flow

1. **Restaurant is onboarded.** Internal record created with name,
   location, tier, and ads add-on flag.
2. **Restaurant gets a Restaurant Upload Key.** Opaque key, labelled
   per device/employee, revocable.
3. **Restaurant employee opens `/upload`.** No login. Key is entered.
4. **Employee submits photos/videos + category + note + priority.**
   Files plus metadata.
5. **Upload submission is saved.** Row written to
   `upload_submissions` with status `received`.
6. **Media file is stored.** Private bucket; signed URL access only.
7. **Team sees the upload in the Upload Inbox.**
8. **Team marks status:**
   - `received` → `in_review`
   - `in_review` → `accepted` / `needs_better_photo` / `saved_for_later`
9. **Accepted media enters Media Review / Content workflow.**
10. **Client can see basic upload + status** in the Client Portal
    (via client-safe view, not raw rows).
11. **Client can submit Direction Center requests** describing what
    matters this week.
12. **Team sees direction in Direction Queue**, interprets, routes to
    content / Google / ads planning.
13. **Adaptive Intelligence recommends next action** from rule-based
    signals over uploads + direction + workflow memory.
14. **Team executes manually.** No auto-publishing.
15. **Client sees updates / reports** via Weekly Updates and the
    Client Dashboard.

## Visibility

### Client (logged-in) can see
- Their own upload status (client-safe label).
- Their own direction requests (client-safe label).
- Weekly updates / scheduled posts summary.
- Adaptive Intelligence preview (client-friendly framing).

### Client cannot see
- Raw rejection notes / internal triage comments.
- Internal quality scores.
- Staff notes / reviewer identity.
- RLS / database error messages.
- Other restaurants.

### Team can see
- Operational queue across clients.
- Category, client notes (sanitized), status, suggested action.
- Local/demo review decisions.

### Team cannot do here
- Launch ads.
- Publish to social/Google directly.
- Touch billing.

### Restaurant Upload Key can access
- `/upload` form.
- Upload confirmation page.
- Optionally: own recent session uploads (display only).

### Restaurant Upload Key CANNOT access
- Team Portal, Owner Portal, Operator Portal.
- Other restaurants' data.
- Internal notes, pricing/admin, team review notes.
- Campaign controls.

## Internal-only data

- Reviewer id, internal note, raw rejection reason.
- Internal quality score / heuristics.
- Staff comments, team member ids.
- Audit logs, RLS/Supabase error strings.

Surfacing any of the above to a client surface is a bug. See
`src/lib/firstClient/visibilityRules.ts` for the enforced contract.
