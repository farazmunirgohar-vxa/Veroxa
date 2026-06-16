import type { SupabaseClient } from "@supabase/supabase-js";
import type { MessageRecord, MessageStatus, Uuid } from "@/domain/liveAutomation/databaseTypes";

function cleanBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Please write a message before sending.");
  return trimmed;
}

export async function listRestaurantMessages(client: SupabaseClient, restaurantId: Uuid): Promise<MessageRecord[]> {
  const { data, error } = await client.from("messages").select("*").eq("restaurant_id", restaurantId).order("created_at", { ascending: true });
  if (error) throw new Error("Messages could not be loaded right now.");
  return (data ?? []) as MessageRecord[];
}

export async function sendClientMessage(input: { client: SupabaseClient; restaurantId: Uuid; userId: Uuid; body: string; }): Promise<MessageRecord> {
  const { data, error } = await input.client.from("messages").insert({ restaurant_id: input.restaurantId, sender_user_id: input.userId, sender_role: "client", body: cleanBody(input.body), status: "unread" }).select("*").single();
  if (error || !data) throw new Error("Message could not be sent right now.");
  return data as MessageRecord;
}

export async function listTeamMessages(client: SupabaseClient): Promise<MessageRecord[]> {
  const { data, error } = await client.from("messages").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Message inbox could not be loaded right now.");
  return (data ?? []) as MessageRecord[];
}

export async function sendTeamReply(input: { client: SupabaseClient; restaurantId: Uuid; userId: Uuid; body: string; }): Promise<MessageRecord> {
  const { data, error } = await input.client.from("messages").insert({ restaurant_id: input.restaurantId, sender_user_id: input.userId, sender_role: "team", body: cleanBody(input.body), status: "unread" }).select("*").single();
  if (error || !data) throw new Error("Reply could not be sent right now.");
  return data as MessageRecord;
}

export async function updateMessageStatusForTeam(input: { client: SupabaseClient; messageId: Uuid; restaurantId: Uuid; status: Extract<MessageStatus, "read" | "resolved">; }): Promise<void> {
  const { error } = await input.client.from("messages").update({ status: input.status, updated_at: new Date().toISOString() }).eq("id", input.messageId).eq("restaurant_id", input.restaurantId);
  if (error) throw new Error("Message status could not be updated right now.");
}

export async function markMessageResolved(input: { client: SupabaseClient; messageId: Uuid; restaurantId: Uuid; }): Promise<void> {
  return updateMessageStatusForTeam({ ...input, status: "resolved" });
}
