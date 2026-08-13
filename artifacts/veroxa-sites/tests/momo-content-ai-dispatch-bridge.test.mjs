import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getMomoContentAiDispatchBridgeConfig,
  invokeMomoContentAiDispatchBridge,
} from "../app/momo-content-ai-dispatch-bridge.ts";
import {
  validMomoContentAiDispatchLifecycleRequest,
  verifyMomoContentAiDispatchBridgeSignature,
} from "../supabase/functions/_shared/momo-content-ai-dispatch-lifecycle-contract.ts";

const keys = generateKeyPairSync("ed25519");
const privateKey = keys.privateKey.export({
  type: "pkcs8",
  format: "der",
}).toString("base64");
const publicKey = keys.publicKey.export({
  type: "spki",
  format: "der",
}).toString("base64");
const publishableKey = "sb_publishable_test_key";
const RUN_ID = "11111111-1111-4111-8111-111111111111";
const WAKE_NONCE = "22222222-2222-4222-8222-222222222222";
const LEASE_TOKEN = "33333333-3333-4333-8333-333333333333";
const DISPATCH_TOKEN = "44444444-4444-4444-8444-444444444444";
const HASH = "a".repeat(64);
const edgeSource = await readFile(new URL(
  "../supabase/functions/momo-content-ai-dispatch-lifecycle/index.ts",
  import.meta.url,
), "utf8");
const supabaseConfig = await readFile(new URL(
  "../supabase/config.toml",
  import.meta.url,
), "utf8");
const outboxSql = await readFile(new URL(
  "../supabase/migrations/20260801045317_momo_content_ai_dispatch_outbox.sql",
  import.meta.url,
), "utf8");
const rejectionSql = await readFile(new URL(
  "../supabase/migrations/20260801045328_momo_content_ai_definitive_http_rejection.sql",
  import.meta.url,
), "utf8");

function config() {
  return getMomoContentAiDispatchBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VEROXA_MOMO_CONTENT_AI_DISPATCH_BRIDGE_PRIVATE_KEY: privateKey,
  });
}

function identity() {
  return {
    runId: RUN_ID,
    requestHash: HASH,
    leaseToken: LEASE_TOKEN,
  };
}

function functionBody(name, nextName) {
  const start = outboxSql.indexOf(`create function ${name}`);
  assert.notEqual(start, -1, `${name} must exist`);
  const end = nextName
    ? outboxSql.indexOf(`create function ${nextName}`, start + 1)
    : outboxSql.length;
  assert.notEqual(end, -1, `${nextName} must follow ${name}`);
  return outboxSql.slice(start, end);
}

test("dispatch bridge configuration is canonical and fail-closed", () => {
  assert.equal(getMomoContentAiDispatchBridgeConfig({}), null);
  assert.equal(getMomoContentAiDispatchBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "http://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VEROXA_MOMO_CONTENT_AI_DISPATCH_BRIDGE_PRIVATE_KEY: privateKey,
  }), null);
  assert.equal(getMomoContentAiDispatchBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/path",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VEROXA_MOMO_CONTENT_AI_DISPATCH_BRIDGE_PRIVATE_KEY: privateKey,
  }), null);
  assert.equal(getMomoContentAiDispatchBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "not_publishable",
    VEROXA_MOMO_CONTENT_AI_DISPATCH_BRIDGE_PRIVATE_KEY: privateKey,
  }), null);
  assert.deepEqual(config(), {
    endpoint:
      "https://example.supabase.co/functions/v1/momo-content-ai-dispatch-lifecycle",
    publishableKey,
    bridgePrivateKey: privateKey,
  });
});

test("dispatch bridge sends one separately signed server-only request", async () => {
  const bridgeConfig = config();
  assert.ok(bridgeConfig);
  const request = {
    operation: "begin",
    ...identity(),
    dispatchClaimToken: DISPATCH_TOKEN,
    providerRequestSha256: HASH,
  };
  const result = await invokeMomoContentAiDispatchBridge(
    bridgeConfig,
    request,
    async (url, init) => {
      assert.equal(
        url,
        "https://example.supabase.co/functions/v1/momo-content-ai-dispatch-lifecycle",
      );
      assert.equal(init.method, "POST");
      assert.equal(init.headers.apikey, publishableKey);
      assert.equal(init.headers.authorization, undefined);
      assert.equal(
        init.headers["x-veroxa-server-purpose"],
        "momo-content-ai-dispatch-lifecycle-v1",
      );
      assert.match(
        init.headers["x-veroxa-content-ai-timestamp-ms"],
        /^\d{13}$/u,
      );
      assert.match(
        init.headers["x-veroxa-content-ai-signature"],
        /^[A-Za-z0-9_-]{86}$/u,
      );
      assert.equal(init.cache, "no-store");
      assert.equal(init.credentials, "omit");
      assert.equal(init.redirect, "error");
      assert.deepEqual(JSON.parse(init.body), request);
      assert.equal(await verifyMomoContentAiDispatchBridgeSignature({
        publicKeyBase64: publicKey,
        timestampMs: init.headers["x-veroxa-content-ai-timestamp-ms"],
        nonce: init.headers["x-veroxa-content-ai-nonce"],
        body: init.body,
        signature: init.headers["x-veroxa-content-ai-signature"],
      }), true);
      return Response.json({ data: [{ run_id: RUN_ID }] });
    },
  );
  assert.deepEqual(result, [{ run_id: RUN_ID }]);
});

