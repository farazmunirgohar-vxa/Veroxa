import { getSupabaseClient } from "./client";

/**
 * Default demo client UUID. The portal seeds a single demo client with this
 * canonical id; all read-only adapter fallbacks default to it. Previously
 * named `MAMADALI_DEMO_CLIENT_ID`; the alias is kept for backward compat
 * within this module's import graph and will be removed in a later pass.
 */
export const DEFAULT_DEMO_CLIENT_ID = "00000000-0000-0000-0000-000000000001";
/** @deprecated Use DEFAULT_DEMO_CLIENT_ID. */
export const MAMADALI_DEMO_CLIENT_ID = DEFAULT_DEMO_CLIENT_ID;

// ─────────────────────────────────────────────────────────────────────────────
// PORTAL QUERY SAFETY CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
// Every function in this file MUST read from a `client_portal_*` view only.
// Direct reads of the following base tables are FORBIDDEN here:
//   clients, client_platforms, onboarding_items, client_requests,
//   media_assets, notifications, client_health_snapshots, posts, post_slots,
//   weekly_reports, monthly_reports, content_concepts, draft_sets,
//   draft_variants, ai_agents, activity_logs, team_members,
//   team_client_assignments, user_profiles.
//
// Rationale: base-table client RLS scopes ROWS but not COLUMNS, so a raw
// `.from("clients")` call would leak monthly_fee_cents, risk_status,
// internal_note, approved_by_user_id, etc. to the client role.
//
// See: artifacts/veroxa/docs/PORTAL_QUERY_SAFETY_PLAN.md
// See: artifacts/veroxa/docs/PORTAL_QUERY_SAFETY_CHECKLIST.md
//
// This file is inert while AUTH_MODE === "placeholder" — the portal runs on
// demo fixtures and never reaches Supabase. The contract activates the
// moment AUTH_MODE flips to "real".
// ─────────────────────────────────────────────────────────────────────────────

function db() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      "[supabase] Cannot run query — Supabase client is not initialised. " +
        "Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set."
    );
  }
  return client;
}

export async function getClientById(clientId: string) {
  const { data, error } = await db()
    .from("client_portal_clients_view")
    .select("*")
    .eq("client_id", clientId)
    .single();
  if (error) throw new Error(`[supabase] getClientById: ${error.message}`);
  return data;
}

export async function getClientPlatforms(clientId: string) {
  const { data, error } = await db()
    .from("client_portal_platforms_view")
    .select("*")
    .eq("client_id", clientId);
  if (error) throw new Error(`[supabase] getClientPlatforms: ${error.message}`);
  return data ?? [];
}

export async function getClientMediaAssets(clientId: string) {
  const { data, error } = await db()
    .from("client_portal_media_view")
    .select("*")
    .eq("client_id", clientId)
    .order("uploaded_at", { ascending: false });
  if (error)
    throw new Error(`[supabase] getClientMediaAssets: ${error.message}`);
  return data ?? [];
}

// Replaces the prior getClientPosts + getClientPostSlots base-table reads.
// The calendar view already filters to post_status in ('scheduled','published')
// and exposes only client-safe columns (no caption_text, no draft_variant_id,
// no approved_by_user_id, no publish_failure_reason).
export async function getClientCalendar(clientId: string) {
  const { data, error } = await db()
    .from("client_portal_calendar_view")
    .select("*")
    .eq("client_id", clientId)
    .order("scheduled_for", { ascending: true, nullsFirst: false });
  if (error)
    throw new Error(`[supabase] getClientCalendar: ${error.message}`);
  return data ?? [];
}

export async function getClientWeeklyReports(clientId: string) {
  // View column is `week_start` (not `week_start_date`). View is filtered to
  // status='published' and exposes client_safe_summary + client_safe_summary_json
  // only — raw summary_json, internal_validation_note, and owner ids are hidden.
  // TODO(M005-view): if the portal ever needs posts_published / posts_planned /
  // completion_rate from the weekly report row, extend the view rather than
  // reading from public.weekly_reports here.
  const { data, error } = await db()
    .from("client_portal_weekly_reports_view")
    .select("*")
    .eq("client_id", clientId)
    .order("week_start", { ascending: false });
  if (error)
    throw new Error(`[supabase] getClientWeeklyReports: ${error.message}`);
  return data ?? [];
}

export async function getClientMonthlyReports(clientId: string) {
  // View column is `month_key` (text "YYYY-MM"). Lexicographic DESC ordering
  // matches chronological DESC because the format is zero-padded.
  // TODO(M005-view): if the portal ever needs posts_published / posts_planned /
  // completion_rate / status from the monthly report, extend the view rather
  // than reading from public.monthly_reports here.
  const { data, error } = await db()
    .from("client_portal_monthly_reports_view")
    .select("*")
    .eq("client_id", clientId)
    .order("month_key", { ascending: false });
  if (error)
    throw new Error(`[supabase] getClientMonthlyReports: ${error.message}`);
  return data ?? [];
}

// NOTE: getClientDraftVariants and getClientPostSlots were intentionally
// removed. draft_variants is a staff-only table (M006) and post_slots has
// no client-safe view by design. The client portal must not read either.
