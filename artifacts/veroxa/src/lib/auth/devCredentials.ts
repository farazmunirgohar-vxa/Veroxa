/**
 * devCredentials.ts — TEMPORARY development-only login matcher.
 *
 * Used solely while AUTH_MODE === "placeholder" so the active role portals
 * (Client / Team) can be previewed without activating real Supabase auth.
 * This file is intentionally easy to delete when real auth ships:
 *   - no Supabase
 *   - no network
 *   - no hashing / secrets / service-role key
 *   - no production users
 *   - no backend writes
 *
 * To remove: delete this file and the placeholder branch in
 * `src/pages/login.tsx` that imports `validateDevCredentials` /
 * `getDevRouteForRole`. The real-auth branch already routes via
 * `getRoleHomePath` from `./authContract`.
 */

import { getRoleHomePath, type VeroxaRole } from "./authContract";

export interface DevCredential {
  role: VeroxaRole;
  email: string;
  password: string;
}

/**
 * Temporary development credentials. Plain-text by design — this file is
 * never bundled into a real auth flow and contains no production secrets.
 */
export const DEV_ROLE_CREDENTIALS: readonly DevCredential[] = [
  { role: "client", email: "faraz@client.com", password: "farazclient" },
  { role: "team",   email: "faraz@team.com",   password: "farazteam"   },
  // operator and owner are parked; credentials removed from active login.
] as const;

/**
 * Returns the matching role if the email + password pair is one of the
 * dev credentials above, otherwise `null`. Email is matched
 * case-insensitively; password is matched exactly.
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
 * Where a dev-logged-in role should land — the canonical real-review routes
 * (/client/dashboard, /team/dashboard) rather than /demo/* paths.
 * Operator and Owner are parked; they fall back to /login.
 */
export function getDevRouteForRole(role: VeroxaRole): string {
  // Operator and owner are parked in the current build.
  if (role === "operator" || role === "owner") return "/login";
  return getRoleHomePath(role);
}
