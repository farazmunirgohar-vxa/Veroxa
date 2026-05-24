/**
 * Auth mode toggle — single switch that decides whether the app uses
 * the placeholder auth hook (today, default) or the real Supabase
 * auth hook (later, after manual review of `user_profiles` and test
 * users).
 *
 * **Locked to `"placeholder"` until explicit approval to flip.**
 * Flipping this requires (see
 * `docs/REAL_AUTH_READINESS_CHECKLIST.md` → "Session persistence —
 * activation decision"):
 *   - `user_profiles` table reviewed and applied,
 *   - at least one test user provisioned in Supabase Auth,
 *   - sign-out and route-redirect behavior agreed,
 *   - production RLS plan ready
 *     (see `docs/PRODUCTION_RLS_FINALIZATION_CHECKLIST.md`),
 *   - **session-persistence decision made for
 *     `src/lib/supabase/client.ts`** — that client currently uses
 *     `{ persistSession: false, autoRefreshToken: false }`, so a
 *     real session will not survive a reload and tokens will not
 *     auto-refresh. Either accept this for the first real-auth
 *     phase or change the config (or use a separate client for
 *     auth) before flipping `AUTH_MODE` to `"real"`.
 *
 * No env-based automatic switching. No security-sensitive behavior.
 */

export type AuthMode = "placeholder" | "real";

export const AUTH_MODE: AuthMode = "placeholder";
