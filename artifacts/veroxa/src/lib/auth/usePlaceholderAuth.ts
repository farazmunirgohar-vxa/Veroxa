/**
 * usePlaceholderAuth — placeholder hook, UI shell only.
 *
 * Always returns an unauthenticated state. No Supabase calls, no cookies,
 * no localStorage, no network. This exists purely so that the RequireRole
 * shell and the future /client, /team, /operator, /owner placeholder pages
 * can be wired against a stable hook signature today, then swapped to a
 * real implementation later without changing call sites.
 *
 * When real auth ships, the implementation behind this hook (or its
 * replacement) will call Supabase Auth (getSession + onAuthStateChange)
 * and join user_profiles to resolve role and clientId. None of that runs
 * today.
 */

import type { AuthStatus, PlaceholderSession } from "./types";

export interface PlaceholderAuthState {
  status: AuthStatus;
  session: PlaceholderSession | null;
  isDemoOnly: true;
}

export function usePlaceholderAuth(): PlaceholderAuthState {
  return {
    status: "unauthenticated",
    session: null,
    isDemoOnly: true,
  };
}
