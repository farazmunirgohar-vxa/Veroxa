import type { SupabaseClient } from "@supabase/supabase-js";
import type { Uuid } from "@/domain/liveAutomation/databaseTypes";

export const TEAM_CONTROL_CENTER_SOURCE_TYPES = ["media_asset", "message", "profile_correction", "activity_log", "ai_draft", "approval", "report_future_state"] as const;
export const TEAM_CONTROL_CENTER_PRIORITIES = ["high", "medium", "low"] as const;
export const TEAM_CONTROL_CENTER_SAFETY_LABELS = ["internal_only", "needs_faraz_review", "needs_owner_confirmation", "client_visible_risk", "report_future_input"] as const;

export type TeamControlCenterSourceType = (typeof TEAM_CONTROL_CENTER_SOURCE_TYPES)[number];
export type TeamControlCenterPriority = (typeof TEAM_CONTROL_CENTER_PRIORITIES)[number];
export type TeamControlCenterSafetyLabel = (typeof TEAM_CONTROL_CENTER_SAFETY_LABELS)[number];

export interface TeamControlCenterWorkItem {
  id: string;
  restaurant_id: Uuid;
  source_type: TeamControlCenterSourceType;
  source_id: string;
  title: string;
  status: string;
  priority: TeamControlCenterPriority;
  created_at: string;
  route_href: string;
  safety_label: TeamControlCenterSafetyLabel;
}

export interface TeamControlCenterSummary {
  work_needing_review: number;
  client_visible_risk_or_owner_confirmation: number;
  ai_drafts_needing_review: number;
  messages_needing_reply: number;
  profile_corrections_pending: number;
  media_needing_review: number;
  recent_activity: number;
  reports_future_state: "Reports are built in PR #108.";
}

type Row = Record<string, any>;

async function countRows(client: SupabaseClient, table: string, statuses?: string[], restaurantId?: Uuid): Promise<number> {
  let query = client.from(table).select("id", { count: "exact", head: true });
  if (statuses?.length) query = query.in("status", statuses);
  if (restaurantId) query = query.eq("restaurant_id", restaurantId);
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

async function listRows(client: SupabaseClient, table: string, statuses: string[] | undefined, restaurantId: Uuid | undefined, limit: number): Promise<Row[]> {
  let query = client.from(table).select("*").order("created_at", { ascending: false }).limit(limit);
  if (statuses?.length) query = query.in("status", statuses);
  if (restaurantId) query = query.eq("restaurant_id", restaurantId);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as Row[];
}

export async function getTeamControlCenterSummary(client: SupabaseClient): Promise<TeamControlCenterSummary> {
  return getRestaurantScopedControlCenterSummary(client);
}

export async function getRestaurantScopedControlCenterSummary(client: SupabaseClient, restaurantId?: Uuid): Promise<TeamControlCenterSummary> {
  const [media, messages, corrections, activity, drafts, approvals] = await Promise.all([
    countRows(client, "media_assets", ["uploaded", "under_veroxa_review", "better_version_helpful"], restaurantId),
    countRows(client, "messages", ["unread"], restaurantId),
    countRows(client, "profile_corrections", ["requested", "under_veroxa_review", "needs_owner_input"], restaurantId),
    countRows(client, "activity_log", undefined, restaurantId),
    countRows(client, "ai_drafts", ["drafted", "ready_for_faraz_review", "needs_owner_input"], restaurantId),
    countRows(client, "approvals", ["pending", "needs_owner_confirmation"], restaurantId),
  ]);
  return {
    work_needing_review: media + messages + corrections + drafts + approvals,
    client_visible_risk_or_owner_confirmation: corrections + approvals,
    ai_drafts_needing_review: drafts,
    messages_needing_reply: messages,
    profile_corrections_pending: corrections,
    media_needing_review: media,
    recent_activity: activity,
    reports_future_state: "Reports are built in PR #108.",
  };
}

function item(row: Row, source_type: TeamControlCenterSourceType, route_href: string, title: string, priority: TeamControlCenterPriority, safety_label: TeamControlCenterSafetyLabel): TeamControlCenterWorkItem {
  return { id: `${source_type}:${row.id}`, restaurant_id: row.restaurant_id, source_type, source_id: row.id, title, status: row.status ?? row.event_type ?? "review", priority, created_at: row.created_at, route_href, safety_label };
}

export async function listTeamControlCenterWorkItems(client: SupabaseClient, restaurantId?: Uuid): Promise<TeamControlCenterWorkItem[]> {
  const [media, messages, corrections, activity, drafts, approvals] = await Promise.all([
    listRows(client, "media_assets", ["uploaded", "under_veroxa_review", "better_version_helpful"], restaurantId, 10),
    listRows(client, "messages", ["unread"], restaurantId, 10),
    listRows(client, "profile_corrections", ["requested", "under_veroxa_review", "needs_owner_input"], restaurantId, 10),
    listRows(client, "activity_log", undefined, restaurantId, 10),
    listRows(client, "ai_drafts", ["drafted", "ready_for_faraz_review", "needs_owner_input"], restaurantId, 10),
    listRows(client, "approvals", ["pending", "needs_owner_confirmation"], restaurantId, 10),
  ]);
  return [
    ...media.map((r) => item(r, "media_asset", "/team/upload-inbox", "Media needs Veroxa review", "medium", "needs_faraz_review")),
    ...messages.map((r) => item(r, "message", "/team/messages", "Portal message needs reply", "high", "client_visible_risk")),
    ...corrections.map((r) => item(r, "profile_correction", "/team/profile-corrections", "Profile correction needs review", r.status === "needs_owner_input" ? "high" : "medium", r.status === "needs_owner_input" ? "needs_owner_confirmation" : "needs_faraz_review")),
    ...drafts.map((r) => item(r, "ai_draft", "/team/ai-drafts", "AI draft needs Faraz review", r.status === "needs_owner_input" ? "high" : "medium", r.status === "needs_owner_input" ? "needs_owner_confirmation" : "internal_only")),
    ...approvals.map((r) => item(r, "approval", "/team/approval-queue", "Approval queue item needs decision", r.status === "needs_owner_confirmation" ? "high" : "medium", r.status === "needs_owner_confirmation" ? "needs_owner_confirmation" : "needs_faraz_review")),
    ...activity.map((r) => item(r, "activity_log", "/team/activity-log", r.title ?? "Recent internal activity", "low", r.visibility === "client_visible" ? "report_future_input" : "internal_only")),
    item({ id: "pr108", restaurant_id: restaurantId ?? "future", status: "future", created_at: new Date(0).toISOString() }, "report_future_state", "/team/report-queue", "Reports are built in PR #108.", "low", "report_future_input"),
  ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 50);
}
