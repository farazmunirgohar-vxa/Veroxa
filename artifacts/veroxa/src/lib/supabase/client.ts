import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;

  const state = getSupabaseEnv();
  if (!state.ready) {
    console.warn(
      `[supabase] Client not initialised — missing env vars: ${state.missing.join(", ")}. ` +
        "The app will continue to use demo data until these are provided."
    );
    return null;
  }

  _client = createClient(state.env.url, state.env.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  return _client;
}