test("dispatch lifecycle accepts only exact lease-owned state transitions", () => {
  const valid = [
    {
      operation: "claim",
      wakeNonce: WAKE_NONCE,
      signedAtMs: Date.now(),
      leaseToken: LEASE_TOKEN,
    },
    {
      operation: "begin",
      ...identity(),
      dispatchClaimToken: DISPATCH_TOKEN,
      providerRequestSha256: HASH,
    },
    {
      operation: "cancel_before_post",
      ...identity(),
      dispatchClaimToken: DISPATCH_TOKEN,
      providerRequestSha256: HASH,
      errorCode: "dispatch_begin_unconfirmed",
    },
    {
      operation: "release",
      ...identity(),
      errorCode: "source_download_unavailable",
      retryable: true,
    },
    {
      operation: "bind",
      ...identity(),
      dispatchClaimToken: DISPATCH_TOKEN,
      providerResponseId: "resp_momo_content_001",
    },
    {
      operation: "reconcile",
      ...identity(),
      dispatchClaimToken: DISPATCH_TOKEN,
      errorCode: "provider_transport_unknown",
    },
    {
      operation: "reject_after_post",
      ...identity(),
      dispatchClaimToken: DISPATCH_TOKEN,
      providerRequestSha256: HASH,
      providerHttpStatus: 400,
      providerResponseSha256: HASH,
      providerRequestId: "req_momo_content_001",
    },
  ];
  for (const request of valid) {
    assert.equal(
      validMomoContentAiDispatchLifecycleRequest(request),
      true,
      request.operation,
    );
    assert.equal(
      validMomoContentAiDispatchLifecycleRequest({ ...request, extra: true }),
      false,
      `${request.operation} extra field`,
    );
  }
  assert.equal(validMomoContentAiDispatchLifecycleRequest({
    ...valid[2],
    providerRequestSha256: "not-a-hash",
  }), false);
  assert.equal(validMomoContentAiDispatchLifecycleRequest({
    ...valid[2],
    dispatchClaimToken: "00000000-0000-0000-0000-000000000000",
  }), false);
  assert.equal(validMomoContentAiDispatchLifecycleRequest({
    ...valid.at(-1),
    providerHttpStatus: 429,
  }), false);
});

test("dispatch signature rejects body tampering and stale timestamps", async () => {
  const bridgeConfig = config();
  assert.ok(bridgeConfig);
  let captured;
  await invokeMomoContentAiDispatchBridge(
    bridgeConfig,
    {
      operation: "release",
      ...identity(),
      errorCode: "source_download_unavailable",
      retryable: true,
    },
    async (_url, init) => {
      captured = init;
      return Response.json({ data: RUN_ID });
    },
  );
  assert.equal(await verifyMomoContentAiDispatchBridgeSignature({
    publicKeyBase64: publicKey,
    timestampMs: captured.headers["x-veroxa-content-ai-timestamp-ms"],
    nonce: captured.headers["x-veroxa-content-ai-nonce"],
    body: `${captured.body} `,
    signature: captured.headers["x-veroxa-content-ai-signature"],
  }), false);
  assert.equal(await verifyMomoContentAiDispatchBridgeSignature({
    publicKeyBase64: publicKey,
    timestampMs: String(Date.now() - 120_000),
    nonce: captured.headers["x-veroxa-content-ai-nonce"],
    body: captured.body,
    signature: captured.headers["x-veroxa-content-ai-signature"],
  }), false);
});

test("dispatch bridge streams and rejects an oversized chunked response", async () => {
  const bridgeConfig = config();
  assert.ok(bridgeConfig);
  let cancelled = null;
  await assert.rejects(
    invokeMomoContentAiDispatchBridge(
      bridgeConfig,
      { operation: "release", ...identity(), errorCode: "source_missing", retryable: true },
      async () => new Response(new ReadableStream({
        pull(controller) {
          controller.enqueue(new Uint8Array(200_000));
        },
        cancel(reason) {
          cancelled = reason;
        },
      }), { headers: { "content-type": "application/json" } }),
    ),
    /bridge_invalid/u,
  );
  assert.equal(cancelled, "response_too_large");
});

