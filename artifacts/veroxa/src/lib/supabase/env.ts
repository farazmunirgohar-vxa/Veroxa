export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

export type SupabaseEnvState =
  | { ready: true; env: SupabaseEnv }
  | { ready: false; missing: string[] };

export function getSupabaseEnv(): SupabaseEnvState {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  const missing: string[] = [];
  if (!url) missing.push("VITE_SUPABASE_URL");
  if (!anonKey) missing.push("VITE_SUPABASE_ANON_KEY");

  if (missing.length > 0 || !url || !anonKey) {
    return { ready: false, missing };
  }

  return { ready: true, env: { url, anonKey } };
}
