/**
 * uploadSubmissionsReadOnly.ts — M023E
 *
 * Safe, read-only adapter that lets the Team Upload Inbox display real
 * `public.upload_submissions` rows when a safe read mode is enabled,
 * while always preserving the fixture/demo fallback.
 *
 * Hard rules (mirrors supabaseReadOnlyData.ts / supabaseReadOnlyClient.ts):
 *   - Only runs when DATA_MODE === "supabase_readonly"
 *     (VITE_VEROXA_DATA_MODE). Default is "fixture" → never touches network.
 *   - Reads through the anon read-only client only (no service-role key,
 *     no writes, no insert/update/delete/upsert, no storage).
 *   - Never throws. Any missing env, missing table, RLS block, empty
 *     result, or error resolves to a non-live envelope and the caller
 *     keeps showing fixtures.
 *   - Metadata only. No file bytes, no raw filenames (the table never
 *     stores them — file labels here are derived from the category).
 *
 * The returned items reuse the existing `DemoUploadSubmission` shape so
 * the inbox renders them with the same UI. `restaurantId` is carried as
 * the real UUID purely for structural compatibility; it is not rendered
 * and triage on live rows is in-memory only (no writes are allowed here).
 */

import { isSupabaseReadonlyMode } from "./dataMode";
import {
  getReadOnlySupabaseClient,
  type ReadOnlyHandle,
} from "@/lib/supabase/supabaseReadOnlyClient";
import { demoUploadCategoryLabels } from "@/data/uploadKeys/demoRestaurantUploadKeys";
import type {
  DemoUploadSubmission,
  DemoUploadCategory,
  DemoUploadPriority,
  DemoUploadStatus,
} from "@/data/uploadKeys/demoUploadSubmissions";
import type { DemoRestaurantId } from "@/data/uploadKeys/demoRestaurantUploadKeys";

export type UploadInboxReadStatus = "live" | "fallback" | "skipped";

export interface UploadInboxReadResult {
  status: UploadInboxReadStatus;
  items: DemoUploadSubmission[];
  error: string | null;
}

const MAX_ROWS = 100;

const CATEGORY_VALUES = new Set<DemoUploadCategory>([
  "food_photo",
  "kitchen_prep",
  "restaurant_atmosphere",
  "menu_special",
  "short_video",
  "other",
]);

const PRIORITY_VALUES = new Set<DemoUploadPriority>([
  "use_anytime",
  "use_next",
  "save_for_weekend",
  "google_post",
  "reel_tiktok_idea",
]);

const STATUS_VALUES = new Set<DemoUploadStatus>([
  "received",
  "in_review",
  "accepted",
  "needs_better_photo",
  "saved_for_later",
]);

function coerceCategory(v: unknown): DemoUploadCategory {
  return typeof v === "string" && CATEGORY_VALUES.has(v as DemoUploadCategory)
    ? (v as DemoUploadCategory)
    : "other";
}

function coercePriority(v: unknown): DemoUploadPriority {
  return typeof v === "string" && PRIORITY_VALUES.has(v as DemoUploadPriority)
    ? (v as DemoUploadPriority)
    : "use_anytime";
}

function coerceStatus(v: unknown): DemoUploadStatus {
  return typeof v === "string" && STATUS_VALUES.has(v as DemoUploadStatus)
    ? (v as DemoUploadStatus)
    : "received";
}

function formatSubmittedAt(iso: unknown): string {
  if (typeof iso !== "string") return "Recently";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Recently";
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? `Today, ${time}`
    : `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${time}`;
}

function genericRestaurantLabel(id: string): string {
  const short = id.length > 8 ? id.slice(0, 8) : id;
  return `Restaurant ${short}`;
}

interface UploadSubmissionRowShape {
  id: unknown;
  restaurant_id: unknown;
  category: unknown;
  priority: unknown;
  note: unknown;
  submitted_by_label: unknown;
  status: unknown;
  created_at: unknown;
}

