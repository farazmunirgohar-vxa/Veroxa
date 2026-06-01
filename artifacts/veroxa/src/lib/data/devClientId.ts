/**
 * devClientId.ts — M025A
 *
 * Read the optional `VITE_VEROXA_DEV_CLIENT_ID` env var and validate
 * it is a UUID before using it for dev Supabase writes.
 *
 * This env var is dev-only. It should NEVER be committed to any env
 * file or appear in production builds. It is only used when
 * `VITE_VEROXA_ENABLE_DEV_WRITES === "true"`, `VITE_VEROXA_DEV_WRITE_ENV === "dev"`, and a non-production build.
 *
 * Why "demo-a" is not sent to Supabase:
 *   The `direction_requests.restaurant_id` column is a UUID FK
 *   referencing `clients.id`. The string "demo-a" is not a valid UUID
 *   and would cause a FK violation. A real UUID from a dev-created
 *   fictional `clients` row is required.
 *
 * No network. No Supabase. No real data.
 */

import { isValidUuid, normalizeDevClientId } from "./devClientIdValidation";

export const DEV_CLIENT_ID_ENV_VAR = "VITE_VEROXA_DEV_CLIENT_ID" as const;

/**
 * Read `VITE_VEROXA_DEV_CLIENT_ID` from import.meta.env.
 * Returns the trimmed UUID string if valid, `null` otherwise.
 */
export function getDevClientIdFromEnv(): string | null {
  const raw = (import.meta.env as Record<string, unknown>)[DEV_CLIENT_ID_ENV_VAR];
  return normalizeDevClientId(raw);
}

/**
 * Returns true if `VITE_VEROXA_DEV_CLIENT_ID` is set to a valid UUID.
 */
export function isDevClientIdReady(): boolean {
  return isValidUuid(
    (import.meta.env as Record<string, unknown>)[DEV_CLIENT_ID_ENV_VAR],
  );
}
