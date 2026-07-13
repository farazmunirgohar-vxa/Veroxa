import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const migration = read(
  "supabase/migrations/20260712213939_restaurant_audit_center_v1.sql",
);
const releaseHardening = read(
  "supabase/migrations/20260712220501_production_release_blocker_hardening.sql",
);
const finalHardening = read(
  "supabase/migrations/20260712230242_audit_center_release_hardening.sql",
);
const sqlTest = read("supabase/tests/restaurant_audit_center_v1.sql");
const sitePage = read("artifacts/veroxa-sites/app/page.tsx");
const momoOperatingCenter = read(
  "artifacts/veroxa-sites/app/momo-operating-center.tsx",
);
const siteData = read("artifacts/veroxa-sites/app/veroxa-supabase.ts");
const siteServer = read("artifacts/veroxa-sites/app/veroxa-supabase-server.ts");
const siteIntake = read(
  "artifacts/veroxa-sites/app/api/audit-requests/route.ts",
);
const siteCenter = read("artifacts/veroxa-sites/app/audit-center.tsx");
const siteRoutes = read("artifacts/veroxa-sites/app/[...slug]/page.tsx");
const siteProxy = read("artifacts/veroxa-sites/proxy.ts");
const siteCallback = read("artifacts/veroxa-sites/app/auth/callback/route.ts");
const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

for (const marker of [
  "create table if not exists public.audit_restaurants",
  "create table if not exists public.audit_requests",
  "create table if not exists public.audit_runs",
  "create table if not exists public.audit_findings",
  "create table if not exists public.audit_reports",
  "force row level security",
  "public.veroxa_current_user_is_active_team()",
  "p_consent_version",
  "p_idempotency_key",
  "p_intake_token",
  "rate_limited",
  "audit_runs_reviewed_immutable",
  "audit_reports_reviewed_immutable",
  "does not become an operational client",
]) {
  must(migration.includes(marker), `Audit Center migration missing: ${marker}`);
}

for (const marker of [
  "reviewed_request_requires_latest_reviewed_report",
  "failed_run_requires_reason",
  "audit_restaurants_normalized_location_idx",
  "capture_audit_event",
  "remove_unsafe_legacy_dev_policies",
  "v_previous.source_snapshot",
]) {
  must(finalHardening.includes(marker), `Final Audit Center hardening missing: ${marker}`);
}
must(
  finalHardening.includes("drop constraint if exists audit_restaurants_identity_unique") &&
    !finalHardening.includes("on conflict (normalized_name, normalized_city, normalized_state)"),
  "Final Audit Center hardening must stop automatic same-name location merging",
);

for (const marker of [
  "protect_public_audit_restaurant_identity",
  "audit_restaurants_public_identity_guard",
  "enforce_audit_review_gates",
  "reviewed_run_requires_evidence_backed_finding",
  "reviewed_report_requires_reviewed_run",
  "reviewed_request_requires_reviewed_report",
]) {
  must(
    migration.includes(marker) && releaseHardening.includes(marker),
    `Audit Center release hardening missing: ${marker}`,
  );
}

must(
  !/audit_[a-z_]+[\s\S]{0,220}references public\.(clients|restaurants|restaurant_members|media_assets|reports)/i.test(
    migration,
  ),
  "Audit Center schema must not reference an operational client table",
);
must(
  !/create policy[\s\S]{0,180}on public\.audit_[a-z_]+[\s\S]{0,100}to anon/i.test(
    migration,
  ),
  "Audit Center tables must not have anon policies",
);

for (const marker of [
  "MAX_BODY_BYTES",
  "cf-connecting-ip",
  "AUDIT_INTAKE_HMAC_SECRET",
  "consentVersion",
  "idempotencyKey",
  "hmacHex",
  "return response({ accepted: false }, 429)",
  "202",
]) {
  must(siteIntake.includes(marker), `Sites intake missing: ${marker}`);
}

for (const marker of [
  "createBrowserClient",
  "auth.getUser()",
  "veroxa_user_profiles",
  "veroxa_restaurant_members",
  "submitPublicAudit",
  "listAuditQueue",
  "startAuditRerun",
  "saveAuditReport",
  '.eq("role", profile.role)',
  "restaurantId: membership.restaurant_id",
  "shouldCreateUser: false",
]) {
  must(siteData.includes(marker), `Sites data layer missing: ${marker}`);
}
must(
  !siteData.includes("shouldCreateUser: true"),
  "Sites auth must not allow public creation of unprovisioned identities",
);

for (const marker of [
  "configureVeroxaSupabase",
  "runtimeConfig",
  "validBrowserSupabaseConfig",
  'publishableKey?.startsWith("sb_publishable_")',
]) {
  must(siteData.includes(marker), `Sites browser Auth config bridge missing: ${marker}`);
}

for (const marker of [
  "createServerClient",
  "auth.getUser()",
  "veroxa_user_profiles",
  "veroxa_restaurant_members",
  "getServerSupabasePublicConfig",
  'publishableKey?.startsWith("sb_publishable_")',
]) {
  must(siteServer.includes(marker), `Sites server auth missing: ${marker}`);
}

for (const marker of ["auth.getClaims()", "request.cookies.set", "response.cookies.set", "headersToSet"]) {
  must(siteProxy.toLowerCase().includes(marker.toLowerCase()), `Sites session refresh proxy missing: ${marker}`);
}
for (const marker of ['!requestedNext.includes("\\\\")', "resolvedNext.origin === requestUrl.origin"]) {
  must(siteCallback.includes(marker), `Sites auth callback redirect guard missing: ${marker}`);
}

for (const marker of [
  '"/team/audits"',
  "RestaurantAuditCenter",
  "SECURE PORTAL ACCESS",
  "submitPublicAudit",
  'setMessage("")',
]) {
  must(sitePage.includes(marker), `Sites route shell missing: ${marker}`);
}

for (const marker of [
  'dynamic = "force-dynamic"',
  "getServerVeroxaAccess",
  "getServerSupabasePublicConfig",
  "initialSupabaseConfig",
  "redirect(`/login?return_to=",
  "access.role !== \"team\"",
  "access.role !== \"client\"",
]) {
  must(siteRoutes.includes(marker), `Sites route guard missing: ${marker}`);
}

for (const marker of [
  "Audit-only boundary",
  "createTeamAudit",
  "addAuditFinding",
  "startAuditRerun",
  "saveAuditReport",
  "Reviewed report locked",
  "audit-run-history",
  "audit-comparison-grid",
  "Unverified submitted sources",
  "Submitted context:",
]) {
  must(siteCenter.includes(marker), `Audit Center UI missing: ${marker}`);
}

for (const marker of [
  "No cached or sample records are being shown",
  "No owner-confirmed restaurant truth yet",
  "No media has been uploaded",
  "No reviewed report exists",
]) {
  must(
    momoOperatingCenter.includes(marker),
    `Sites client fixture firewall missing: ${marker}`,
  );
}

must(
  sqlTest.includes("Audit Center links to operational table"),
  "Audit Center SQL isolation test is missing",
);

if (failures.length) {
  console.error(
    "Restaurant Audit Center V1 check failed:\n" +
      failures.map((failure) => `- ${failure}`).join("\n"),
  );
  process.exit(1);
}

console.log("Restaurant Audit Center V1 check passed.");
