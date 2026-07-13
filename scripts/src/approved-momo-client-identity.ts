import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  MOMO_OPERATIONAL_RESTAURANT,
  validateSupabaseUrl,
} from "./approved-team-identity";

export { MOMO_OPERATIONAL_RESTAURANT, validateSupabaseUrl };

export type ApprovedMomoClientAccess = {
  profile: { user_id: string; role: string; status: string };
  membership: { restaurant_id: string; role: string; status: string };
  restaurant: { id: string; name: string; status: string };
  is_operational_restaurant: boolean;
};

export type MomoClientIdentityProvisioningResult = {
  outcome: "created" | "already_exists";
  userId: string;
  access: ApprovedMomoClientAccess;
};

export interface ApprovedMomoClientIdentityGateway {
  findUserByEmail(email: string): Promise<User | null>;
  createUser(email: string): Promise<User>;
  refreshUserEmail(userId: string, email: string): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  readApprovedMomoClientAccess(
    userId: string,
  ): Promise<ApprovedMomoClientAccess | null>;
}

export function normalizeApprovedMomoClientEmail(
  value: string | undefined,
): string {
  const email = value?.trim().toLowerCase() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(
      "VEROXA_APPROVED_MOMO_CLIENT_EMAIL must be a valid email address",
    );
  }
  return email;
}

export function assertApprovedMomoClientAccess(
  access: ApprovedMomoClientAccess | null,
): asserts access is ApprovedMomoClientAccess {
  if (!access) {
    throw new Error("The Auth user was not accepted by the database allowlist");
  }
  if (access.profile.role !== "client" || access.profile.status !== "active") {
    throw new Error("The allowlisted profile is not an active Momo client identity");
  }
  if (
    access.membership.role !== "client" ||
    access.membership.status !== "active"
  ) {
    throw new Error("The allowlisted identity has no active Momo client membership");
  }
  if (
    access.restaurant.name !== MOMO_OPERATIONAL_RESTAURANT ||
    access.restaurant.status !== "active" ||
    !access.is_operational_restaurant ||
    access.membership.restaurant_id !== access.restaurant.id
  ) {
    throw new Error(
      "The allowlisted client identity is not scoped to the active Momo restaurant",
    );
  }
}

export async function provisionApprovedMomoClientIdentity(
  gateway: ApprovedMomoClientIdentityGateway,
  emailValue: string | undefined,
): Promise<MomoClientIdentityProvisioningResult> {
  const email = normalizeApprovedMomoClientEmail(emailValue);
  const existing = await gateway.findUserByEmail(email);
  if (existing) {
    let access = await gateway.readApprovedMomoClientAccess(existing.id);
    if (!access) {
      await gateway.refreshUserEmail(existing.id, email);
      access = await gateway.readApprovedMomoClientAccess(existing.id);
    }
    assertApprovedMomoClientAccess(access);
    return { outcome: "already_exists", userId: existing.id, access };
  }

  const created = await gateway.createUser(email);
  try {
    const access = await gateway.readApprovedMomoClientAccess(created.id);
    assertApprovedMomoClientAccess(access);
    return { outcome: "created", userId: created.id, access };
  } catch (error) {
    await gateway.deleteUser(created.id);
    throw new Error(
      "Provisioning was rolled back because the database allowlist did not create active Momo client access",
      { cause: error },
    );
  }
}

export function createApprovedMomoClientIdentityGateway(
  client: SupabaseClient,
): ApprovedMomoClientIdentityGateway {
  return {
    async findUserByEmail(email) {
      for (let page = 1; page <= 100; page += 1) {
        const { data, error } = await client.auth.admin.listUsers({
          page,
          perPage: 100,
        });
        if (error) {
          throw new Error("Unable to list Supabase Auth users", { cause: error });
        }
        const match = data.users.find(
          (user) => user.email?.trim().toLowerCase() === email,
        );
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
        throw new Error(
          "Supabase Auth Admin could not create the approved Momo client user",
          { cause: error },
        );
      }
      return data.user;
    },

    async refreshUserEmail(userId, email) {
      const { data, error } = await client.auth.admin.updateUserById(userId, {
        email,
        email_confirm: true,
      });
      if (error || !data.user) {
        throw new Error(
          "Unable to refresh the approved Momo Auth identity against the allowlist",
          { cause: error },
        );
      }
      return data.user;
    },

    async deleteUser(userId) {
      const { error } = await client.auth.admin.deleteUser(userId);
      if (error) {
        throw new Error("Failed to roll back the unaccepted Momo Auth user", {
          cause: error,
        });
      }
    },

    async readApprovedMomoClientAccess(userId) {
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
          .eq("role", "client")
          .maybeSingle(),
      ]);
      if (profileResult.error || membershipResult.error) {
        throw new Error("Unable to verify the database-provisioned Momo client access", {
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
        throw new Error("Unable to verify the Momo client restaurant scope", {
          cause: restaurantError,
        });
      }
      if (!restaurant) return null;
      const { data: isOperationalRestaurant, error: scopeError } = await client.rpc(
        "veroxa_is_momo_operational_restaurant_v1",
        { p_restaurant_id: restaurant.id },
      );
      if (scopeError) {
        throw new Error("Unable to verify the protected Momo operating scope", {
          cause: scopeError,
        });
      }
      return {
        profile: profileResult.data,
        membership: membershipResult.data,
        restaurant,
        is_operational_restaurant: isOperationalRestaurant === true,
      } as ApprovedMomoClientAccess;
    },
  };
}
