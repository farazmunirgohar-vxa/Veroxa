/**
 * supabaseReadOnlyData.ts — M007 read-only adapter.
 *
 * Thin, fail-safe wrappers around the existing client_portal_* view queries
 * in `@/lib/supabase`. Each function:
 *   - Only runs when DATA_MODE === "supabase_readonly".
 *   - Returns { ok, data, error, source } so callers can decide whether to
 *     show real data or fall back to fixtures.
 *   - Never throws. Caller is responsible for picking the fallback.
 *   - Never writes, inserts, updates, deletes, or uploads.
 *   - Only reads through client-safe views (see PORTAL_QUERY_SAFETY_PLAN.md).
 *
 * RLS-safe message: when AUTH_MODE === "placeholder" and DATA_MODE is
 * supabase_readonly, RLS will usually block reads because there is no
 * authenticated session. The adapter detects this and returns:
 *   "Supabase read blocked by RLS or missing authenticated session. Fixture fallback remains active."
 */

import {
  MAMADALI_DEMO_CLIENT_ID,
  getClientById,
  getClientPlatforms,
  getClientMediaAssets,
  getClientCalendar,
  getClientWeeklyReports,
  getClientMonthlyReports,
} from "@/lib/supabase";
import { isSupabaseReadonlyMode } from "./dataMode";
import { getSupabaseEnv } from "@/lib/supabase/env";

export type ReadOnlySource = "supabase_readonly" | "skipped" | "fallback";

export type ReadOnlyResult<T> =
  | { ok: true;  source: "supabase_readonly"; data: T;       error: null }
  | { ok: false; source: "skipped";           data: null;    error: string }
  | { ok: false; source: "fallback";          data: null;    error: string };

const RLS_BLOCKED_MESSAGE =
  "Supabase read blocked by RLS or missing authenticated session. Fixture fallback remains active.";

const DEFAULT_CLIENT_ID = MAMADALI_DEMO_CLIENT_ID;

// ── Internal helpers ─────────────────────────────────────────────

function skipped(reason: string): ReadOnlyResult<never> {
  return { ok: false, source: "skipped", data: null, error: reason };
}

function fallback(reason: string): ReadOnlyResult<never> {
  return { ok: false, source: "fallback", data: null, error: reason };
}

function ok<T>(data: T): ReadOnlyResult<T> {
  return { ok: true, source: "supabase_readonly", data, error: null };
}

function preflight(): ReadOnlyResult<never> | null {
  if (!isSupabaseReadonlyMode()) {
    return skipped("DATA_MODE is fixture — Supabase read not attempted.");
  }
  const env = getSupabaseEnv();
  if (!env.ready) {
    return fallback(
      `Supabase env not configured (${env.missing.join(", ")}). Fixture fallback remains active.`
    );
  }
  return null;
}

async function safeRead<T>(
  fn: () => Promise<T>,
  emptyCheck?: (value: T) => boolean
): Promise<ReadOnlyResult<T>> {
  const blocked = preflight();
  if (blocked) return blocked as ReadOnlyResult<T>;

  try {
    const data = await fn();
    if (emptyCheck && emptyCheck(data)) {
      return fallback(RLS_BLOCKED_MESSAGE) as ReadOnlyResult<T>;
    }
    return ok(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fallback(`Supabase read failed: ${message}. Fixture fallback remains active.`) as ReadOnlyResult<T>;
  }
}

// ── Public read-only API ─────────────────────────────────────────

/**
 * Returns the single demo client row (placeholder for a future
 * "list clients" endpoint that would require its own client-safe view).
 */
export function getReadOnlyClients(): Promise<ReadOnlyResult<unknown[]>> {
  return safeRead(
    async () => {
      const row = await getClientById(DEFAULT_CLIENT_ID);
      return row ? [row] : [];
    },
    (rows) => rows.length === 0
  );
}

export function getReadOnlyClientSummary(
  clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyResult<unknown>> {
  return safeRead(
    () => getClientById(clientId),
    (row) => row == null
  );
}

export function getReadOnlyMediaAssets(
  clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyResult<unknown[]>> {
  return safeRead(() => getClientMediaAssets(clientId));
}

export function getReadOnlyPlatforms(
  clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyResult<unknown[]>> {
  return safeRead(() => getClientPlatforms(clientId));
}

/**
 * Post slots have NO client-safe view by design — see PORTAL_QUERY_SAFETY_PLAN.md.
 * Calendar items are exposed via the calendar view instead.
 */
export function getReadOnlyPostSlots(
  clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyResult<unknown[]>> {
  return safeRead(() => getClientCalendar(clientId));
}

export function getReadOnlyNotifications(
  _clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyResult<unknown[]>> {
  return Promise.resolve(
    skipped("Notifications have no client-safe view yet. Fixture-only.") as ReadOnlyResult<unknown[]>
  );
}

export function getReadOnlyLatestHealthSnapshot(
  _clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyResult<unknown>> {
  return Promise.resolve(
    skipped("Client health snapshots have no client-safe view yet. Fixture-only.") as ReadOnlyResult<unknown>
  );
}

export function getReadOnlyWeeklyReports(
  clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyResult<unknown[]>> {
  return safeRead(() => getClientWeeklyReports(clientId));
}

export function getReadOnlyMonthlyReports(
  clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyResult<unknown[]>> {
  return safeRead(() => getClientMonthlyReports(clientId));
}
