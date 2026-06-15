/**
 * useRealAuth — real Supabase session reader.
 *
 * Inactive while AUTH_MODE remains "placeholder". When activated, this hook
 * reads the authenticated session, validates user_profiles, requires active
 * account status, and requires an active restaurant_members row for client
 * users. It never writes, creates accounts, or uses service-role credentials.
 */

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { AuthState, VeroxaSession } from "./authContract";
import { resolveRealAuthAccess } from "./realAuthFoundation";

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

async function resolveSessionForUser(
  client: NonNullable<ReturnType<typeof getSupabaseClient>>,
  userId: string,
  email: string,
): Promise<AuthState> {
  try {
    const access = await resolveRealAuthAccess(client, { userId, email });

    if (!access.ok) {
      console.warn(
        "[useRealAuth] Real auth access denied; returning unauthenticated.",
        access.reason,
      );
      return UNAUTH_STATE;
    }

    const session: VeroxaSession = {
      userId,
      email: access.profile.email,
      role: access.profile.role,
      clientId: access.profile.clientId,
      displayName: access.profile.displayName,
      accountStatus: access.profile.status,
    };

    return { status: "authenticated", session, isDemoOnly: false };
  } catch (err) {
    console.warn(
      "[useRealAuth] Unexpected error resolving real auth access; returning unauthenticated.",
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
      setState(UNAUTH_STATE);
      return;
    }

    const realClient = client;
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
      const resolved = await resolveSessionForUser(realClient, userId, email);
      if (!cancelled) setState(resolved);
    }

    client.auth
      .getSession()
      .then(({ data }) => handleSession(data.session))
      .catch((err: unknown) => {
        console.warn("[useRealAuth] getSession failed; returning unauthenticated.", err);
        if (!cancelled) setState(UNAUTH_STATE);
      });

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
