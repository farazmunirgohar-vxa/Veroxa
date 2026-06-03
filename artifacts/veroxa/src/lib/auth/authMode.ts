/**
 * Auth mode toggle — single switch that decides whether the app uses
 * the placeholder auth hook or the real Supabase auth hook.
 *
 * Flip this to `"real"` once:
 *   - `user_profiles` table has been applied to Supabase,
 *   - at least one test user per role is provisioned in Supabase Auth,
 *   - `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are configured in Vercel environment variables / local env.
 *
 * The Supabase client (`src/lib/supabase/client.ts`) uses
 * `{ persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }`,
 * so sessions survive page reloads.
 *
 * No env-based automatic switching. No security-sensitive behavior.
 */

export type AuthMode = "placeholder" | "real";

export const AUTH_MODE: AuthMode = "placeholder";
