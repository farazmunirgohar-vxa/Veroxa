/**
 * veroxaDataSource.ts — single source-of-truth for which data backend
 * the repository layer should attempt to use.
 *
 * Default: "demo" (uses bundled fixture data, no network).
 *
 * "supabase_readonly" means the read-only Supabase adapter scaffold
 * is allowed to attempt safe SELECT queries through existing read-only
 * adapters. Even in this mode the adapter MUST:
 *   - never call insert / update / delete / upsert / upload
 *   - never use a service-role key
 *   - fall back to demo data on any failure (RLS, missing env, error)
 *
 * This module is the canonical public switch for the repository layer.
 * `dataMode.ts` is a legacy M007 compatibility wrapper for older
 * client-portal read helpers; do not flip only `VITE_VEROXA_DATA_MODE`
 * for new repository work.
 *
 * The resolved mode is read from `VITE_VEROXA_DATA_SOURCE_MODE`.
 * Missing or invalid values resolve to "demo" — the safe default.
 */

import { DATA_MODE } from "./dataMode";

export type DataSourceMode = "demo" | "supabase_readonly";

const DEFAULT_DATA_SOURCE_MODE: DataSourceMode = "demo";

/**
 * Parse an arbitrary env string into a valid `DataSourceMode`.
 * Unknown / missing values resolve to the safe default ("demo").
 */
export function resolveDataSourceMode(value: string | undefined): DataSourceMode {
  if (value === "demo" || value === "supabase_readonly") return value;
  return DEFAULT_DATA_SOURCE_MODE;
}

export const VEROXA_DATA_SOURCE_MODE: DataSourceMode = resolveDataSourceMode(
  import.meta.env.VITE_VEROXA_DATA_SOURCE_MODE as string | undefined,
);

export function isDemoMode(): boolean {
  return VEROXA_DATA_SOURCE_MODE === "demo";
}

export function isSupabaseReadOnlyMode(): boolean {
  return VEROXA_DATA_SOURCE_MODE === "supabase_readonly";
}

/**
 * Returns the legacy M007 `DATA_MODE` compatibility value for
 * cross-reference. New code should make read decisions from
 * `VEROXA_DATA_SOURCE_MODE`; this is diagnostics-only.
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
