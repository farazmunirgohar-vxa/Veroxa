/**
 * dataMode.ts — DATA_MODE switch (M007)
 *
 * Separate from AUTH_MODE. AUTH_MODE controls how the user signs in.
 * DATA_MODE controls where portal data comes from.
 *
 * Modes:
 *  - "fixture"            — default. Use bundled demo data. No network.
 *  - "supabase_readonly"  — attempt read-only queries against the dev
 *                           Supabase project via the existing
 *                           client_portal_* views. Falls back to
 *                           fixture data if env vars are missing or any
 *                           query fails (RLS, network, etc.).
 *
 * Controlled by env: VITE_VEROXA_DATA_MODE.
 * Invalid or missing values resolve to "fixture".
 *
 * This switch is intentionally narrow:
 *   - It MUST NOT enable any writes, uploads, or AI calls.
 *   - It MUST NOT bypass RLS.
 *   - It MUST NOT change AUTH_MODE.
 */

export type DataMode = "fixture" | "supabase_readonly";

const RAW: string | undefined = (import.meta.env.VITE_VEROXA_DATA_MODE as string | undefined)?.trim();

function resolveDataMode(value: string | undefined): DataMode {
  if (value === "supabase_readonly") return "supabase_readonly";
  return "fixture";
}

export const DATA_MODE: DataMode = resolveDataMode(RAW);

export function isFixtureMode(): boolean {
  return DATA_MODE === "fixture";
}

export function isSupabaseReadonlyMode(): boolean {
  return DATA_MODE === "supabase_readonly";
}
