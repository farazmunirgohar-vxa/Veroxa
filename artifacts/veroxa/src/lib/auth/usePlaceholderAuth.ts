/**
 * usePlaceholderAuth — placeholder hook, UI shell only.
 *
 * **Note (Real Auth V1 session-layer pass):** `useRealAuth.ts` now
 * exists and is fully wired, but `RequireRole` still reaches this
 * hook through the `useAuth()` wrapper (`./useAuth.ts`) because
 * `AUTH_MODE` (`./authMode.ts`) is locked to `"placeholder"`. This
 * prevents accidental route-protection changes before:
 *   - `user_profiles` is reviewed / applied,
 *   - at least one test user is provisioned in Supabase Auth,
 *   - sign-out and redirect behavior are agreed.
 *
 *
 * Always returns an unauthenticated state. No Supabase calls, no cookies,
 * no localStorage, no network. This exists purely so that the RequireRole
 * shell and the future `/client`, `/team`, `/operator`, `/owner`
 * placeholder pages can be wired against a stable hook signature today,
 * then swapped to a real implementation later without changing call
 * sites.
 *
 * This hook is intentionally shaped like the future real auth hook
 * (see `./authContract.ts` → `AuthState`). Later, the implementation
 * behind this hook (or its replacement, e.g. `useRealAuth`) will call
 * Supabase Auth (`getSession` + `onAuthStateChange`) and join
 * `user_profiles` to resolve `role` and `clientId`. None of that runs
 * today. The return shape will not change — only the implementation —
 * so `RequireRole` and every `Real*Placeholder` continue to work
 * untouched.
 */

import type { AuthState } from "./authContract";

/**
 * @deprecated Prefer `AuthState` from `./authContract`. Kept as an
 * alias so older imports do not break.
 */
export type PlaceholderAuthState = AuthState;

export function usePlaceholderAuth(): AuthState {
  return {
    status: "unauthenticated",
    session: null,
    isDemoOnly: true,
  };
}
