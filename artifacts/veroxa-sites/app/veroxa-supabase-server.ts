import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type ServerAccess = {
  role: "team" | "client";
  displayName: string;
  restaurantId: string | null;
};

function getServerConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export async function getServerVeroxaAccess(): Promise<ServerAccess | null> {
  const config = getServerConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  const client = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          for (const item of items) cookieStore.set(item.name, item.value, item.options);
        } catch {
          // Server Components cannot always persist refreshed cookies. Route
          // requests still validate the signed access token with Auth below.
        }
      },
    },
  });

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return null;
  const { data: profile, error: profileError } = await client
    .from("veroxa_user_profiles")
    .select("role, display_name, status")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (profileError || !profile || profile.status !== "active") return null;
  if (profile.role !== "team" && profile.role !== "client") return null;
  const { data: membership, error: membershipError } = await client
    .from("veroxa_restaurant_members")
    .select("restaurant_id, role, status, veroxa_restaurants!inner(status)")
    .eq("user_id", userData.user.id)
    .eq("role", profile.role)
    .eq("status", "active")
    .maybeSingle();
  const restaurant = membership?.veroxa_restaurants as { status?: string } | null;
  if (
    membershipError ||
    !membership?.restaurant_id ||
    membership.role !== profile.role ||
    restaurant?.status !== "active"
  ) {
    return null;
  }
  return {
    role: profile.role,
    displayName: profile.display_name || userData.user.email || (profile.role === "team" ? "Team Faraz" : "Momo’s House"),
    restaurantId: membership.restaurant_id,
  };
}
