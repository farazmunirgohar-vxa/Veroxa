/**
 * useAuth — unified auth hook wrapper.
 *
 * Selects between the placeholder hook (today) and the real Supabase
 * hook (later) based on `AUTH_MODE` from `./authMode.ts`.
 *
 * Today `AUTH_MODE === "placeholder"`, so this is a thin pass-through
 * to `usePlaceholderAuth` — call sites (e.g. `RequireRole`) get the
 * exact same `AuthState` they got before.
 *
 * When `AUTH_MODE` flips to `"real"` (after manual review of
 * `user_profiles` + test users), every call site automatically picks
 * up `useRealAuth` with no further code changes.
 *
 * Rules of Hooks note: `AUTH_MODE` is a module-level constant, so the
 * branch is statically known per build — the hook call order is
 * stable.
 */

import type { AuthState } from "./authContract";
import { AUTH_MODE } from "./authMode";
import { usePlaceholderAuth } from "./usePlaceholderAuth";
import { useRealAuth } from "./useRealAuth";

export function useAuth(): AuthState {
  // Module-level constant — branch is stable per build.
  if (AUTH_MODE === "real") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useRealAuth();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePlaceholderAuth();
}
