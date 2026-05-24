/**
 * usePlaceholderAuth — placeholder hook, UI shell only.
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
