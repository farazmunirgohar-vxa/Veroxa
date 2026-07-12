import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const migration = readFileSync(
  resolve(
    root,
    "supabase/migrations/20260712213930_momo_production_foundation_v1.sql",
  ),
  "utf8",
);
const sqlTest = readFileSync(
  resolve(root, "supabase/tests/momo_production_tenant_rls_hardening.sql"),
  "utf8",
);
const legacyM024 = readFileSync(
  resolve(
    root,
    "supabase/archive/legacy_unapplied_migrations/20260601000000_m024a_first_client_metadata_schema.sql",
  ),
  "utf8",
);
const releaseHardening = readFileSync(
  resolve(
    root,
    "supabase/migrations/20260712220501_production_release_blocker_hardening.sql",
  ),
  "utf8",
);
const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

for (const marker of [
  "non-destructive coexistence migration",
  "public.veroxa_restaurants",
  "public.veroxa_user_profiles",
  "public.veroxa_restaurant_members",
  "public.veroxa_media_assets",
  "veroxa_private.operational_restaurant_scope",
  "momo_house_san_antonio",
  "enabled boolean not null default false",
  "veroxa_private.auth_identity_allowlist",
  "provision_allowlisted_auth_identity",
  "veroxa_private.current_user_has_operational_membership",
  "public.veroxa_current_user_is_active_team",
  "public.veroxa_current_user_has_active_restaurant",
  "public.veroxa_current_user_is_team_for_restaurant",
  "force row level security",
  "veroxa_profiles_self_or_team_select",
  "veroxa_restaurants_member_select",
  "veroxa_members_self_or_team_select",
  "veroxa_media_member_select",
  "veroxa_media_client_insert",
  "veroxa_restaurant_media_client_insert",
  "veroxa_restaurant_media_member_select",
  "restaurant-media",
  "Audit Center restaurants never enter this scope automatically",
]) {
  must(migration.includes(marker), `Momo production migration missing: ${marker}`);
}

must(
  !/(?:using\s*\(\s*true\s*\)|with\s+check\s*\(\s*true\s*\))/i.test(
    migration,
  ),
  "Momo production migration contains a broad TRUE policy",
);
must(
  !/veroxa_role_v1[^;]*(owner|operator|admin)/i.test(migration),
  "Versioned production roles must remain client/team only",
);
must(
  !/drop\s+(schema|table)\s+(?:if\s+exists\s+)?public/i.test(migration),
  "Production coexistence migration must not drop the public schema or legacy tables",
);

const legacyBroadPolicies = [
  "clients_dev_authenticated_select",
  "restaurant_upload_keys_dev_authenticated_select",
  "upload_submissions_dev_authenticated_select",
  "upload_submissions_dev_authenticated_insert",
  "upload_submissions_dev_authenticated_update",
  "direction_requests_dev_authenticated_select",
  "direction_requests_dev_authenticated_insert",
  "direction_requests_dev_authenticated_update",
  "team_review_decisions_dev_authenticated_select",
  "team_review_decisions_dev_authenticated_insert",
];
for (const policy of legacyBroadPolicies) {
  must(legacyM024.includes(policy), `Legacy M024 policy inventory drifted: ${policy}`);
  must(
    migration.includes(policy) && releaseHardening.includes(policy) &&
      migration.includes("execute format('drop policy if exists %I on public.%I'") &&
      releaseHardening.includes("execute format('drop policy if exists %I on public.%I'"),
    `Production hardening does not remove legacy broad policy: ${policy}`,
  );
}

for (const marker of [
  "veroxa_restaurants",
  "veroxa_user_profiles",
  "veroxa_restaurant_members",
  "operational_restaurant_scope",
  "relforcerowsecurity",
  "veroxa_restaurant_media_member_select",
]) {
  must(sqlTest.includes(marker), `Momo production SQL test missing: ${marker}`);
}

if (failures.length) {
  console.error(
    "Momo production tenant/RLS guardrail failed:\n" +
      failures.map((failure) => `- ${failure}`).join("\n"),
  );
  process.exit(1);
}

console.log("Momo production tenant/RLS guardrail passed.");
