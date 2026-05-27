/**
 * supabaseReadOnlyData.ts — M007 + M008 read-only adapter.
 *
 * Thin, fail-safe wrappers around the existing client_portal_* view queries
 * in `@/lib/supabase`. Every function:
 *   - Only runs when DATA_MODE === "supabase_readonly".
 *   - Returns either:
 *       - low-level: { ok, data, error, source }   (M007 envelope)
 *       - high-level normalized: ReadOnlyEnvelope<T>  (M008 envelope)
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
import type {
  ClientPortalAccountProfile,
  ClientPortalCalendarItem,
  ClientPortalGoogleSnapshot,
  ClientPortalMediaItem,
  ClientPortalReportPreview,
  ClientPortalRequestItem,
  ClientPortalSummary,
  ClientPortalUpdateItem,
  ReadOnlyEnvelope,
} from "./clientPortalReadOnlyTypes";
import {
  transformAccountProfile,
  transformCalendarList,
  transformMediaList,
  transformReportList,
  transformSummary,
} from "./clientPortalTransforms";

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

// ── Low-level public API (M007) ──────────────────────────────────

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

// ── High-level normalized API (M008) ─────────────────────────────
//
// Each `getClientPortal*ReadOnly` returns ReadOnlyEnvelope<T> with a
// transformed, UI-safe payload. Callers (pages / hooks) just check
// envelope.status === "live" before swapping fixtures for real data.

function liveEnvelope<T>(data: T): ReadOnlyEnvelope<T> {
  return { status: "live", data, error: null };
}

function fallbackEnvelope<T>(reason: string): ReadOnlyEnvelope<T> {
  return { status: "fallback", data: null, error: reason };
}

function skippedEnvelope<T>(reason: string): ReadOnlyEnvelope<T> {
  return { status: "skipped", data: null, error: reason };
}

function lift<TLow, TOut>(
  low: ReadOnlyResult<TLow>,
  map: (v: TLow) => TOut
): ReadOnlyEnvelope<TOut> {
  if (low.ok) return liveEnvelope(map(low.data));
  if (low.source === "fallback") return fallbackEnvelope(low.error);
  return skippedEnvelope(low.error);
}

export async function getClientPortalSummaryReadOnly(
  clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyEnvelope<ClientPortalSummary>> {
  const blocked = preflight();
  if (blocked) {
    const reason = blocked.error ?? "Read not attempted.";
    return blocked.source === "fallback"
      ? fallbackEnvelope(reason)
      : skippedEnvelope(reason);
  }

  try {
    const [client, platforms, media, calendar, weekly, monthly] = await Promise.all([
      getClientById(clientId).catch(() => null),
      getClientPlatforms(clientId).catch(() => []),
      getClientMediaAssets(clientId).catch(() => []),
      getClientCalendar(clientId).catch(() => []),
      getClientWeeklyReports(clientId).catch(() => []),
      getClientMonthlyReports(clientId).catch(() => []),
    ]);

    const looksEmpty =
      !client &&
      platforms.length === 0 &&
      media.length === 0 &&
      calendar.length === 0 &&
      weekly.length === 0 &&
      monthly.length === 0;

    if (looksEmpty) return fallbackEnvelope(RLS_BLOCKED_MESSAGE);

    const latestMonthly = (monthly[0] ?? null) as Record<string, unknown> | null;
    const summary = transformSummary(client as Record<string, unknown> | null, {
      platformsCount: platforms.length,
      mediaAssetsCount: media.length,
      postsCount: calendar.length,
      weeklyReportsCount: weekly.length,
      monthlyReportsCount: monthly.length,
      latestReportStatus:
        (latestMonthly?.status as string | undefined) ?? "Available",
    });
    return liveEnvelope(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fallbackEnvelope(`Summary read failed: ${message}.`);
  }
}

export async function getClientPortalMediaReadOnly(
  clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyEnvelope<ClientPortalMediaItem[]>> {
  const low = await getReadOnlyMediaAssets(clientId);
  return lift(low, (rows) => transformMediaList(rows));
}

export async function getClientPortalCalendarReadOnly(
  clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyEnvelope<ClientPortalCalendarItem[]>> {
  const low = await getReadOnlyPostSlots(clientId);
  return lift(low, (rows) => transformCalendarList(rows));
}

export async function getClientPortalReportsReadOnly(
  clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyEnvelope<{
  weekly: ClientPortalReportPreview[];
  monthly: ClientPortalReportPreview[];
}>> {
  const blocked = preflight();
  if (blocked) {
    const reason = blocked.error ?? "Read not attempted.";
    return blocked.source === "fallback"
      ? fallbackEnvelope(reason)
      : skippedEnvelope(reason);
  }
  try {
    const [weekly, monthly] = await Promise.all([
      getClientWeeklyReports(clientId).catch(() => []),
      getClientMonthlyReports(clientId).catch(() => []),
    ]);
    if (weekly.length === 0 && monthly.length === 0) {
      return fallbackEnvelope(RLS_BLOCKED_MESSAGE);
    }
    return liveEnvelope({
      weekly: transformReportList(weekly, "weekly"),
      monthly: transformReportList(monthly, "monthly"),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fallbackEnvelope(`Reports read failed: ${message}.`);
  }
}

export function getClientPortalUpdatesReadOnly(
  _clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyEnvelope<ClientPortalUpdateItem[]>> {
  // Updates are sourced from notifications + activity_logs, neither of
  // which have a client-safe view yet (see PORTAL_QUERY_SAFETY_PLAN.md).
  // Until a view exists, the updates page stays on fixtures.
  return Promise.resolve(
    skippedEnvelope("Updates feed has no client-safe view yet. Fixture-only.")
  );
}

export function getClientPortalRequestsReadOnly(
  _clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyEnvelope<ClientPortalRequestItem[]>> {
  // client_requests has no client-safe view yet. Fixture-only until one
  // is added — same safety rationale as updates.
  return Promise.resolve(
    skippedEnvelope("Client requests have no client-safe view yet. Fixture-only.")
  );
}

export function getClientPortalGoogleSnapshotReadOnly(
  _clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyEnvelope<ClientPortalGoogleSnapshot>> {
  // No client-safe Google Business view exists. Always fixture for now.
  return Promise.resolve(
    skippedEnvelope("Google snapshot has no client-safe view yet. Fixture-only.")
  );
}

export async function getClientPortalAccountReadOnly(
  clientId: string = DEFAULT_CLIENT_ID
): Promise<ReadOnlyEnvelope<ClientPortalAccountProfile>> {
  const low = await getReadOnlyClientSummary(clientId);
  return lift(low, (row) => transformAccountProfile(row as Record<string, unknown> | null));
}
