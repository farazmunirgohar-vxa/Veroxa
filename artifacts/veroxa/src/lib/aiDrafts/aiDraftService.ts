import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiDraftRecord, Uuid } from "@/domain/liveAutomation/databaseTypes";

export const AI_DRAFT_TYPES = [
  "media_summary",
  "caption_draft",
  "google_update_draft",
  "social_caption_draft",
  "message_reply_draft",
  "profile_correction_summary",
  "report_draft_placeholder",
  "next_step_recommendation",
] as const;

export const AI_DRAFT_STATUSES = ["drafted", "ready_for_faraz_review", "held", "rejected", "approved", "needs_owner_input"] as const;
export const AI_DRAFT_SOURCE_ENTITY_TYPES = ["media_asset", "message", "profile_correction", "activity_log", "restaurant_profile_field"] as const;
export const AI_DRAFT_SAFETY_FLAGS = ["ready_for_faraz_review", "needs_owner_input", "business_truth_confirmation_required", "low_confidence"] as const;

export type AiDraftType = (typeof AI_DRAFT_TYPES)[number];
export type AiDraftStatus = (typeof AI_DRAFT_STATUSES)[number];
export type AiDraftSourceEntityType = (typeof AI_DRAFT_SOURCE_ENTITY_TYPES)[number];
export type AiDraftSafetyFlag = (typeof AI_DRAFT_SAFETY_FLAGS)[number];

const draftTypes = new Set<string>(AI_DRAFT_TYPES);
const statuses = new Set<string>(AI_DRAFT_STATUSES);
const sourceTypes = new Set<string>(AI_DRAFT_SOURCE_ENTITY_TYPES);
const safetyFlags = new Set<string>(AI_DRAFT_SAFETY_FLAGS);

function cleanRequired(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  return trimmed;
}

function cleanOptionalControlled(value?: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  if (!sourceTypes.has(trimmed)) throw new Error("Source entity type is not supported.");
  return trimmed;
}

function cleanDraftType(value: string): AiDraftType {
  const trimmed = cleanRequired(value, "draft_type");
  if (!draftTypes.has(trimmed)) throw new Error("Draft type is not supported.");
  return trimmed as AiDraftType;
}

function cleanStatus(value: string): AiDraftStatus {
  const trimmed = cleanRequired(value, "status");
  if (!statuses.has(trimmed)) throw new Error("AI draft status is not supported.");
  return trimmed as AiDraftStatus;
}

function cleanSafetyFlags(flags: string[]): AiDraftSafetyFlag[] {
  const cleaned = Array.from(new Set(flags.map((flag) => flag.trim()).filter(Boolean)));
  if (cleaned.length < 1) throw new Error("At least one safety flag is required.");
  for (const flag of cleaned) if (!safetyFlags.has(flag)) throw new Error("Safety flag is not supported.");
  return cleaned as AiDraftSafetyFlag[];
}

export async function listAiDraftsForTeam(client: SupabaseClient, restaurantId?: Uuid): Promise<AiDraftRecord[]> {
  let query = client.from("ai_drafts").select("*").order("created_at", { ascending: false }).limit(50);
  if (restaurantId) query = query.eq("restaurant_id", restaurantId);
  const { data, error } = await query;
  if (error) throw new Error("AI Draft Queue could not be loaded right now.");
  return (data ?? []) as AiDraftRecord[];
}

export async function createAiDraftRecord(input: {
  client: SupabaseClient;
  restaurantId: Uuid;
  draftType: AiDraftType | string;
  sourceEntityType?: AiDraftSourceEntityType | string | null;
  sourceEntityId?: Uuid | null;
  draftText: string;
  safetyFlags: string[];
}): Promise<AiDraftRecord> {
  const restaurant_id = cleanRequired(input.restaurantId, "restaurant_id");
  const draft_text = cleanRequired(input.draftText, "draft_text");
  const draft_type = cleanDraftType(input.draftType);
  const source_entity_type = cleanOptionalControlled(input.sourceEntityType);
  const safety_flags = cleanSafetyFlags(input.safetyFlags);

  const { data, error } = await input.client
    .from("ai_drafts")
    .insert({ restaurant_id, draft_type, source_entity_type, source_entity_id: input.sourceEntityId ?? null, draft_text, safety_flags, status: "ready_for_faraz_review" })
    .select("*")
    .single();

  if (error || !data) throw new Error("AI draft could not be created right now.");
  return data as AiDraftRecord;
}

export async function updateAiDraftStatus(input: { client: SupabaseClient; draftId: Uuid; restaurantId: Uuid; status: AiDraftStatus | string }): Promise<AiDraftRecord> {
  const id = cleanRequired(input.draftId, "draftId");
  const restaurant_id = cleanRequired(input.restaurantId, "restaurant_id");
  const status = cleanStatus(input.status);

  const { data, error } = await input.client.from("ai_drafts").update({ status }).eq("id", id).eq("restaurant_id", restaurant_id).select("*").single();
  if (error || !data) throw new Error("AI draft status could not be updated right now.");
  return data as AiDraftRecord;
}

export function holdAiDraft(client: SupabaseClient, draftId: Uuid, restaurantId: Uuid): Promise<AiDraftRecord> {
  return updateAiDraftStatus({ client, draftId, restaurantId, status: "held" });
}

export function rejectAiDraft(client: SupabaseClient, draftId: Uuid, restaurantId: Uuid): Promise<AiDraftRecord> {
  return updateAiDraftStatus({ client, draftId, restaurantId, status: "rejected" });
}

export function markAiDraftReviewedInternally(client: SupabaseClient, draftId: Uuid, restaurantId: Uuid): Promise<AiDraftRecord> {
  return updateAiDraftStatus({ client, draftId, restaurantId, status: "approved" });
}
