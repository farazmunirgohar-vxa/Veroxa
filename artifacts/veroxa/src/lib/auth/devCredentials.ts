/**
 * devCredentials.ts — TEMPORARY placeholder-only login matcher.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  PRODUCTION REMOVAL REQUIRED                                        │
 * │                                                                     │
 * │  This file MUST be deleted (or replaced with a no-op stub) before  │
 * │  AUTH_MODE is ever switched to "real". It contains plain-text       │
 * │  dev passwords that have no place in a production bundle.           │
 * │                                                                     │
 * │  Deletion checklist:                                                │
 * │  1. Delete this file.                                               │
 * │  2. Remove the placeholder branch in src/pages/login.tsx that      │
 * │     imports `validateDevCredentials` / `getDevRouteForRole`.        │
 * │  3. Confirm AUTH_MODE === "real" routes exclusively through the     │
 * │     Supabase signInWithPassword path in login.tsx.                  │
 * │  4. Confirm no service-role key appears anywhere in the frontend    │
 * │     bundle (only VITE_SUPABASE_ANON_KEY is allowed).               │
 * │                                                                     │
 * │  AUTH_MODE must NOT be switched to "real" until this file is       │
 * │  removed and the Supabase manual setup is complete. See:            │
 * │  docs/AUTH_MODE_SWITCH_PLAN.md                                      │
 * │  docs/MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md                          │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Safe today because:
 *   - only runs while AUTH_MODE === "placeholder" (compile-time constant)
 *   - no Supabase client, no network calls, no hashing
 *   - no production users created or modified
 *   - no backend writes
 *   - dev passwords are meaningless outside the placeholder flow
 *   - credentials are never surfaced in the login UI
 */

import { getRoleHomePath, type VeroxaRole } from "./authContract";

export interface DevCredential {
  role: VeroxaRole;
  email: string;
  password: string;
}

/**
 * Placeholder development credentials for internal review only.
 * Plain-text by design — no production secrets, no real accounts.
 * Operator and Owner credentials intentionally omitted (portals parked).
 */
export const DEV_ROLE_CREDENTIALS: readonly DevCredential[] = [
  { role: "client", email: "faraz@client.com", password: "farazclient" },
  { role: "team",   email: "faraz@team.com",   password: "farazteam"   },
] as const;

/**
 * Returns the matching role if the email+password pair matches a dev
 * credential, otherwise `null`. Email is matched case-insensitively.
 * Only called when AUTH_MODE === "placeholder".
 */
export function validateDevCredentials(
  emailOrId: string,
  password: string,
): VeroxaRole | null {
  const normalizedEmail = emailOrId.trim().toLowerCase();
  if (!normalizedEmail || !password) return null;
  const match = DEV_ROLE_CREDENTIALS.find(
    (c) => c.email === normalizedEmail && c.password === password,
  );
  return match?.role ?? null;
}

/**
 * Where a dev-logged-in role should land — the canonical real-review
 * routes (/client/dashboard, /team/dashboard) rather than /demo/* paths.
 * Operator and Owner are parked; they fall back to /login.
 * Only called when AUTH_MODE === "placeholder".
 */
export function getDevRouteForRole(role: VeroxaRole): string {
  if (role === "operator" || role === "owner") return "/login";
  return getRoleHomePath(role);
}
