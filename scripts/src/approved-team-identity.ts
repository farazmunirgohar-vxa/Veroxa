import type { SupabaseClient, User } from "@supabase/supabase-js";

export const MOMO_OPERATIONAL_RESTAURANT = "Momo's House San Antonio";

export type ApprovedTeamAccess = {
  profile: { user_id: string; role: string; status: string };
  membership: { restaurant_id: string; role: string; status: string };
  restaurant: { id: string; name: string; status: string };
};

export type IdentityProvisioningResult = {
  outcome: "created" | "already_exists";
  userId: string;
  access: ApprovedTeamAccess;
};

export interface ApprovedTeamIdentityGateway {
  findUserByEmail(email: string): Promise<User | null>;
  createUser(email: string): Promise<User>;
  refreshUserEmail(userId: string, email: string): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  readApprovedTeamAccess(userId: string): Promise<ApprovedTeamAccess | null>;
}

export function normalizeApprovedTeamEmail(value: string | undefined): string {
  const email = value?.trim().toLowerCase() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("VEROXA_APPROVED_TEAM_EMAIL must be a valid email address");
  }
  return email;
}

export function validateSupabaseUrl(value: string | undefined): string {
  const raw = value?.trim() ?? "";
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("SUPABASE_URL must be a valid HTTPS Supabase project URL");
  }
  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname.endsWith(".supabase.co") ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    (parsed.pathname !== "/" && parsed.pathname !== "") ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("SUPABASE_URL must be the HTTPS root of a hosted Supabase project");
  }
  return parsed.origin;
}

export function assertApprovedTeamAccess(
  access: ApprovedTeamAccess | null,
): asserts access is ApprovedTeamAccess {
  if (!access) throw new Error("The Auth user was not accepted by the database allowlist");
  if (access.profile.role !== "team" || access.profile.status !== "active") {
    throw new Error("The allowlisted profile is not an active Team identity");
  }
  if (access.membership.role !== "team" || access.membership.status !== "active") {
    throw new Error("The allowlisted identity has no active Team membership");
  }
  if (
    access.restaurant.name !== MOMO_OPERATIONAL_RESTAURANT ||
    access.restaurant.status !== "active" ||
    access.membership.restaurant_id !== access.restaurant.id
  ) {
    throw new Error("The allowlisted identity is not scoped to the active Momo restaurant");
  }
}

export async function provisionApprovedTeamIdentity(
  gateway: ApprovedTeamIdentityGateway,
  emailValue: string | undefined,
): Promise<IdentityProvisioningResult> {
  const email = normalizeApprovedTeamEmail(emailValue);
  const existing = await gateway.findUserByEmail(email);
  if (existing) {
    let access = await gateway.readApprovedTeamAccess(existing.id);
    if (!access) {
      await gateway.refreshUserEmail(existing.id, email);
      access = await gateway.readApprovedTeamAccess(existing.id);
    }
    assertApprovedTeamAccess(access);
    return { outcome: "already_exists", userId: existing.id, access };
  }

  const created = await gateway.createUser(email);
  try {
    const access = await gateway.readApprovedTeamAccess(created.id);
    assertApprovedTeamAccess(access);
    return { outcome: "created", userId: created.id, access };
  } catch (error) {
    await gateway.deleteUser(created.id);
    throw new Error(
      "Provisioning was rolled back because the database allowlist did not create active Team/Momo access",
      { cause: error },
    );
  }
}

export function createApprovedTeamIdentityGateway(
  client: SupabaseClient,
): ApprovedTeamIdentityGateway {
  return {
    async findUserByEmail(email) {
      for (let page = 1; page <= 100; page += 1) {
        const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });
        if (error) throw new Error("Unable to list Supabase Auth users", { cause: error });
        const match = data.users.find((user) => user.email?.trim().toLowerCase() === email);
        if (match) return match;
        if (data.users.length < 100) return null;
      }
      throw new Error("Auth user lookup exceeded the bounded pagination limit");
    },

    async createUser(email) {
      const { data, error } = await client.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (error || !data.user) {
        throw new Error("Supabase Auth Admin could not create the approved Team user", {
          cause: error,
        });
      }
      return data.user;
    },

    async refreshUserEmail(userId, email) {
      const { data, error } = await client.auth.admin.updateUserById(userId, {
        email,
        email_confirm: true,
      });
      if (error || !data.user) {
        throw new Error("Unable to refresh the approved Auth identity against the allowlist", {
          cause: error,
        });
      }
      return data.user;
    },

    async deleteUser(userId) {
      const { error } = await client.auth.admin.deleteUser(userId);
      if (error) {
        throw new Error("Failed to roll back the unaccepted Auth user", { cause: error });
      }
    },

    async readApprovedTeamAccess(userId) {
      const [profileResult, membershipResult] = await Promise.all([
        client
          .from("veroxa_user_profiles")
          .select("user_id, role, status")
          .eq("user_id", userId)
          .maybeSingle(),
        client
          .from("veroxa_restaurant_members")
          .select("restaurant_id, role, status")
          .eq("user_id", userId)
          .eq("role", "team")
          .maybeSingle(),
      ]);
      if (profileResult.error || membershipResult.error) {
        throw new Error("Unable to verify the database-provisioned Team access", {
          cause: profileResult.error ?? membershipResult.error,
        });
      }
      if (!profileResult.data || !membershipResult.data) return null;

      const { data: restaurant, error: restaurantError } = await client
        .from("veroxa_restaurants")
        .select("id, name, status")
        .eq("id", membershipResult.data.restaurant_id)
        .maybeSingle();
      if (restaurantError) {
        throw new Error("Unable to verify the Team restaurant scope", {
          cause: restaurantError,
        });
      }
      if (!restaurant) return null;
      return {
        profile: profileResult.data,
        membership: membershipResult.data,
        restaurant,
      } as ApprovedTeamAccess;
    },
  };
}
