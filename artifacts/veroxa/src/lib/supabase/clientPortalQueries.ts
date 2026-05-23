import { getSupabaseClient } from "./client";

export const MAMADALI_DEMO_CLIENT_ID = "00000000-0000-0000-0000-000000000001";

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
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();
  if (error) throw new Error(`[supabase] getClientById: ${error.message}`);
  return data;
}

export async function getClientPlatforms(clientId: string) {
  const { data, error } = await db()
    .from("client_platforms")
    .select("*")
    .eq("client_id", clientId);
  if (error) throw new Error(`[supabase] getClientPlatforms: ${error.message}`);
  return data ?? [];
}

export async function getClientMediaAssets(clientId: string) {
  const { data, error } = await db()
    .from("media_assets")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error)
    throw new Error(`[supabase] getClientMediaAssets: ${error.message}`);
  return data ?? [];
}

export async function getClientPosts(clientId: string) {
  const { data, error } = await db()
    .from("posts")
    .select("*")
    .eq("client_id", clientId)
    .order("scheduled_for", { ascending: false });
  if (error) throw new Error(`[supabase] getClientPosts: ${error.message}`);
  return data ?? [];
}

export async function getClientPostSlots(clientId: string) {
  const { data, error } = await db()
    .from("post_slots")
    .select("*")
    .eq("client_id", clientId)
    .order("slot_date", { ascending: true });
  if (error)
    throw new Error(`[supabase] getClientPostSlots: ${error.message}`);
  return data ?? [];
}

export async function getClientWeeklyReports(clientId: string) {
  const { data, error } = await db()
    .from("weekly_reports")
    .select("*")
    .eq("client_id", clientId)
    .order("week_start", { ascending: false });
  if (error)
    throw new Error(`[supabase] getClientWeeklyReports: ${error.message}`);
  return data ?? [];
}

export async function getClientMonthlyReports(clientId: string) {
  const { data, error } = await db()
    .from("monthly_reports")
    .select("*")
    .eq("client_id", clientId)
    .order("month_start", { ascending: false });
  if (error)
    throw new Error(`[supabase] getClientMonthlyReports: ${error.message}`);
  return data ?? [];
}
