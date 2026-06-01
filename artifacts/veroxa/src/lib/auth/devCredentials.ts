/**
 * devCredentials.ts — TEMPORARY placeholder-only login matcher.
 *
 * Placeholder credentials are preview-only and are read from Vite env at
 * runtime. The source intentionally contains no usable passwords; missing env
 * credentials make the placeholder matcher return null (safe invalid login).
 *
 * AUTH_MODE must NOT be switched to "real" until this placeholder file and the
 * placeholder branch in login.tsx are removed. See:
 *   docs/AUTH_MODE_SWITCH_PLAN.md
 *   docs/MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md
 */

import { getRoleHomePath, type VeroxaRole } from "./authContract";

export interface DevCredential {
  role: VeroxaRole;
  email: string;
  password: string;
}

const DEV_CLIENT_EMAIL_ENV = "VITE_VEROXA_DEV_CLIENT_EMAIL";
const DEV_CLIENT_PASSWORD_ENV = "VITE_VEROXA_DEV_CLIENT_PASSWORD";
const DEV_TEAM_EMAIL_ENV = "VITE_VEROXA_DEV_TEAM_EMAIL";
const DEV_TEAM_PASSWORD_ENV = "VITE_VEROXA_DEV_TEAM_PASSWORD";

function readViteEnv(name: string): string | null {
  const value = (import.meta.env as Record<string, unknown>)[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function credentialFromEnv(
  role: VeroxaRole,
  emailEnv: string,
  passwordEnv: string,
): DevCredential | null {
  const email = readViteEnv(emailEnv)?.toLowerCase();
  const password = readViteEnv(passwordEnv);
  if (!email || !password) return null;
  return { role, email, password };
}

/**
 * Placeholder development credentials for internal review only.
 * Values must be supplied through Vite env; no source-defined password exists.
 */
export function getDevRoleCredentials(): readonly DevCredential[] {
  return [
    credentialFromEnv("client", DEV_CLIENT_EMAIL_ENV, DEV_CLIENT_PASSWORD_ENV),
    credentialFromEnv("team", DEV_TEAM_EMAIL_ENV, DEV_TEAM_PASSWORD_ENV),
  ].filter((credential): credential is DevCredential => Boolean(credential));
}

/**
 * True when at least one placeholder role has env-supplied credentials.
 * Used only to clarify preview login copy; never exposes credential values.
 */
export function hasConfiguredDevCredentials(): boolean {
  return getDevRoleCredentials().length > 0;
}

/**
 * Returns the matching role if the email+password pair matches an env-supplied
 * dev credential, otherwise `null`. Email is matched case-insensitively.
 * Only called when AUTH_MODE === "placeholder".
 */
export function validateDevCredentials(
  emailOrId: string,
  password: string,
): VeroxaRole | null {
  const normalizedEmail = emailOrId.trim().toLowerCase();
  if (!normalizedEmail || !password) return null;
  const match = getDevRoleCredentials().find(
    (credential) => credential.email === normalizedEmail && credential.password === password,
  );
  return match?.role ?? null;
}

/**
 * Where a dev-logged-in role should land — the canonical real-review
 * routes (/client/dashboard, /team/dashboard) rather than /demo/* paths.
 * Only called when AUTH_MODE === "placeholder".
 */
export function getDevRouteForRole(role: VeroxaRole): string {
  return getRoleHomePath(role);
}
