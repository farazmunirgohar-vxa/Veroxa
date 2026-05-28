/**
 * veroxaDataSource.ts — single source-of-truth for which data backend
 * the repository layer should attempt to use.
 *
 * Default: "demo" (uses bundled fixture data, no network).
 *
 * "supabase_readonly" means the read-only Supabase adapter scaffold
 * is allowed to attempt safe SELECT queries. Even in this mode the
 * adapter MUST:
 *   - never call insert / update / delete / upsert / upload
 *   - never use a service-role key
 *   - fall back to demo data on any failure (RLS, missing env, error)
 *
 * This module is the public switch for the repository layer.
 * It is intentionally separate from `dataMode.ts` (M007) so the
 * read-only operations foundation can evolve independently of the
 * legacy client-portal queries.
 *
 * For now the default mode is hard-coded to "demo". A future build
 * can wire this to an env flag — until then everything reads fixtures.
 */

import { DATA_MODE } from "./dataMode";

export type DataSourceMode = "demo" | "supabase_readonly";

/**
 * Hard-coded default. Do NOT change to "supabase_readonly" without
 * also auditing every repository call path for safe fallback.
 */
const DEFAULT_DATA_SOURCE_MODE: DataSourceMode = "demo";

export const VEROXA_DATA_SOURCE_MODE: DataSourceMode = DEFAULT_DATA_SOURCE_MODE;

export function isDemoMode(): boolean {
  return VEROXA_DATA_SOURCE_MODE === "demo";
}

export function isSupabaseReadOnlyMode(): boolean {
  return VEROXA_DATA_SOURCE_MODE === "supabase_readonly";
}

/**
 * Returns the underlying M007 `DATA_MODE` value for cross-reference.
 * Useful for diagnostics pages that show both flags side-by-side.
 */
export function getLegacyDataMode(): typeof DATA_MODE {
  return DATA_MODE;
}

/**
 * Human-readable label for diagnostics pages.
 */
export function getDataSourceModeLabel(mode: DataSourceMode = VEROXA_DATA_SOURCE_MODE): string {
  switch (mode) {
    case "demo":
      return "Demo repository layer (fixtures only — no network)";
    case "supabase_readonly":
      return "Supabase read-only adapter (scaffold only — not active)";
  }
}
