/**
 * Veroxa Auth Contract — types + constants only.
 *
 * This is the single source of truth for the SHAPE of Veroxa's future
 * real auth layer. It defines roles, session shape, status, and role
 * home paths so that:
 *
 *   - `usePlaceholderAuth` (today, returns unauthenticated)
 *   - the future `useRealAuth` (later, reads Supabase session)
 *
 * share the exact same return type, and `RequireRole` and all real
 * route placeholders only need one swap point.
 *
 * Strictly type-level + pure constants. NO runtime side effects:
 *   - no Supabase
 *   - no fetch / network
 *   - no cookies / localStorage
 *   - no AI / external SDKs
 *
 * See docs/AUTH_ARCHITECTURE_PLAN.md and
 *     docs/PRE_AUTH_TECHNICAL_CHECKLIST.md.
 */

export type VeroxaRole = "client" | "team" | "operator" | "owner";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/** Shape of a resolved Veroxa session once real auth ships. */
export interface VeroxaSession {
  userId: string;
  email: string;
  role: VeroxaRole;
  /** Only populated for `client` role; `null` for staff roles. */
  clientId: string | null;
  displayName: string | null;
}

/** Return type for any Veroxa auth hook (placeholder or real). */
export interface AuthState {
  status: AuthStatus;
  session: VeroxaSession | null;
  /** True while no real auth is wired (today). */
  isDemoOnly: boolean;
}

/**
 * Where each role should land after a successful real login. These are
 * the real (`/client`, `/team`, ...) paths, never `/demo/*`.
 */
export const ROLE_HOME_PATH: Readonly<Record<VeroxaRole, string>> = Object.freeze({
  client:   "/client/dashboard",
  team:     "/team/dashboard",
  operator: "/operator/overview",
  owner:    "/owner/dashboard",
});

export function getRoleHomePath(role: VeroxaRole): string {
  return ROLE_HOME_PATH[role];
}

/**
 * Fallback landing paths used during the placeholder / pre-launch phase.
 *
 * - `client`   → `/demo/client/dashboard` — public demo preview (no login).
 * - `team`     → `/team/dashboard`        — real team portal (InternalDemoGuard).
 * - `operator` → `/login`                 — parked; no active route.
 * - `owner`    → `/login`                 — parked; no active route.
 *
 * NOT the post-login real-auth home. For that, use `ROLE_HOME_PATH` /
 * `getRoleHomePath`. These paths are only consulted for wrong-role fallback
 * redirects inside `InternalDemoGuard` when `AUTH_MODE === "real"`.
 */
export const DEMO_ROLE_HOME_PATH: Readonly<Record<VeroxaRole, string>> = Object.freeze({
  client:   "/demo/client/dashboard",
  team:     "/team/dashboard",
  operator: "/login",
  owner:    "/login",
});

export function getDemoRoleHomePath(role: VeroxaRole): string {
  return DEMO_ROLE_HOME_PATH[role];
}

const ALL_ROLES: readonly VeroxaRole[] = ["client", "team", "operator", "owner"] as const;

export function isVeroxaRole(value: unknown): value is VeroxaRole {
  return typeof value === "string" && (ALL_ROLES as readonly string[]).includes(value);
}
