import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  MOMO_OPERATIONAL_RESTAURANT,
  normalizeApprovedTeamEmail,
  validateSupabaseUrl,
} from "./approved-team-identity";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function validatedAuthRedirect(value: string): string {
  const parsed = new URL(value);
  if (
    parsed.protocol !== "https:" ||
    !["veroxasystems.com", "www.veroxasystems.com"].includes(parsed.hostname) ||
    parsed.pathname !== "/auth/callback" ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.hash
  ) {
    throw new Error("VEROXA_AUTH_REDIRECT_TO must use the production Veroxa Auth callback");
  }
  return parsed.toString();
}

export async function main(): Promise<void> {
  if (process.env.VEROXA_RUN_APPROVED_TEAM_AUTH_SMOKE !== "YES") {
    throw new Error(
      "Refusing to create an Auth smoke session without VEROXA_RUN_APPROVED_TEAM_AUTH_SMOKE=YES",
    );
  }

  const url = validateSupabaseUrl(requiredEnv("SUPABASE_URL"));
  const email = normalizeApprovedTeamEmail(requiredEnv("VEROXA_APPROVED_TEAM_EMAIL"));
  const redirectTo = validatedAuthRedirect(requiredEnv("VEROXA_AUTH_REDIRECT_TO"));
  const admin = createClient(url, requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  const tokenHash = link.properties?.hashed_token;
  if (linkError || !tokenHash) {
    throw new Error("Unable to generate the bounded Team Auth smoke link", {
      cause: linkError,
    });
  }

  const authenticated = createClient(url, requiredEnv("SUPABASE_PUBLISHABLE_KEY"), {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const { data: session, error: verifyError } = await authenticated.auth.verifyOtp({
    token_hash: tokenHash,
    type: "magiclink",
  });
  if (verifyError || !session.user) {
    throw new Error("Approved Team magic-link verification failed", { cause: verifyError });
  }

  try {
    const [profileResult, membershipResult] = await Promise.all([
      authenticated
        .from("veroxa_user_profiles")
        .select("role, status")
        .eq("user_id", session.user.id)
        .single(),
      authenticated
        .from("veroxa_restaurant_members")
        .select("restaurant_id, role, status, veroxa_restaurants!inner(name, status)")
        .eq("user_id", session.user.id)
        .eq("role", "team")
        .single(),
    ]);
    if (profileResult.error || membershipResult.error) {
      throw new Error("Authenticated Team RLS smoke query failed", {
        cause: profileResult.error ?? membershipResult.error,
      });
    }
    const restaurant = membershipResult.data.veroxa_restaurants as unknown as {
      name: string;
      status: string;
    };
    if (
      profileResult.data.role !== "team" ||
      profileResult.data.status !== "active" ||
      membershipResult.data.role !== "team" ||
      membershipResult.data.status !== "active" ||
      restaurant.name !== MOMO_OPERATIONAL_RESTAURANT ||
      restaurant.status !== "active"
    ) {
      throw new Error("Authenticated Team smoke returned an invalid role or restaurant scope");
    }
  } finally {
    const accessToken = session.session?.access_token;
    if (accessToken) {
      const { error: revokeError } = await admin.auth.admin.signOut(accessToken, "local");
      if (revokeError) {
        throw new Error("Authenticated Team smoke session could not be revoked", {
          cause: revokeError,
        });
      }
    }
    const { error: localSignOutError } = await authenticated.auth.signOut({ scope: "local" });
    if (localSignOutError) {
      throw new Error("Authenticated Team smoke client session could not be cleared", {
        cause: localSignOutError,
      });
    }
  }

  console.log("Approved Team Auth/RLS smoke passed without exposing a link, token, or session.");
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Team Auth smoke failed");
    process.exitCode = 1;
  });
}
