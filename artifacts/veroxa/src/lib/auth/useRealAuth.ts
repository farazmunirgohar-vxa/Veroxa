/**
 * useRealAuth — real Supabase session reader.
 *
 * **Currently INACTIVE.** This hook is fully wired but the app
 * routes through `useAuth()` which selects `usePlaceholderAuth` while
 * `AUTH_MODE === "placeholder"`. See `./authMode.ts`.
 *
 * Behavior once activated:
 *   1. Initial state: `{ status: "loading", session: null, isDemoOnly: false }`.
 *   2. On mount, calls `supabase.auth.getSession()`.
 *   3. If a session exists, reads the user's row from `user_profiles`
 *      (single row, by `user_id`). Resolves `role`, `clientId`,
 *      `displayName`.
 *   4. Subscribes to `supabase.auth.onAuthStateChange` and updates
 *      state on every transition. Cleans up on unmount.
 *
 * Safety:
 *   - **No writes.** No `insert` / `update` / `delete` / `upsert`.
 *   - **No profile creation.** If `user_profiles` is missing or has
 *     no row for this user, the hook returns `unauthenticated` and
 *     `console.warn`s. The app does not crash.
 *   - **No service role.** Uses only `VITE_SUPABASE_ANON_KEY`.
 *   - **No custom token storage.** Whatever Supabase Auth does
 *     internally for session storage is what we use. The current
 *     shared client has `persistSession: false` /
 *     `autoRefreshToken: false`, which means sessions do not survive
 *     a reload — that is intentional for this inactive phase and will
 *     be revisited when `AUTH_MODE` flips.
 *   - **Graceful env handling.** If Supabase env vars are missing,
 *     `getSupabaseClient()` returns `null` and this hook returns
 *     `unauthenticated` without throwing.
 */

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { AuthState, VeroxaSession } from "./authContract";
import { isVeroxaRole } from "./authContract";

const LOADING_STATE: AuthState = {
  status: "loading",
  session: null,
  isDemoOnly: false,
};

const UNAUTH_STATE: AuthState = {
  status: "unauthenticated",
  session: null,
  isDemoOnly: false,
};

interface UserProfileRow {
  user_id?: string;
  role?: unknown;
  client_id?: string | null;
  display_name?: string | null;
}

async function resolveSessionForUser(
  client: NonNullable<ReturnType<typeof getSupabaseClient>>,
  userId: string,
  email: string,
): Promise<AuthState> {
  try {
    const { data, error } = await client
      .from("user_profiles")
      .select("user_id, role, client_id, display_name")
      .eq("user_id", userId)
      .maybeSingle<UserProfileRow>();

    if (error) {
      console.warn(
        "[useRealAuth] Failed to read user_profiles; returning unauthenticated.",
        error.message,
      );
      return UNAUTH_STATE;
    }

    if (!data || !isVeroxaRole(data.role)) {
      console.warn(
        "[useRealAuth] No matching user_profiles row or invalid role; returning unauthenticated.",
      );
      return UNAUTH_STATE;
    }

    const session: VeroxaSession = {
      userId,
      email,
      role: data.role,
      clientId: data.client_id ?? null,
      displayName: data.display_name ?? null,
    };

    return { status: "authenticated", session, isDemoOnly: false };
  } catch (err) {
    console.warn(
      "[useRealAuth] Unexpected error resolving user_profiles; returning unauthenticated.",
      err,
    );
    return UNAUTH_STATE;
  }
}

export function useRealAuth(): AuthState {
  const [state, setState] = useState<AuthState>(LOADING_STATE);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      // env vars missing — already warned by getSupabaseClient.
      setState(UNAUTH_STATE);
      return;
    }

    let cancelled = false;

    async function handleSession(supabaseSession: {
      user?: { id?: string | null; email?: string | null } | null;
    } | null): Promise<void> {
      if (!supabaseSession || !supabaseSession.user?.id) {
        if (!cancelled) setState(UNAUTH_STATE);
        return;
      }
      const userId = supabaseSession.user.id;
      const email = supabaseSession.user.email ?? "";
      const resolved = await resolveSessionForUser(client!, userId, email);
      if (!cancelled) setState(resolved);
    }

    // Initial session read.
    client.auth
      .getSession()
      .then(({ data }) => handleSession(data.session))
      .catch((err: unknown) => {
        console.warn("[useRealAuth] getSession failed; returning unauthenticated.", err);
        if (!cancelled) setState(UNAUTH_STATE);
      });

    // Subscribe to auth state changes.
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      void handleSession(session);
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  return state;
}
