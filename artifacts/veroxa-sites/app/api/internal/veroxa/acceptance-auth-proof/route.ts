import { createClient, type SupabaseClient, type User } from
  "@supabase/supabase-js";

import {
  acceptanceAuthProofTarget,
  createAcceptanceAuthProofHandler,
  type AcceptanceAuthProofMembership,
  type AcceptanceAuthProofProfile,
  type AcceptanceAuthProofUser,
} from "./core.ts";

export const runtime = "edge";

const HMAC = /^[0-9a-f]{64}$/u;
const PRODUCTION_ORIGIN = "https://veroxasystems.com";

function configuration(): {
  url: string;
  publishableKey: string;
  secretKey: string;
  wakeHmacSecret: string;
} | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  const wakeHmacSecret = process.env
    .VEROXA_INTERNAL_ACCEPTANCE_AUTH_PROOF_HMAC_SECRET?.trim();
  if (!rawUrl || !publishableKey?.startsWith("sb_publishable_") ||
    !secretKey?.startsWith("sb_secret_") ||
    !wakeHmacSecret || !HMAC.test(wakeHmacSecret)) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co") ||
      url.username || url.password || url.port ||
      (url.pathname !== "/" && url.pathname !== "") || url.search ||
      url.hash) return null;
    return {
      url: url.origin,
      publishableKey,
      secretKey,
      wakeHmacSecret,
    };
  } catch {
    return null;
  }
}

function userRecord(user: User | null): AcceptanceAuthProofUser | null {
  return user
    ? {
      id: user.id,
      email: user.email ?? null,
      aud: user.aud,
      role: user.role ?? "",
      isAnonymous: user.is_anonymous === true,
      deletedAt: user.deleted_at ?? null,
      bannedUntil: user.banned_until ?? null,
    }
    : null;
}

function adminClient(
  config: ReturnType<typeof configuration>,
): SupabaseClient | null {
  return config
    ? createClient(config.url, config.secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          "x-veroxa-server-purpose": "internal-acceptance-auth-proof-v1",
        },
      },
    })
    : null;
}

function publicClient(
  config: ReturnType<typeof configuration>,
): SupabaseClient | null {
  return config
    ? createClient(config.url, config.publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
    : null;
}

const config = configuration();
const admin = adminClient(config);
const authenticated = publicClient(config);

function requireAdmin(): SupabaseClient {
  if (!admin) throw new Error("acceptance_auth_admin_unavailable");
  return admin;
}

function requireAuthenticated(): SupabaseClient {
  if (!authenticated) {
    throw new Error("acceptance_auth_client_unavailable");
  }
  return authenticated;
}

const handler = createAcceptanceAuthProofHandler({
  configured: Boolean(config && admin && authenticated),
  wakeHmacSecret: config?.wakeHmacSecret ?? "",
  operation: {
    async getExistingUser() {
      const { data, error } = await requireAdmin().auth.admin.getUserById(
        acceptanceAuthProofTarget.userId,
      );
      if (error) throw new Error("acceptance_identity_read_failed");
      return userRecord(data?.user ?? null);
    },
    async generateMagicLinkTokenHash() {
      const { data, error } = await requireAdmin().auth.admin.generateLink({
        type: "magiclink",
        email: acceptanceAuthProofTarget.email,
      });
      const tokenHash = data?.properties?.hashed_token;
      if (error || !tokenHash) {
        throw new Error("acceptance_magic_link_generation_failed");
      }
      return tokenHash;
    },
    async verifyMagicLink(tokenHash) {
      const { data, error } = await requireAuthenticated().auth.verifyOtp({
        type: "magiclink",
        token_hash: tokenHash,
      });
      const accessToken = data?.session?.access_token;
      const expiresAt = data?.session?.expires_at;
      if (error || !data?.user || !accessToken || !expiresAt) return null;
      return {
        user: userRecord(data.user)!,
        accessToken,
        expiresAt,
      };
    },
    async readClientProfile(userId) {
      const { data, error } = await requireAuthenticated()
        .from("veroxa_user_profiles")
        .select("role,status")
        .eq("user_id", userId)
        .limit(2);
      if (error || !Array.isArray(data)) {
        throw new Error("acceptance_profile_read_failed");
      }
      return data.map((row) => ({
        role: String(row.role ?? ""),
        status: String(row.status ?? ""),
      } satisfies AcceptanceAuthProofProfile));
    },
    async readClientMembership(userId, restaurantId) {
      const { data, error } = await requireAuthenticated()
        .from("veroxa_restaurant_members")
        .select("restaurant_id,role,status,veroxa_restaurants!inner(name,status)")
        .eq("user_id", userId)
        .eq("restaurant_id", restaurantId)
        .limit(2);
      if (error || !Array.isArray(data)) {
        throw new Error("acceptance_membership_read_failed");
      }
      return data.map((row) => {
        const restaurant = row.veroxa_restaurants as unknown as {
          name?: unknown;
          status?: unknown;
        } | null;
        return {
          restaurantId: String(row.restaurant_id ?? ""),
          role: String(row.role ?? ""),
          status: String(row.status ?? ""),
          restaurantName: String(restaurant?.name ?? ""),
          restaurantStatus: String(restaurant?.status ?? ""),
        } satisfies AcceptanceAuthProofMembership;
      });
    },
    async finalize(input) {
      return fetch(`${PRODUCTION_ORIGIN}/api/media/finalize`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${input.accessToken}`,
          "content-type": "application/json",
          "x-veroxa-correlation-id": input.correlationId,
          "x-veroxa-server-purpose": "internal-acceptance-auth-proof-v1",
        },
        body: JSON.stringify(input.body),
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(20_000),
      });
    },
    async revoke(accessToken) {
      const { error } = await requireAdmin().auth.admin.signOut(
        accessToken,
        "local",
      );
      if (error) throw new Error("acceptance_session_revoke_failed");
    },
    async clearClientSession() {
      const { error } = await requireAuthenticated().auth.signOut({
        scope: "local",
      });
      if (error) throw new Error("acceptance_session_clear_failed");
    },
  },
});

export async function POST(request: Request): Promise<Response> {
  return handler(request);
}
