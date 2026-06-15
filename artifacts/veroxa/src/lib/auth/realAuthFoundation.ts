import type { SupabaseClient } from "@supabase/supabase-js";
import type { VeroxaRole } from "./authContract";
import { isVeroxaRole } from "./authContract";

export type VeroxaAccountStatus = "active" | "disabled" | "pending";
export type RestaurantStatus = "active" | "disabled" | "pending";
export type RestaurantMembershipStatus = "active" | "disabled" | "pending";

export interface UserProfileRow {
  user_id?: string;
  email?: string | null;
  role?: unknown;
  display_name?: string | null;
  status?: unknown;
}

export interface RestaurantMemberRow {
  restaurant_id?: string | null;
  role?: unknown;
  status?: unknown;
}

export interface RestaurantRow {
  id?: string | null;
  status?: unknown;
}

export type RealAuthAccessResult =
  | {
      ok: true;
      profile: {
        userId: string;
        email: string;
        role: VeroxaRole;
        displayName: string | null;
        status: "active";
        clientId: string | null;
      };
    }
  | {
      ok: false;
      reason:
        | "missing_profile"
        | "unsupported_role"
        | "inactive_profile"
        | "missing_client_membership"
        | "inactive_membership"
        | "missing_restaurant"
        | "inactive_restaurant"
        | "read_error";
    };

const ACCOUNT_STATUSES: readonly VeroxaAccountStatus[] = ["active", "disabled", "pending"] as const;

export function isVeroxaAccountStatus(value: unknown): value is VeroxaAccountStatus {
  return typeof value === "string" && (ACCOUNT_STATUSES as readonly string[]).includes(value);
}

export function isActiveStatus(value: unknown): value is "active" {
  return value === "active";
}

function normalizeProfileStatus(status: unknown): VeroxaAccountStatus {
  return isVeroxaAccountStatus(status) ? status : "pending";
}

export async function resolveRealAuthAccess(
  client: SupabaseClient,
  input: { userId: string; email: string },
): Promise<RealAuthAccessResult> {
  const { data: profile, error: profileError } = await client
    .from("user_profiles")
    .select("user_id, email, role, display_name, status")
    .eq("user_id", input.userId)
    .maybeSingle<UserProfileRow>();

  if (profileError) return { ok: false, reason: "read_error" };
  if (!profile) return { ok: false, reason: "missing_profile" };
  if (!isVeroxaRole(profile.role)) return { ok: false, reason: "unsupported_role" };

  const profileStatus = normalizeProfileStatus(profile.status);
  if (!isActiveStatus(profileStatus)) return { ok: false, reason: "inactive_profile" };

  let clientId: string | null = null;
  if (profile.role === "client") {
    const { data: membership, error: membershipError } = await client
      .from("restaurant_members")
      .select("restaurant_id, role, status")
      .eq("user_id", input.userId)
      .eq("role", "client")
      .eq("status", "active")
      .maybeSingle<RestaurantMemberRow>();

    if (membershipError) return { ok: false, reason: "read_error" };
    if (!membership?.restaurant_id) return { ok: false, reason: "missing_client_membership" };
    if (membership.role !== "client" || membership.status !== "active") {
      return { ok: false, reason: "inactive_membership" };
    }

    const { data: restaurant, error: restaurantError } = await client
      .from("restaurants")
      .select("id, status")
      .eq("id", membership.restaurant_id)
      .maybeSingle<RestaurantRow>();

    if (restaurantError) return { ok: false, reason: "read_error" };
    if (!restaurant?.id) return { ok: false, reason: "missing_restaurant" };
    if (restaurant.status !== "active") return { ok: false, reason: "inactive_restaurant" };

    clientId = restaurant.id;
  }

  return {
    ok: true,
    profile: {
      userId: input.userId,
      email: profile.email?.trim() || input.email,
      role: profile.role,
      displayName: profile.display_name ?? null,
      status: "active",
      clientId,
    },
  };
}

export function getRealAuthAccessMessage(reason: Exclude<RealAuthAccessResult, { ok: true }>["reason"]): string {
  switch (reason) {
    case "inactive_profile":
    case "inactive_membership":
      return "This account is not active yet. Please contact Veroxa support.";
    case "inactive_restaurant":
      return "This restaurant workspace is not active yet. Please contact Veroxa support.";
    case "missing_client_membership":
    case "missing_restaurant":
    case "missing_profile":
      return "This Veroxa account is not fully set up yet. Please contact Veroxa support.";
    case "unsupported_role":
      return "This account does not have the right portal access yet. Please contact Veroxa support.";
    case "read_error":
      return "We could not finish checking your account access. Please try again later.";
  }
}
