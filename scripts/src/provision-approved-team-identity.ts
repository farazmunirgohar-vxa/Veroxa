import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  createApprovedTeamIdentityGateway,
  provisionApprovedTeamIdentity,
  validateSupabaseUrl,
} from "./approved-team-identity";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export async function main(): Promise<void> {
  if (process.env.VEROXA_PROVISION_APPROVED_TEAM_IDENTITY !== "YES") {
    throw new Error(
      "Refusing to provision without VEROXA_PROVISION_APPROVED_TEAM_IDENTITY=YES",
    );
  }

  const client = createClient(
    validateSupabaseUrl(requiredEnv("SUPABASE_URL")),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
  const result = await provisionApprovedTeamIdentity(
    createApprovedTeamIdentityGateway(client),
    requiredEnv("VEROXA_APPROVED_TEAM_EMAIL"),
  );

  console.log(
    result.outcome === "created"
      ? "Approved Team identity provisioned and verified against the database allowlist."
      : "Approved Team identity already exists and its Team/Momo access is verified.",
  );
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Identity provisioning failed");
    process.exitCode = 1;
  });
}