test("dispatch Edge boundary is signed, bounded, service-only, and JWT-independent", () => {
  assert.match(
    supabaseConfig,
    /\[functions\.momo-content-ai-dispatch-lifecycle\]\s+verify_jwt = false/u,
  );
  assert.match(edgeSource, /request\.body\.getReader\(\)/u);
  assert.match(
    edgeSource,
    /total > MAX_REQUEST_BYTES[\s\S]*?reader\.cancel\("request_too_large"\)/u,
  );
  assert.doesNotMatch(edgeSource, /request\.text\(\)/u);
  assert.match(edgeSource, /verifyMomoContentAiDispatchBridgeSignature/u);
  assert.match(
    edgeSource,
    /x-veroxa-server-purpose"\) !==[\s\S]*?momo-content-ai-dispatch-lifecycle-v1/u,
  );
  assert.match(edgeSource, /SUPABASE_SECRET_KEYS/u);
  assert.doesNotMatch(edgeSource, /auth\.getUser|auth\.getSession/u);
  for (const rpc of [
    "veroxa_claim_momo_content_ai_dispatch_v1",
    "veroxa_begin_momo_content_ai_dispatch_v1",
    "veroxa_cancel_momo_content_ai_dispatch_before_post_v1",
    "veroxa_release_momo_content_ai_dispatch_v1",
    "veroxa_bind_momo_content_ai_dispatch_response_v1",
    "veroxa_reconcile_momo_content_ai_dispatch_v1",
    "veroxa_reject_momo_content_ai_dispatch_after_post_v1",
  ]) assert.match(edgeSource, new RegExp(rpc, "u"));
});

test("definitive provider rejection is immutable, exact, conservative, and service-only", () => {
  assert.match(
    rejectionSql,
    /create table veroxa_private\.momo_content_ai_provider_rejection_receipts/u,
  );
  assert.match(rejectionSql, /provider_http_status in \(400,401,403,404,405,413,415,422\)/u);
  assert.match(rejectionSql, /provider_response_sha256 text not null/u);
  assert.match(rejectionSql, /provider_rejection_receipt_is_immutable/u);
  assert.match(
    rejectionSql,
    /outbox\.state <> 'send_intent'[\s\S]*?outbox\.lease_token is distinct from p_lease_token[\s\S]*?outbox\.provider_request_sha256 is distinct from/u,
  );
  assert.match(rejectionSql, /set status = 'failed'[\s\S]*?provider_http_error_without_response[\s\S]*?conservative_reservation/u);
  assert.match(rejectionSql, /set state = 'uncertain', provider_called = true/u);
  assert.match(
    rejectionSql,
    /grant execute on function[\s\S]*?veroxa_reject_momo_content_ai_dispatch_after_post_v1[\s\S]*?to service_role/u,
  );
  assert.doesNotMatch(rejectionSql, /responses\.create|api\.openai|net\.http/iu);
});

test("SQL makes pre-POST cancellation exact, immutable, replayable, and service-only", () => {
  const cancel = functionBody(
    "public.veroxa_cancel_momo_content_ai_dispatch_before_post_v1",
    "public.veroxa_release_momo_content_ai_dispatch_v1",
  );
  assert.match(
    outboxSql,
    /momo_dispatch_outbox_requires_empty_content_run_ledger/u,
  );
  assert.match(
    outboxSql,
    /create table veroxa_private\.momo_content_ai_dispatch_prepost_aborts/u,
  );
  assert.match(
    outboxSql,
    /momo_content_ai_dispatch_prepost_abort_is_immutable/u,
  );
  assert.ok(
    cancel.indexOf("from public.veroxa_momo_content_ai_runs") <
      cancel.indexOf("from veroxa_private.momo_content_ai_dispatch_outbox"),
  );
  assert.match(
    cancel,
    /receipt\.lease_token is distinct from p_lease_token[\s\S]*?receipt\.provider_request_sha256 is distinct from[\s\S]*?p_provider_request_sha256/u,
  );
  assert.match(cancel, /if outbox\.state = 'leased'/u);
  assert.match(cancel, /elsif outbox\.state = 'send_intent'/u);
  assert.match(
    cancel,
    /run\.provider_response_id is not null[\s\S]*?momo_content_ai_result_outbox[\s\S]*?momo_content_ai_webhook_events/u,
  );
  assert.match(
    cancel,
    /set status = 'reserved', provider_called = false[\s\S]*?set provider_called = false/u,
  );
  assert.match(
    cancel,
    /insert into veroxa_private\.momo_content_ai_dispatch_prepost_aborts[\s\S]*?set state = 'queued'/u,
  );
  assert.match(
    cancel,
    /grant execute on function[\s\S]*?veroxa_cancel_momo_content_ai_dispatch_before_post_v1[\s\S]*?to service_role/u,
  );
  assert.doesNotMatch(
    outboxSql,
    /https:\/\/api\.openai|net\.http|responses\/v1/iu,
  );
});

test("the outbox removes every direct legacy service-role dispatch bypass", () => {
  for (const signature of [
    /veroxa_start_momo_content_ai_run_v1\([\s\S]*?uuid,text,uuid,uuid[\s\S]*?\) from service_role/u,
    /veroxa_abort_momo_content_ai_before_provider_v1\([\s\S]*?uuid,text,uuid,uuid[\s\S]*?\) from service_role/u,
    /veroxa_record_momo_content_ai_provider_response_v1\([\s\S]*?uuid,text,text,uuid[\s\S]*?\) from service_role/u,
    /veroxa_fail_unbound_momo_content_ai_dispatch_v1\([\s\S]*?uuid,text,uuid,uuid[\s\S]*?\) from service_role/u,
  ]) assert.match(outboxSql, signature);
});
