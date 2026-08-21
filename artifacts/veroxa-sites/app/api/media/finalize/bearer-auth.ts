import { createClient, type SupabaseClient, type User } from
  "@supabase/supabase-js";
import type {
  ServerSupabasePublicConfig,
  ServerVeroxaContext,
} from "../../../veroxa-supabase-server.ts";

const MAX_BEARER_TOKEN_LENGTH = 8_192;
const JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

type BearerClientFactory = (
  url: string,
  publishableKey: string,
  options: {
    auth: {
      autoRefreshToken: false;
      persistSession: false;
      detectSessionInUrl: false;
    };
    global: { headers: { Authorization: string } };
  },
) => SupabaseClient;

export type MomoMediaFinalizeBearerContext = {
  context: ServerVeroxaContext;
  serverVerifiedAccessToken: string;
};

export type MomoMediaFinalizeResolvedContext = {
  context: ServerVeroxaContext;
  serverVerifiedAccessToken?: string;
};

export type MomoMediaFinalizeBearerDependencies = {
  clientFactory?: BearerClientFactory;
  now?: () => number;
};

function projectAuthCookieBase(config: ServerSupabasePublicConfig): string | null {
  try {
    const projectRef = new URL(config.url).hostname.match(
      /^([a-z0-9-]+)\.supabase\.co$/u,
    )?.[1];
    return projectRef ? `sb-${projectRef}-auth-token` : null;
  } catch {
    return null;
  }
}

export function hasMomoMediaFinalizeProjectAuthCookie(
  request: Request,
  config: ServerSupabasePublicConfig,
): boolean {
  const base = projectAuthCookieBase(config);
  const header = request.headers.get("cookie");
  if (!base || !header) return false;
  return header.split(";").some((part) => {
    const separator = part.indexOf("=");
    if (separator < 1) return false;
    const name = part.slice(0, separator).trim();
    if (name === base) return true;
    if (!name.startsWith(`${base}.`)) return false;
    return /^\d+$/u.test(name.slice(base.length + 1));
  });
}

export function parseMomoMediaFinalizeBearerToken(
  request: Request,
): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization ||
    authorization.length > MAX_BEARER_TOKEN_LENGTH + "Bearer ".length) {
    return null;
  }
  const match = authorization.match(/^Bearer ([A-Za-z0-9._-]+)$/iu);
  const token = match?.[1] ?? "";
  return token.length > 0 && token.length <= MAX_BEARER_TOKEN_LENGTH &&
      JWT.test(token)
    ? token
    : null;
}

function userIsActiveClient(user: User, now: number): boolean {
  if (!UUID.test(user.id) || user.aud !== "authenticated" ||
    user.role !== "authenticated" || user.is_anonymous === true ||
    Boolean(user.deleted_at)) {
    return false;
  }
  if (!user.banned_until) return true;
  const bannedUntil = Date.parse(user.banned_until);
  return Number.isFinite(bannedUntil) && bannedUntil <= now;
}

async function resolveBearerContext(
  request: Request,
  config: ServerSupabasePublicConfig,
  dependencies: MomoMediaFinalizeBearerDependencies,
): Promise<MomoMediaFinalizeBearerContext | null> {
  if (hasMomoMediaFinalizeProjectAuthCookie(request, config)) return null;
  const token = parseMomoMediaFinalizeBearerToken(request);
  if (!token) return null;
  const clientFactory = dependencies.clientFactory ??
    (createClient as BearerClientFactory);
  const client = clientFactory(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await client.auth.getUser(token);
  const user = userData.user;
  if (userError || !user ||
    !userIsActiveClient(user, (dependencies.now ?? Date.now)())) return null;

  const { data: profiles, error: profileError } = await client
    .from("veroxa_user_profiles")
    .select("role, display_name, status")
    .eq("user_id", user.id)
    .limit(2);
  if (profileError || !Array.isArray(profiles) || profiles.length !== 1) {
    return null;
  }
  const profile = profiles[0];
  if (profile.status !== "active" || profile.role !== "client") return null;

  const { data: memberships, error: membershipError } = await client
    .from("veroxa_restaurant_members")
    .select("restaurant_id, role, status, veroxa_restaurants!inner(name,status)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(2);
  if (membershipError || !Array.isArray(memberships) ||
    memberships.length !== 1) return null;
  const membership = memberships[0];
  const restaurant = membership.veroxa_restaurants as {
    name?: unknown;
    status?: unknown;
  } | null;
  if (!UUID.test(String(membership.restaurant_id ?? "")) ||
    membership.role !== profile.role || membership.status !== "active" ||
    !restaurant || typeof restaurant.name !== "string" ||
    !restaurant.name.trim() || restaurant.status !== "active") return null;

  return {
    context: {
      access: {
        role: "client",
        displayName: typeof profile.display_name === "string" &&
            profile.display_name.trim()
          ? profile.display_name
          : user.email || "Restaurant account",
        restaurantName: restaurant.name.trim(),
        restaurantId: membership.restaurant_id,
      },
      userId: user.id,
      client,
    },
    serverVerifiedAccessToken: token,
  };
}

export async function resolveMomoMediaFinalizeContext(input: {
  request: Request;
  config: ServerSupabasePublicConfig | null;
  cookieContext: ServerVeroxaContext | null;
  hadProjectAuthCookie: boolean;
  dependencies?: MomoMediaFinalizeBearerDependencies;
}): Promise<MomoMediaFinalizeResolvedContext | null> {
  if (input.cookieContext) return { context: input.cookieContext };
  if (!input.config || input.hadProjectAuthCookie) return null;
  let bearerContext: MomoMediaFinalizeBearerContext | null;
  try {
    bearerContext = await resolveBearerContext(
      input.request,
      input.config,
      input.dependencies ?? {},
    );
  } catch {
    return null;
  }
  return bearerContext
    ? {
        context: bearerContext.context,
        serverVerifiedAccessToken: bearerContext.serverVerifiedAccessToken,
      }
    : null;
}
