/**
 * dataMode.ts — legacy DATA_MODE compatibility switch (M007)
 *
 * Canonical read-data switch for new repository code:
 *   VITE_VEROXA_DATA_SOURCE_MODE via `veroxaDataSource.ts`.
 *
 * This module remains for older client-portal read-only helpers that still
 * import `DATA_MODE`. It intentionally mirrors the canonical switch when the
 * legacy env var is not set, so future builders do not accidentally flip
 * `VITE_VEROXA_DATA_MODE` while the repository layer keeps using fixtures.
 *
 * Separate from AUTH_MODE. AUTH_MODE controls how the user signs in.
 * Read-data mode controls where portal/repository data may be read from.
 * Neither switch enables writes.
 *
 * Modes:
 *  - "fixture"            — default. Use bundled demo data. No network.
 *  - "supabase_readonly"  — allow read-only Supabase SELECT attempts through
 *                           existing scaffolded adapters. Any missing env,
 *                           RLS denial, network error, or query error must
 *                           fall back safely to fixture/empty states.
 *
 * Env compatibility:
 *  - Preferred: VITE_VEROXA_DATA_SOURCE_MODE="demo" | "supabase_readonly"
 *  - Legacy:    VITE_VEROXA_DATA_MODE="fixture" | "supabase_readonly"
 *
 * Resolution order:
 *  1. A valid legacy VITE_VEROXA_DATA_MODE value wins for old M007 helpers.
 *  2. Otherwise VITE_VEROXA_DATA_SOURCE_MODE="supabase_readonly" maps to
 *     DATA_MODE="supabase_readonly".
 *  3. Everything else resolves to DATA_MODE="fixture".
 *
 * This switch is intentionally narrow:
 *   - It MUST NOT enable any writes, uploads, or AI calls.
 *   - It MUST NOT bypass RLS.
 *   - It MUST NOT change AUTH_MODE.
 */

export type DataMode = "fixture" | "supabase_readonly";

const RAW_LEGACY: string | undefined = (import.meta.env.VITE_VEROXA_DATA_MODE as string | undefined)?.trim();
const RAW_CANONICAL: string | undefined = (import.meta.env.VITE_VEROXA_DATA_SOURCE_MODE as string | undefined)?.trim();

function resolveDataMode(
  legacyValue: string | undefined,
  canonicalValue: string | undefined,
): DataMode {
  if (legacyValue === "fixture" || legacyValue === "supabase_readonly") return legacyValue;
  if (canonicalValue === "supabase_readonly") return "supabase_readonly";
  return "fixture";
}

export const DATA_MODE: DataMode = resolveDataMode(RAW_LEGACY, RAW_CANONICAL);

export function isFixtureMode(): boolean {
  return DATA_MODE === "fixture";
}

export function isSupabaseReadonlyMode(): boolean {
  return DATA_MODE === "supabase_readonly";
}
