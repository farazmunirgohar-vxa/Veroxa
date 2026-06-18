import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityLogRecord, IsoDate, JsonObject, ReportRecord, ReportStatus, Uuid } from "@/domain/liveAutomation/databaseTypes";

export type ReportType = "weekly_update" | "monthly_report";
const reportTypes = new Set<string>(["weekly_update", "monthly_report"]);
const safeStatuses = new Set<ReportStatus>(["draft", "ready_for_faraz_review", "approved", "published_to_client"]);

function cleanRequired(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  return trimmed;
}
function assertDateRange(start: IsoDate, end: IsoDate) {
  if (!start || !end) throw new Error("Report period start and end are required.");
  if (start > end) throw new Error("Report period start must be before or equal to period end.");
}
function assertReportType(reportType: string): ReportType {
  if (!reportTypes.has(reportType)) throw new Error("Report type is not supported.");
  return reportType as ReportType;
}
function assertBodyJson(bodyJson: JsonObject): JsonObject {
  if (!bodyJson || Array.isArray(bodyJson) || typeof bodyJson !== "object") throw new Error("Report body must be a JSON object.");
  return bodyJson;
}
function assertStatus(status: ReportStatus): ReportStatus {
  if (!safeStatuses.has(status)) throw new Error("Report status is not supported.");
  return status;
}

export async function listReportEligibleActivity(client: SupabaseClient, restaurantId: Uuid, periodStart: IsoDate, periodEnd: IsoDate): Promise<ActivityLogRecord[]> {
  assertDateRange(periodStart, periodEnd);
  const { data, error } = await client
    .from("activity_log")
    .select("id, restaurant_id, actor_type, actor_user_id, event_type, title, description, related_entity_type, related_entity_id, visibility, report_eligible, created_at")
    .eq("restaurant_id", cleanRequired(restaurantId, "restaurant_id"))
    .gte("created_at", `${periodStart}T00:00:00.000Z`)
    .lte("created_at", `${periodEnd}T23:59:59.999Z`)
    .eq("report_eligible", true)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Report eligible activity could not be loaded right now.");
  return (data ?? []) as ActivityLogRecord[];
}

export async function createReportDraftFromActivity(input: { client: SupabaseClient; restaurantId: Uuid; reportType: ReportType; periodStart: IsoDate; periodEnd: IsoDate; summary: string; bodyJson: JsonObject; }): Promise<ReportRecord> {
  assertDateRange(input.periodStart, input.periodEnd);
  const { data, error } = await input.client.from("reports").insert({
    restaurant_id: cleanRequired(input.restaurantId, "restaurant_id"),
    report_type: assertReportType(input.reportType),
    period_start: input.periodStart,
    period_end: input.periodEnd,
    status: "draft",
    summary: cleanRequired(input.summary, "summary"),
    body_json: assertBodyJson(input.bodyJson),
  }).select("*").single();
  if (error || !data) throw new Error("Report draft could not be created right now.");
  return data as ReportRecord;
}

export async function listTeamReports(client: SupabaseClient, restaurantId?: Uuid): Promise<ReportRecord[]> {
  let query = client.from("reports").select("*").order("created_at", { ascending: false }).limit(100);
  if (restaurantId) query = query.eq("restaurant_id", restaurantId);
  const { data, error } = await query;
  if (error) throw new Error("Team reports could not be loaded right now.");
  return (data ?? []) as ReportRecord[];
}

export async function updateReportStatusForTeam(input: { client: SupabaseClient; reportId: Uuid; restaurantId: Uuid; status: ReportStatus; }): Promise<ReportRecord> {
  const { data, error } = await input.client.from("reports").update({ status: assertStatus(input.status), updated_at: new Date().toISOString() }).eq("id", cleanRequired(input.reportId, "report_id")).eq("restaurant_id", cleanRequired(input.restaurantId, "restaurant_id")).select("*").single();
  if (error || !data) throw new Error("Report status could not be updated right now.");
  return data as ReportRecord;
}

export async function listClientVisibleReports(client: SupabaseClient, restaurantId: Uuid): Promise<ReportRecord[]> {
  const { data, error } = await client.from("reports").select("id, restaurant_id, report_type, period_start, period_end, status, summary, body_json, created_at, updated_at").eq("restaurant_id", cleanRequired(restaurantId, "restaurant_id")).eq("status", "published_to_client").order("period_end", { ascending: false }).limit(24);
  if (error) throw new Error("Reports could not be loaded right now.");
  return (data ?? []) as ReportRecord[];
}
