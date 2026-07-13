import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  createApprovedMomoClientIdentityGateway,
  provisionApprovedMomoClientIdentity,
  validateSupabaseUrl,
} from "./approved-momo-client-identity";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export async function main(): Promise<void> {
  if (process.env.VEROXA_PROVISION_APPROVED_MOMO_CLIENT_IDENTITY !== "YES") {
    throw new Error(
      "Refusing to provision without VEROXA_PROVISION_APPROVED_MOMO_CLIENT_IDENTITY=YES",
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
  const result = await provisionApprovedMomoClientIdentity(
    createApprovedMomoClientIdentityGateway(client),
    requiredEnv("VEROXA_APPROVED_MOMO_CLIENT_EMAIL"),
  );

  console.log(
    result.outcome === "created"
      ? "Approved Momo client identity provisioned and verified against the database allowlist."
      : "Approved Momo client identity already exists and its client/Momo access is verified.",
  );
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  main().catch((error: unknown) => {
    console.error(
      error instanceof Error
        ? error.message
        : "Momo client identity provisioning failed",
    );
    process.exitCode = 1;
  });
}
