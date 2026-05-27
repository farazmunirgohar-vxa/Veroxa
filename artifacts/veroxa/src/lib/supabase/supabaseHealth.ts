/**
 * supabaseHealth.ts — DEV-only readiness checker for M007.
 *
 * Safely reports whether Supabase env/client/RLS is wired up enough for
 * read-only operation. Never:
 *  - exposes actual key/URL values
 *  - performs writes, uploads, or auth flips
 *  - uses the service role key
 */

import { getSupabaseEnv } from "./env";
import { getSupabaseClient } from "./client";
import { DATA_MODE } from "@/lib/data/dataMode";
import { AUTH_MODE } from "@/lib/auth/authMode";
import {
  MAMADALI_DEMO_CLIENT_ID,
  getClientById,
} from "./clientPortalQueries";

export type SupabaseReadTestStatus =
  | { kind: "not_attempted"; reason: string }
  | { kind: "ok"; rowsReturned: number }
  | { kind: "blocked"; message: string }
  | { kind: "error"; message: string };

export interface SupabaseHealthReport {
  authMode: typeof AUTH_MODE;
  dataMode: typeof DATA_MODE;
  envUrlConfigured: boolean;
  envAnonKeyConfigured: boolean;
  clientInitialised: boolean;
  readonlyModeActive: boolean;
  fixtureFallbackActive: boolean;
  lastReadTest: SupabaseReadTestStatus;
  warnings: string[];
}

/**
 * Performs a harmless read against a client-safe view. Returns a
 * structured status — never throws.
 */
export async function runReadTest(): Promise<SupabaseReadTestStatus> {
  const envState = getSupabaseEnv();
  if (!envState.ready) {
    return {
      kind: "not_attempted",
      reason: `Missing env: ${envState.missing.join(", ")}`,
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      kind: "not_attempted",
      reason: "Supabase client could not be initialised",
    };
  }

  try {
    const row = await getClientById(MAMADALI_DEMO_CLIENT_ID);
    if (!row) {
      return {
        kind: "blocked",
        message:
          "Read returned no row. RLS or missing authenticated session likely blocked the query. Fixture fallback remains active.",
      };
    }
    return { kind: "ok", rowsReturned: 1 };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { kind: "error", message };
  }
}

/**
 * Builds the full health report. Performs a single harmless read when
 * DATA_MODE is supabase_readonly.
 */
export async function getSupabaseHealthReport(): Promise<SupabaseHealthReport> {
  const envState = getSupabaseEnv();
  const envUrlConfigured = envState.ready
    ? true
    : !envState.missing.includes("VITE_SUPABASE_URL");
  const envAnonKeyConfigured = envState.ready
    ? true
    : !envState.missing.includes("VITE_SUPABASE_ANON_KEY");

  const clientInitialised = envState.ready && getSupabaseClient() !== null;
  const readonlyModeActive = DATA_MODE === "supabase_readonly" && clientInitialised;

  const warnings: string[] = [];
  if (DATA_MODE === "supabase_readonly" && !envState.ready) {
    warnings.push(
      "DATA_MODE is supabase_readonly but Supabase env vars are missing. The app will fall back to fixture data."
    );
  }
  if (DATA_MODE === "supabase_readonly" && AUTH_MODE === "placeholder") {
    warnings.push(
      "AUTH_MODE is placeholder while DATA_MODE is supabase_readonly. RLS-protected views may return no rows because there is no authenticated session."
    );
  }

  let lastReadTest: SupabaseReadTestStatus;
  if (DATA_MODE !== "supabase_readonly") {
    lastReadTest = {
      kind: "not_attempted",
      reason: "DATA_MODE is fixture — no Supabase read attempted.",
    };
  } else {
    lastReadTest = await runReadTest();
  }

  const fixtureFallbackActive =
    DATA_MODE === "fixture" ||
    lastReadTest.kind === "not_attempted" ||
    lastReadTest.kind === "blocked" ||
    lastReadTest.kind === "error";

  return {
    authMode: AUTH_MODE,
    dataMode: DATA_MODE,
    envUrlConfigured,
    envAnonKeyConfigured,
    clientInitialised,
    readonlyModeActive,
    fixtureFallbackActive,
    lastReadTest,
    warnings,
  };
}
