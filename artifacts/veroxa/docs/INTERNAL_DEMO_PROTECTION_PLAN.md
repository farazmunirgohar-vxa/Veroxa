# Internal Demo Protection Plan

> **Docs only.** Nothing in this plan is implemented yet. No PIN, no
> internal login, no env-based hiding, no cookies, no `localStorage`,
> no auth check on demo routes.

## Why this exists

Team, Operator, and Owner demo routes
(`/demo/team/*`, `/demo/operator/*`, `/demo/owner/*`) are valuable
**during development** for internal walkthroughs, alignment, and
shaping the real product. They are **not** appropriate as
long-term public surfaces because they reveal Veroxa's operating
system and would dilute the product narrative for prospects.

The client demo (`/demo/client/*`) is different — it is the sales
surface and is intentionally kept public.

See [`ROUTE_VISIBILITY_STRATEGY.md`](./ROUTE_VISIBILITY_STRATEGY.md)
for the visibility rule.

## Possible future protection options

Listed roughly in increasing complexity / commitment:

1. **Preview access PIN.** A shared internal PIN, entered once per
   session, gates `/demo/team`, `/demo/operator`, `/demo/owner`.
   Low cost, low security — fine for "not publicly indexed."
2. **Owner-only login.** Reuse real Supabase Auth (once it exists)
   and only allow `owner` (or a new `internal_preview`) role to view
   internal demo routes.
3. **Internal preview role.** Dedicated `internal_preview` role in
   `user_profiles` for teammates / advisors who should see internal
   demos but never touch real client data.
4. **Environment-based visibility.** Internal demo routes register
   only when `VITE_VEROXA_ENV !== "production"`. Cheap, but couples
   the build to the audience.
5. **Separate internal demo domain / path.** Host internal demos at
   e.g. `internal.veroxa.app/demo/...` and keep `veroxa.app` clean.

These options are not mutually exclusive — for example, "environment
gate now, real role check later" is a reasonable trajectory.

## Recommended staged path

- **Now (active development):** leave internal demos public; they
  are easier to share and review.
- **Before public sales use:** hide Team / Operator / Owner demo
  links from any public navigation (no link should leak from `/` or
  `/demo`).
- **Before serious launch:** require internal preview access for
  `/demo/team`, `/demo/operator`, `/demo/owner`.
- **Production:** only `/demo/client/*` remains a public preview;
  everything else internal is behind real auth or a separate
  domain.

## Out of scope for now

- No PIN entry component.
- No `internal_preview` role.
- No environment gating logic.
- No domain split.
- No cookies / `localStorage` for preview access.

Revisit only after Real Auth V1 lands and the visibility timeline
becomes urgent. See
[`NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md`](./NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md).
