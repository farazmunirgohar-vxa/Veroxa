/**
 * supabaseReadiness.ts — safe diagnostic layer for the read-only
 * Supabase adapter scaffold.
 *
 * This module performs ZERO writes, uploads, AI calls, payments,
 * publishing, or auth flips. It only reports what is and isn't
 * configured, so internal diagnostic pages can render an honest
 * status without crashing when env vars are missing.
 */

import { getSupabaseEnv } from "@/lib/supabase/env";
import {
  getReadOnlySupabaseClient,
  isReadOnlySupabaseAvailable,
} from "@/lib/supabase/supabaseReadOnlyClient";
import { AUTH_MODE } from "@/lib/auth/authMode";
import {
  VEROXA_DATA_SOURCE_MODE,
  getDataSourceModeLabel,
} from "@/lib/data/veroxaDataSource";

export interface SupabaseReadinessStatus {
  dataSourceMode: typeof VEROXA_DATA_SOURCE_MODE;
  dataSourceModeLabel: string;
  authMode: typeof AUTH_MODE;
  envUrlConfigured: boolean;
  envAnonKeyConfigured: boolean;
  clientInitialised: boolean;
  readOnlyAdapterAvailable: boolean;
  realAuthActive: boolean;
  writesEnabled: boolean;
  storageUploadsEnabled: boolean;
  aiApisEnabled: boolean;
  publishingIntegrationsEnabled: boolean;
  paymentIntegrationsEnabled: boolean;
}

export function getSupabaseReadinessStatus(): SupabaseReadinessStatus {
  const env = getSupabaseEnv();
  const envUrlConfigured = env.ready ? true : !env.missing.includes("VITE_SUPABASE_URL");
  const envAnonKeyConfigured = env.ready ? true : !env.missing.includes("VITE_SUPABASE_ANON_KEY");
  const state = getReadOnlySupabaseClient();
  const clientInitialised = state.available;

  return {
    dataSourceMode: VEROXA_DATA_SOURCE_MODE,
    dataSourceModeLabel: getDataSourceModeLabel(),
    authMode: AUTH_MODE,
    envUrlConfigured,
    envAnonKeyConfigured,
    clientInitialised,
    readOnlyAdapterAvailable: isReadOnlySupabaseAvailable(),
    // The following are hard-coded false. The app does not enable
    // any of these in this placeholder phase. Any change to these flags
    // requires explicit owner sign-off and a separate prompt.
    realAuthActive: AUTH_MODE !== "placeholder",
    writesEnabled: false,
    storageUploadsEnabled: false,
    aiApisEnabled: false,
    publishingIntegrationsEnabled: false,
    paymentIntegrationsEnabled: false,
  };
}

export function getMissingSupabaseRequirements(): string[] {
  const env = getSupabaseEnv();
  if (env.ready) return [];
  return env.missing;
}

export function getReadOnlyConnectionNotes(): string[] {
  const notes: string[] = [
    "Backend connection is not live. The Veroxa repository layer reads only from bundled demo fixtures.",
    "Real auth, real AI, real publishing, real payments, and storage uploads are NOT enabled.",
    "The read-only Supabase adapter is scaffolded but inactive. Even when active it cannot write.",
  ];
  const missing = getMissingSupabaseRequirements();
  if (missing.length > 0) {
    notes.push(
      `Missing env: ${missing.join(", ")} — the read-only adapter will stay in safe unavailable mode.`,
    );
  }
  if (AUTH_MODE === "placeholder") {
    notes.push(
      "AUTH_MODE is placeholder. RLS-protected views would return no rows even if the adapter were active.",
    );
  }
  return notes;
}

export function isReadOnlyModeAvailable(): boolean {
  const status = getSupabaseReadinessStatus();
  return status.readOnlyAdapterAvailable && status.dataSourceMode === "supabase_readonly";
}
