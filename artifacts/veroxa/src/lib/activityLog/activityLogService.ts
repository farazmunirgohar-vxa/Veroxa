import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityLogRecord, ActivityVisibility, Uuid } from "@/domain/liveAutomation/databaseTypes";

export const ACTIVITY_LOG_EVENT_TYPES = [
  "media_uploaded",
  "media_reviewed",
  "media_saved_for_later",
  "media_better_version_requested",
  "media_marked_ready_to_use",
  "client_message_sent",
  "team_reply_sent",
  "message_resolved",
  "profile_correction_requested",
  "profile_correction_approved",
  "profile_correction_rejected",
  "profile_field_updated",
  "connection_status_changed",
  "team_note_added",
  "setup_step_completed",
  "blocker_identified",
] as const;

export type ActivityLogEventType = (typeof ACTIVITY_LOG_EVENT_TYPES)[number];

const allowedEventTypes = new Set<string>(ACTIVITY_LOG_EVENT_TYPES);
const allowedVisibility = new Set<ActivityVisibility>(["internal_only", "client_visible"]);

function cleanRequired(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  return trimmed;
}

function cleanOptional(value?: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export function isActivityLogEventType(value: string): value is ActivityLogEventType {
  return allowedEventTypes.has(value);
}

function assertActivityLogEventType(value: string): ActivityLogEventType {
  if (!isActivityLogEventType(value)) throw new Error("Activity event type is not supported.");
  return value;
}

export async function listClientVisibleActivity(client: SupabaseClient, restaurantId: Uuid): Promise<ActivityLogRecord[]> {
  const { data, error } = await client
    .from("activity_log")
    .select("id, restaurant_id, actor_type, actor_user_id, event_type, title, description, related_entity_type, related_entity_id, visibility, report_eligible, created_at")
    .eq("restaurant_id", restaurantId)
    .eq("visibility", "client_visible")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error("Recent Veroxa Activity could not be loaded right now.");
  return (data ?? []) as ActivityLogRecord[];
}

export async function listTeamActivity(client: SupabaseClient, restaurantId?: Uuid): Promise<ActivityLogRecord[]> {
  let query = client.from("activity_log").select("*").order("created_at", { ascending: false }).limit(50);
  if (restaurantId) query = query.eq("restaurant_id", restaurantId);
  const { data, error } = await query;
  if (error) throw new Error("Activity Log could not be loaded right now.");
  return (data ?? []) as ActivityLogRecord[];
}

export async function recordActivityEvent(input: {
  client: SupabaseClient;
  restaurantId: Uuid;
  teamUserId: Uuid;
  eventType: ActivityLogEventType | string;
  title: string;
  description?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: Uuid | null;
  visibility: ActivityVisibility;
  reportEligible: boolean;
}): Promise<ActivityLogRecord> {
  const restaurant_id = cleanRequired(input.restaurantId, "restaurant_id");
  const title = cleanRequired(input.title, "title");
  const actor_user_id = cleanRequired(input.teamUserId, "teamUserId");
  const event_type = assertActivityLogEventType(cleanRequired(input.eventType, "event_type"));
  if (!allowedVisibility.has(input.visibility)) throw new Error("Activity visibility is not supported.");
  if (typeof input.reportEligible !== "boolean") throw new Error("report_eligible must be explicit.");

  const { data, error } = await input.client
    .from("activity_log")
    .insert({
      restaurant_id,
      actor_type: "team",
      actor_user_id,
      event_type,
      title,
      description: cleanOptional(input.description),
      related_entity_type: cleanOptional(input.relatedEntityType),
      related_entity_id: input.relatedEntityId ?? null,
      visibility: input.visibility,
      report_eligible: input.reportEligible,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error("Activity event could not be recorded right now.");
  return data as ActivityLogRecord;
}
