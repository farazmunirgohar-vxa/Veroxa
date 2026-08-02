import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sql = await readFile(new URL(
  "../supabase/migrations/20260802000522_momo_content_ai_background_activation.sql",
  import.meta.url,
), "utf8");
const expirySql = await readFile(new URL(
  "../supabase/migrations/20260801045329_momo_content_ai_bound_response_expiry.sql",
  import.meta.url,
), "utf8");
const managedBoundarySql = await readFile(new URL(
  "../supabase/migrations/20260802002819_momo_content_ai_managed_boundary.sql",
  import.meta.url,
), "utf8");

function functionBody(name, nextName) {
  const start = sql.indexOf(`create function ${name}`);
  assert.notEqual(start, -1, `${name} must exist`);
  const end = nextName ? sql.indexOf(`create function ${nextName}`, start + 1) : sql.length;
  assert.notEqual(end, -1, `${nextName} must follow ${name}`);
  return sql.slice(start, end);
}

test("background activation installs only Vault-backed pg_net delivery", () => {
  assert.match(sql, /create extension if not exists supabase_vault with schema vault/u);
  assert.match(sql, /create extension if not exists pg_net with schema extensions/u);
  assert.match(sql, /revoke all on schema net from public, anon, authenticated, service_role/u);
  assert.match(sql, /revoke all on all tables in schema net\s+from public, anon, authenticated, service_role/u);
  assert.match(sql, /revoke all on all sequences in schema net\s+from public, anon, authenticated, service_role/u);
  assert.match(sql, /revoke all on all functions in schema net\s+from public, anon, authenticated, service_role/u);
  assert.match(sql, /from vault\.decrypted_secrets/u);
  assert.match(sql, /secret_count <> 1/u);
  assert.match(sql, /revoke all on function[\s\S]*?momo_content_ai_runtime_secret_v1/u);
  assert.doesNotMatch(sql, /OPENAI_API_KEY|authorization['"]|bearer |api\.openai/iu);
});

test("managed pg_net remains behind a continuously checked application boundary", () => {
  assert.match(managedBoundarySql, /momo_content_ai_database_boundary_v1/u);
  assert.match(managedBoundarySql, /'anon'::name[\s\S]*?'authenticated'::name[\s\S]*?'service_role'::name[\s\S]*?'authenticator'::name/u);
  assert.match(managedBoundarySql, /rolcanlogin/u);
  assert.match(managedBoundarySql, /has_schema_privilege\([\s\S]*?'veroxa_private', 'USAGE'/u);
  assert.match(managedBoundarySql, /has_schema_privilege\([\s\S]*?'public', 'CREATE'/u);
  assert.match(managedBoundarySql, /pg_get_functiondef[\s\S]*?\\mnet\\s\*\\\.[\s\S]*?\\mexecute\\M/u);
  assert.match(managedBoundarySql, /pg_get_viewdef[\s\S]*?\\mnet\\s\*\\\./u);
  assert.match(managedBoundarySql, /pg_trigger[\s\S]*?pg_get_functiondef/u);
  const runtimeStart = managedBoundarySql.indexOf(
    "create or replace function veroxa_private.momo_content_ai_runtime_secret_v1",
  );
  const runtime = managedBoundarySql.slice(runtimeStart);
  assert.ok(runtime.indexOf("momo_content_ai_database_boundary_v1") <
    runtime.indexOf("vault.decrypted_secrets"));
  assert.match(managedBoundarySql, /momo_content_ai_database_boundary_not_satisfied/u);
  assert.match(managedBoundarySql, /PostgREST rejects the net schema/u);
});

test("dispatch verifies exact secrets before issuing and signs the exact worker context", () => {
  const body = functionBody(
    "veroxa_private.deliver_momo_content_ai_dispatch_wake_v1",
    "veroxa_private.deliver_momo_content_ai_recovery_wake_v1",
  );
  assert.ok(body.indexOf("momo_content_ai_runtime_secret_v1") <
    body.indexOf("issue_momo_content_ai_dispatch_wake_v1"));
  assert.match(body, /https:\/\/veroxasystems\.com\/api\/internal\/momo\/content-ai\/dispatch/u);
  assert.match(body, /veroxa:momo-content-ai-dispatch-wake:v1/u);
  assert.match(body, /wake\.wake_signed_at_ms::text[\s\S]*?wake\.wake_nonce::text[\s\S]*?canonical_body/u);
  assert.match(body, /extensions\.hmac[\s\S]*?pg_catalog\.decode\(hmac_secret, 'hex'\)/u);
  assert.match(body, /select net\.http_post\(/u);
  assert.match(body, /hmac_secret is null[\s\S]*?hmac_secret !~ '\^\[0-9a-f\]\{64\}\$'/u);
  assert.ok(body.indexOf("hmac_secret is null") <
    body.indexOf("issue_momo_content_ai_dispatch_wake_v1"));
  assert.match(body, /timeout_milliseconds := 120000/u);
  assert.match(body, /x-veroxa-dispatch-signature/u);
});

test("recovery is separately scheduled and targets only the GET-only route", () => {
  const body = functionBody(
    "veroxa_private.deliver_momo_content_ai_recovery_wake_v1",
    null,
  );
  assert.ok(body.indexOf("momo_content_ai_runtime_secret_v1") <
    body.indexOf("issue_momo_content_ai_recovery_wake_v1"));
  assert.match(body, /https:\/\/veroxasystems\.com\/api\/internal\/momo\/content-ai\/recover/u);
  assert.match(body, /veroxa:momo-content-ai-recovery-wake:v1/u);
  assert.match(body, /x-veroxa-recovery-signature/u);
  assert.match(body, /hmac_secret is null[\s\S]*?hmac_secret !~ '\^\[0-9a-f\]\{64\}\$'/u);
  assert.ok(body.indexOf("hmac_secret is null") <
    body.indexOf("issue_momo_content_ai_recovery_wake_v1"));
  assert.match(body, /timeout_milliseconds := 120000/u);
  assert.match(sql, /'veroxa-momo-content-ai-dispatch',[\s\S]*?'\* \* \* \* \*'/u);
  assert.match(sql, /'veroxa-momo-content-ai-response-recovery',[\s\S]*?'\*\/5 \* \* \* \*'/u);
  assert.match(sql, /'veroxa-momo-content-ai-bound-response-expiry',[\s\S]*?'\*\/15 \* \* \* \*'/u);
  assert.doesNotMatch(body, /responses\.create|api\.openai/iu);
});

test("bound responses expire only after webhook recovery and without redispatch", () => {
  assert.match(expirySql, /outbox\.response_bound_at <=[\s\S]*?interval '96 hours'/u);
  assert.match(expirySql, /event\.claim_lease_expires_at > pg_catalog\.clock_timestamp\(\)/u);
  assert.match(expirySql, /for update of target_run skip locked/u);
  assert.match(expirySql, /from veroxa_private\.momo_content_ai_dispatch_outbox target_outbox[\s\S]*?for update/u);
  assert.match(expirySql, /provider_response_recovery_timeout/u);
  assert.match(expirySql, /veroxa_fail_momo_content_ai_run_v1/u);
  assert.doesNotMatch(expirySql, /responses\.create|net\.http|api\.openai/iu);
});
