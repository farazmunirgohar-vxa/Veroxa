/**
 * devCredentials.ts — TEMPORARY placeholder-only login matcher.
 *
 * Placeholder credentials are preview-only and are read from Vite env first.
 * A public preview fallback is available for local and Vercel preview review,
 * or by explicit opt-in. VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN=false disables
 * the fallback. This is not production auth and contains no real secret.
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
  source: "env" | "public-preview-fallback";
}

export interface PlaceholderCredentialStatus {
  isConfigured: boolean;
  envCredentialCount: number;
  publicPreviewFallbackEnabled: boolean;
  statusLabel: "Preview access ready" | "Preview access not enabled";
  helperText: string;
}

const DEV_CLIENT_EMAIL_ENV = "VITE_VEROXA_DEV_CLIENT_EMAIL";
const DEV_CLIENT_PASSWORD_ENV = "VITE_VEROXA_DEV_CLIENT_PASSWORD";
const DEV_TEAM_EMAIL_ENV = "VITE_VEROXA_DEV_TEAM_EMAIL";
const DEV_TEAM_PASSWORD_ENV = "VITE_VEROXA_DEV_TEAM_PASSWORD";
const PUBLIC_PREVIEW_LOGIN_FLAG = "VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN";

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
  return { role, email, password, source: "env" };
}

function isPreviewFriendlyHostname(): boolean {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname.toLowerCase();
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".vercel.app")
  );
}

function publicPreviewFallbackEnabled(): boolean {
  const explicitFlag = readViteEnv(PUBLIC_PREVIEW_LOGIN_FLAG);
  if (explicitFlag === "false") return false;
  if (explicitFlag === "true") return true;
  return import.meta.env.DEV || isPreviewFriendlyHostname();
}

function getPublicPreviewFallbackCredentials(): readonly DevCredential[] {
  if (!publicPreviewFallbackEnabled()) return [];
  return [
    {
      role: "client",
      email: "faraz@client.com",
      password: "farazclient",
      source: "public-preview-fallback",
    },
    {
      role: "team",
      email: "faraz@team.com",
      password: "farazteam",
      source: "public-preview-fallback",
    },
  ];
}
function getEnvRoleCredentials(): readonly DevCredential[] {
  return [
    credentialFromEnv("client", DEV_CLIENT_EMAIL_ENV, DEV_CLIENT_PASSWORD_ENV),
    credentialFromEnv("team", DEV_TEAM_EMAIL_ENV, DEV_TEAM_PASSWORD_ENV),
  ].filter((credential): credential is DevCredential => Boolean(credential));
}

/**
 * Placeholder development credentials for internal review only.
 * Env values always win; fallback credentials are intentionally obvious,
 * non-secret placeholder credentials for preview review only.
 */
export function getDevRoleCredentials(): readonly DevCredential[] {
  return [...getEnvRoleCredentials(), ...getPublicPreviewFallbackCredentials()];
}

/**
 * True when at least one placeholder role can sign in.
 * Used only to clarify preview login copy; never exposes credential values.
 */
export function hasConfiguredDevCredentials(): boolean {
  return getDevRoleCredentials().length > 0;
}

export function getPlaceholderCredentialStatus(): PlaceholderCredentialStatus {
  const envCredentialCount = getEnvRoleCredentials().length;
  const publicPreviewFallback = publicPreviewFallbackEnabled();
  const isConfigured = envCredentialCount > 0 || publicPreviewFallback;
  return {
    isConfigured,
    envCredentialCount,
    publicPreviewFallbackEnabled: publicPreviewFallback,
    statusLabel: isConfigured
      ? "Preview access ready"
      : "Preview access not enabled",
    helperText: isConfigured
      ? "Preview access is enabled for Veroxa review. Use the provided client or team preview credentials."
      : "Preview access is off for this review environment. Ask Veroxa to enable preview access before signing in.",
  };
}

/**
 * Returns the matching role if the email+password pair matches an env-supplied
 * or explicitly enabled public-preview credential, otherwise `null`. Email is
 * matched case-insensitively. Only called when AUTH_MODE === "placeholder".
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