function skipped(error: string): UploadInboxReadResult {
  return { status: "skipped", items: [], error };
}

function fallback(error: string): UploadInboxReadResult {
  return { status: "fallback", items: [], error };
}

/**
 * Read recent upload submissions for the Team Upload Inbox.
 *
 * Returns `status: "live"` only when the read-only client is available,
 * the query succeeds, and at least one row comes back. Every other path
 * (fixture mode, missing env, init failure, error, empty result) returns
 * a non-live status with an empty item list so the caller falls back to
 * fixtures. Never throws.
 */
export async function readUploadSubmissionsInbox(): Promise<UploadInboxReadResult> {
  if (!isSupabaseReadonlyMode()) {
    return skipped("DATA_MODE is fixture — upload_submissions read not attempted.");
  }

  const state = getReadOnlySupabaseClient();
  if (!state.available) {
    const reason =
      state.reason === "missing_env"
        ? `Supabase env not configured (${state.missing.join(", ")}).`
        : "Supabase read-only client could not be initialized.";
    return fallback(`${reason} Fixture fallback remains active.`);
  }

  try {
    const { data, error } = await state.client
      .from("upload_submissions")
      .select(
        "id, restaurant_id, category, priority, note, submitted_by_label, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS);

    if (error) {
      return fallback(
        `upload_submissions read blocked (${error.message}). Fixture fallback remains active.`,
      );
    }

    const rows = (data ?? []) as UploadSubmissionRowShape[];
    if (rows.length === 0) {
      return fallback(
        "No upload_submissions rows visible (empty or RLS-blocked). Fixture fallback remains active.",
      );
    }

    // Resolve restaurant display names through a separate safe read. If it
    // fails or is RLS-blocked, fall back to a generic per-id label rather
    // than failing the whole inbox read.
    const nameById = await readClientDisplayNames(state.client);

    const items: DemoUploadSubmission[] = rows
      .filter((r): r is UploadSubmissionRowShape & { id: string; restaurant_id: string } =>
        typeof r.id === "string" && typeof r.restaurant_id === "string",
      )
      .map((r) => {
        const category = coerceCategory(r.category);
        const restaurantName =
          nameById.get(r.restaurant_id) ?? genericRestaurantLabel(r.restaurant_id);
        return {
          id: r.id,
          // Real UUID carried for structural compatibility only — not rendered.
          restaurantId: r.restaurant_id as DemoRestaurantId,
          restaurantName,
          category,
          priority: coercePriority(r.priority),
          note: typeof r.note === "string" ? r.note : "",
          // The table never stores raw filenames; derive a generic label.
          fileLabel: demoUploadCategoryLabels[category],
          fileKind: category === "short_video" ? "video" : "image",
          submittedAtLabel: formatSubmittedAt(r.created_at),
          status: coerceStatus(r.status),
          demoOnly: true,
        } satisfies DemoUploadSubmission;
      });

    if (items.length === 0) {
      return fallback("upload_submissions rows could not be mapped. Fixture fallback remains active.");
    }

    return { status: "live", items, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fallback(`upload_submissions read failed: ${message}. Fixture fallback remains active.`);
  }
}

/**
 * Best-effort lookup of `clients.display_name` keyed by client id. Never
 * throws; returns an empty map when the read is unavailable or blocked.
 */
async function readClientDisplayNames(
  client: ReadOnlyHandle,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const { data, error } = await client
      .from("clients")
      .select("id, display_name")
      .limit(MAX_ROWS);
    if (error || !Array.isArray(data)) return map;
    for (const row of data as Array<{ id: unknown; display_name: unknown }>) {
      if (typeof row.id === "string" && typeof row.display_name === "string") {
        map.set(row.id, row.display_name);
      }
    }
  } catch {
    /* swallow — generic labels will be used */
  }
  return map;
}
