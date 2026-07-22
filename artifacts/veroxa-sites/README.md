# Veroxa Systems — Sites Delivery Layer

This is the GitHub-synchronized ChatGPT Sites application for Veroxa. GitHub remains the canonical product source; this checkout is the Sites lifecycle copy used for verified checkpoint deployment.

## Production boundaries

- Sites access is public for the marketing pages and signed audit-intake route; Client and Team routes require a verified Supabase session plus active database membership.
- Momo's House San Antonio is the only operational client and restaurant workspace.
- Supabase Auth verifies signed sessions; server route guards and database RLS independently enforce Team/Momo membership.
- Public Auth user creation is disabled. Team and future Momo identities must be created through a supported Supabase Admin path. Approved active identities may use password sign-in or a secure email link; a fresh email-link session is the no-account-enumeration recovery path for replacing a forgotten password.
- The portal accepts password creation/replacement only from a session signed in within the last 24 hours and requires 12–72 ASCII characters with uppercase, lowercase, number, supported symbol, and no spaces. This recent-session rule is a bypassable UI guard until hosted secure password change is enabled and verified. The browser checks new passwords against HIBP Pwned Passwords with a padded five-character SHA-1 prefix before Supabase Auth receives the password; this is also defense in depth, not a substitute for native Auth-boundary leaked-password enforcement, which remains unavailable on the current Supabase Free plan.
- `/team/audits` is the standalone Restaurant Audit Center for non-client restaurants.
- Public audit intake is validated, consented, idempotent, HMAC-gated, rate-limited, and stored separately from operational client tables.
- Audit records never create client accounts, onboarding, media/content workflows, publishing access, or operational workspaces automatically.
- Sites D1/R2 remain unused so Supabase stays the single source of truth.
- Public marketing and audit-intake routes are anonymous. Protected portal data is never rendered from a public shell.

Required hosted variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `AUDIT_INTAKE_HMAC_SECRET` (secret; must match the protected Supabase intake configuration)

## Momo readiness model

Momo readiness has three deliberately separate states:

1. **Implemented and tested:** the repository contains the Team-only image editor, immutable media lineage, provider-neutral AI contract, three-channel publication rehearsal, bounded retry/dead-letter/recovery, source-specific metrics, tracking, public-evidence SEO planning, exact owner consent, and account-handoff controls.
2. **Preconnection verified:** the protected Supabase gate requires recent release evidence plus durable, private rehearsals. A pass means only that Team Faraz may request narrowly scoped owner access. It never enables a provider or public write.
3. **Live activation:** real-owner authority, confirmed business facts and rights, exact action approval, owner-controlled manager access, provider credentials, delivery/read-back checks, and any separately approved cost are still required. The activation result remains false until a later release explicitly changes that boundary.

The temporary iCloud Client identity is classified as a development proxy, not Momo owner evidence. Momo-facing routes receive plain requests, drafts, decisions, schedules, and approved reports only; AI, automation, provider, queue, retry, readiness, and technical evidence remain Team-only. Team can run the complete no-cost disconnected rehearsal from one protected action without contacting Meta, Google, an AI provider, or Momo's owner.

## Runtime foundation

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Linux with `flock`, `curl`, and GNU `timeout`

## Sites Lifecycle

The Sites lifecycle CLI runs the locked dependency install before returning this checkout. Edit the source under `app/`, then checkpoint when a coherent milestone is ready to inspect or share. The remote Sites builder runs `npm run build` against the pushed commit. Do not repeat install or build as a normal pre-checkpoint step.

This starter does not use `wrangler.jsonc`.

`install:ci` is intentionally a single, non-retrying `npm ci`. It refuses a concurrent install for the same project, consumes a matching image-seeded npm cache with `--prefer-offline` while retaining registry fallback for a missing cache object, otherwise downloads and verifies the complete vinext tarball recorded in `package-lock.json`, limits npm to one socket, and terminates a stalled install. `build` applies a short timeout and then validates the Sites artifact. These helpers target Linux and use GNU `timeout`; they are not native macOS scripts.

Scripts that need writable project-scoped home, npm, XDG, and temporary paths use `scripts/sites-env.sh`. The `dev` and `start` scripts honor the caller's runtime environment and keep Wrangler logs inside the checkout. The generated `.sites-runtime/` directory is disposable and ignored by Git.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Diagnostic Commands

- `npm run install:ci`: perform the one bounded lockfile install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build and validate the deployable Sites artifact
- `npm run start`: start the built Vinext application
- `npm test`: build, validate, and verify the rendered development-preview metadata
- `npm run validate:artifact`: recheck an existing artifact's manifest and ESM `default.fetch` export
- `npm run db:generate`: generate Drizzle migrations after schema changes

Use build and validation commands for targeted diagnosis after a remote failure, not as part of the normal checkpoint path.

The timeout defaults can be overridden for a controlled canary with `SITES_INSTALL_TIMEOUT`, `SITES_INSTALL_KILL_AFTER`, `SITES_BUILD_TIMEOUT`, and `SITES_BUILD_KILL_AFTER`. A timeout fails the command; the helpers never retry an unchanged install or build.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
