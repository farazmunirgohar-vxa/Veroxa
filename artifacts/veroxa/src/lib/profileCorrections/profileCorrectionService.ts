import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileCorrectionRecord, RestaurantProfileFieldRecord, Uuid } from "@/domain/liveAutomation/databaseTypes";

export interface RequestProfileCorrectionInput {
  client: SupabaseClient;
  restaurantId: Uuid;
  userId: Uuid;
  field: Pick<RestaurantProfileFieldRecord, "id" | "label" | "value">;
  requestedValue: string;
}

export async function listRestaurantProfileFields(client: SupabaseClient, restaurantId: Uuid): Promise<RestaurantProfileFieldRecord[]> {
  const { data, error } = await client.from("restaurant_profile_fields").select("*").eq("restaurant_id", restaurantId).order("section", { ascending: true }).order("label", { ascending: true });
  if (error) throw new Error("Profile details could not be loaded right now.");
  return (data ?? []) as RestaurantProfileFieldRecord[];
}

export async function requestProfileCorrection(input: RequestProfileCorrectionInput): Promise<ProfileCorrectionRecord> {
  const requestedValue = input.requestedValue.trim();
  if (!requestedValue) throw new Error("Please enter the correction you want Veroxa to review.");
  const insert = {
    restaurant_id: input.restaurantId,
    field_id: input.field.id,
    field_label: input.field.label,
    current_value: input.field.value,
    requested_value: requestedValue,
    status: "requested",
    requested_by: input.userId,
    reviewed_by: null,
    review_note: null,
  };
  const { data, error } = await input.client.from("profile_corrections").insert(insert).select("*").single();
  if (error || !data) throw new Error("Correction request could not be sent right now.");
  return data as ProfileCorrectionRecord;
}

export async function listProfileCorrectionsForTeam(client: SupabaseClient): Promise<ProfileCorrectionRecord[]> {
  const { data, error } = await client.from("profile_corrections").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Profile corrections could not be loaded right now.");
  return (data ?? []) as ProfileCorrectionRecord[];
}

export type ProfileCorrectionDecision = "approved" | "rejected" | "needs_owner_input";

export async function decideProfileCorrection(input: { client: SupabaseClient; correction: ProfileCorrectionRecord; reviewerId: Uuid; decision: ProfileCorrectionDecision; reviewNote: string | null; }): Promise<void> {
  const reviewedAt = new Date().toISOString();

  if (input.decision === "approved" && input.correction.field_id) {
    const { data: updatedField, error: fieldError } = await input.client
      .from("restaurant_profile_fields")
      .update({ value: input.correction.requested_value, status: "veroxa_review", updated_at: reviewedAt })
      .eq("id", input.correction.field_id)
      .eq("restaurant_id", input.correction.restaurant_id)
      .select("id")
      .maybeSingle();

    if (fieldError || !updatedField) throw new Error("Correction could not be approved because the internal profile field did not match this restaurant.");
  }

  const update = { status: input.decision, reviewed_by: input.reviewerId, review_note: input.reviewNote, updated_at: reviewedAt };
  const { error } = await input.client
    .from("profile_corrections")
    .update(update)
    .eq("id", input.correction.id)
    .eq("restaurant_id", input.correction.restaurant_id);

  if (error) throw new Error("Decision could not be saved right now.");
}