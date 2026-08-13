import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getMomoContentAiWebhookBridgeConfig,
  invokeMomoContentAiWebhookBridge,
} from "../app/momo-content-ai-webhook-bridge.ts";
import { momoCanonicalJson } from "../app/momo-canonical-json.ts";
import {
  validMomoContentAiWebhookLifecycleRequest,
  verifyMomoContentAiWebhookBridgeSignature,
} from "../supabase/functions/_shared/momo-content-ai-webhook-lifecycle-contract.ts";

const keys = generateKeyPairSync("ed25519");
const privateKey = keys.privateKey.export({ type: "pkcs8", format: "der" }).toString("base64");
const publicKey = keys.publicKey.export({ type: "spki", format: "der" }).toString("base64");
const publishableKey = "sb_publishable_test_key";
const RUN_ID = "11111111-1111-4111-8111-111111111111";
const CLAIM_TOKEN = "22222222-2222-4222-8222-222222222222";
const HASH = "a".repeat(64);
const edgeSource = await readFile(new URL(
  "../supabase/functions/momo-content-ai-webhook-lifecycle/index.ts",
  import.meta.url,
), "utf8");
const supabaseConfig = await readFile(new URL("../supabase/config.toml", import.meta.url), "utf8");
const webhookRouteSource = await readFile(new URL(
  "../app/api/openai/webhook/route.ts",
  import.meta.url,
), "utf8");

function identity() {
  return {
    eventId: "evt_momo_content_001",
    webhookId: "wh_momo_content_001",
    responseId: "resp_momo_content_001",
    runId: RUN_ID,
    requestHash: HASH,
    claimToken: CLAIM_TOKEN,
  };
}

function exceptionRequest(overrides = {}) {
  const core = {
    stage: "content_validation",
    policyVersion: "momo-content-validator-2026-08-08-v5",
    blockers: ["media_quality_issue_detected", "media_quality_too_low"],
    warnings: [],
    evidenceSnapshot: {
      schemaValid: true,
      qualityAssessment: {
        subject: "food",
        visualSummary: "A plated food item is centered on a table.",
        qualityScore: 3,
        qualityIssues: ["blur", "dark"],
      },
    },
    ...overrides,
  };
  return {
    operation: "record_exception",
    ...identity(),
    ...core,
    evidenceCanonical: momoCanonicalJson(core),
    evidenceSha256: HASH,
  };
}

function config() {
  return getMomoContentAiWebhookBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VEROXA_MOMO_CONTENT_AI_WEBHOOK_BRIDGE_PRIVATE_KEY: privateKey,
  });
}

test("webhook bridge configuration is canonical and fail-closed", () => {
  assert.equal(getMomoContentAiWebhookBridgeConfig({}), null);
  assert.equal(getMomoContentAiWebhookBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "http://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VEROXA_MOMO_CONTENT_AI_WEBHOOK_BRIDGE_PRIVATE_KEY: privateKey,
  }), null);
  assert.equal(getMomoContentAiWebhookBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/path",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VEROXA_MOMO_CONTENT_AI_WEBHOOK_BRIDGE_PRIVATE_KEY: privateKey,
  }), null);
  assert.equal(getMomoContentAiWebhookBridgeConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "not_publishable",
    VEROXA_MOMO_CONTENT_AI_WEBHOOK_BRIDGE_PRIVATE_KEY: privateKey,
  }), null);
  assert.deepEqual(config(), {
    endpoint: "https://example.supabase.co/functions/v1/momo-content-ai-webhook-lifecycle",
    publishableKey,
    bridgePrivateKey: privateKey,
  });
});

test("webhook bridge sends one separately signed server-only request", async () => {
  const bridgeConfig = config();
  assert.ok(bridgeConfig);
  const request = { operation: "claim", ...identity() };
  const result = await invokeMomoContentAiWebhookBridge(
    bridgeConfig,
    request,
    async (url, init) => {
      assert.equal(url, "https://example.supabase.co/functions/v1/momo-content-ai-webhook-lifecycle");
      assert.equal(init.method, "POST");
      assert.equal(init.headers.apikey, publishableKey);
      assert.equal(init.headers.authorization, undefined);
      assert.equal(init.headers["x-veroxa-server-purpose"], "momo-content-ai-webhook-lifecycle-v1");
      assert.match(init.headers["x-veroxa-content-ai-timestamp-ms"], /^\d{13}$/u);
      assert.match(init.headers["x-veroxa-content-ai-nonce"], /^[0-9a-f-]{36}$/u);
      assert.match(init.headers["x-veroxa-content-ai-signature"], /^[A-Za-z0-9_-]{86}$/u);
      assert.equal(init.cache, "no-store");
      assert.equal(init.credentials, "omit");
      assert.equal(init.redirect, "error");
      assert.deepEqual(JSON.parse(init.body), request);
      assert.equal(await verifyMomoContentAiWebhookBridgeSignature({
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

test("webhook lifecycle contract binds header ID, event ID, claim token, and accounting", () => {
  assert.equal(validMomoContentAiWebhookLifecycleRequest({ operation: "claim", ...identity() }), true);
  assert.equal(validMomoContentAiWebhookLifecycleRequest({
    operation: "complete_staged",
    ...identity(),
  }), true);
  assert.equal(validMomoContentAiWebhookLifecycleRequest(exceptionRequest()), true);
  assert.equal(validMomoContentAiWebhookLifecycleRequest(exceptionRequest({
    blockers: ["media_quality_too_low", "media_quality_issue_detected"],
  })), false);
  assert.equal(validMomoContentAiWebhookLifecycleRequest({
    ...exceptionRequest(),
    evidenceCanonical: "{}",
  }), false);
  assert.equal(validMomoContentAiWebhookLifecycleRequest(exceptionRequest({
    evidenceSnapshot: {
      schemaValid: true,
      qualityAssessment: null,
    },
  })), false);
  assert.equal(validMomoContentAiWebhookLifecycleRequest(exceptionRequest({
    evidenceSnapshot: {
      schemaValid: true,
      qualityAssessment: {
        subject: "food",
        visualSummary: "A plated food item is centered on a table.",
        qualityScore: 3,
        qualityIssues: ["dark", "blur"],
      },
    },
  })), false);
  assert.equal(validMomoContentAiWebhookLifecycleRequest({
    operation: "finish",
    ...identity(),
    outcome: "processed",
    errorCode: null,
  }), true);
  assert.equal(validMomoContentAiWebhookLifecycleRequest({
    operation: "finish",
    ...identity(),
    outcome: "failed",
    errorCode: null,
  }), false);
  assert.equal(validMomoContentAiWebhookLifecycleRequest({
    operation: "fail",
    ...identity(),
    errorCode: "provider_incomplete_max_output_tokens",
    accountedMicrousd: 110_000,
    providerUsage: { input_tokens: 10_000, output_tokens: 2_000, total_tokens: 12_000 },
  }), true);
  assert.equal(validMomoContentAiWebhookLifecycleRequest({
    operation: "fail",
    ...identity(),
    errorCode: "provider_incomplete_max_output_tokens",
    accountedMicrousd: 109_999,
    providerUsage: { input_tokens: 10_000, output_tokens: 2_000, total_tokens: 12_000 },
  }), false);
  assert.equal(validMomoContentAiWebhookLifecycleRequest({
    operation: "fail",
    ...identity(),
    errorCode: "provider_failed",
    accountedMicrousd: null,
    providerUsage: null,
  }), true);
  assert.equal(validMomoContentAiWebhookLifecycleRequest({
    operation: "fail",
    ...identity(),
    errorCode: "provider_failed",
    accountedMicrousd: 6_000_000,
    providerUsage: null,
  }), false);
  assert.equal(validMomoContentAiWebhookLifecycleRequest({
    operation: "fail",
    ...identity(),
    webhookId: "evt_wrong_namespace",
    errorCode: "provider_failed",
    accountedMicrousd: null,
    providerUsage: null,
  }), false);
  assert.equal(validMomoContentAiWebhookLifecycleRequest({
    operation: "claim",
    ...identity(),
    claimToken: "00000000-0000-0000-0000-000000000000",
  }), false);
});

test("webhook signature rejects tampering and stale timestamps", async () => {
  const bridgeConfig = config();
  assert.ok(bridgeConfig);
  let captured;
  await invokeMomoContentAiWebhookBridge(
    bridgeConfig,
    { operation: "claim", ...identity() },
    async (_url, init) => {
      captured = init;
      return Response.json({ data: RUN_ID });
    },
  );
  assert.equal(await verifyMomoContentAiWebhookBridgeSignature({
    publicKeyBase64: publicKey,
    timestampMs: captured.headers["x-veroxa-content-ai-timestamp-ms"],
    nonce: captured.headers["x-veroxa-content-ai-nonce"],
    body: `${captured.body} `,
    signature: captured.headers["x-veroxa-content-ai-signature"],
  }), false);
  assert.equal(await verifyMomoContentAiWebhookBridgeSignature({
    publicKeyBase64: publicKey,
    timestampMs: String(Date.now() - 120_000),
    nonce: captured.headers["x-veroxa-content-ai-nonce"],
    body: captured.body,
    signature: captured.headers["x-veroxa-content-ai-signature"],
  }), false);
});

test("webhook bridge rejects oversized requests and ambiguous responses", async () => {
  const bridgeConfig = config();
  assert.ok(bridgeConfig);
  await assert.rejects(
    invokeMomoContentAiWebhookBridge(
      bridgeConfig,
      { operation: "claim", ...identity(), padding: "x".repeat(300_000) },
      async () => { throw new Error("must not fetch"); },
    ),
    /request_too_large/u,
  );
  await assert.rejects(
    invokeMomoContentAiWebhookBridge(
      bridgeConfig,
      { operation: "claim", ...identity() },
      async () => Response.json({ data: RUN_ID, extra: true }),
    ),
    /bridge_invalid/u,
  );
});

test("webhook bridge streams and rejects an oversized chunked response", async () => {
  const bridgeConfig = config();
  assert.ok(bridgeConfig);
  let cancelled = null;
  await assert.rejects(
    invokeMomoContentAiWebhookBridge(
      bridgeConfig,
      { operation: "claim", ...identity() },
      async () => new Response(new ReadableStream({
        pull(controller) {
          controller.enqueue(new Uint8Array(180_000));
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

test("webhook Edge boundary is signed, bounded, service-only, and JWT-independent", () => {
  assert.match(supabaseConfig, /\[functions\.momo-content-ai-webhook-lifecycle\]\s+verify_jwt = false/u);
  assert.match(edgeSource, /request\.body\.getReader\(\)/u);
  assert.match(edgeSource, /total > MAX_REQUEST_BYTES[\s\S]*?reader\.cancel\("request_too_large"\)/u);
  assert.doesNotMatch(edgeSource, /request\.text\(\)/u);
  assert.match(edgeSource, /verifyMomoContentAiWebhookBridgeSignature/u);
  assert.match(edgeSource, /x-veroxa-server-purpose"\) !== "momo-content-ai-webhook-lifecycle-v1"/u);
  assert.match(edgeSource, /SUPABASE_SECRET_KEYS/u);
  assert.doesNotMatch(edgeSource, /auth\.getUser|auth\.getSession/u);
  assert.match(edgeSource, /veroxa_claim_momo_content_ai_webhook_v1/u);
  assert.match(edgeSource, /requestedByFromOwnedClaim\(claimData, body\)/u);
  assert.match(edgeSource, /veroxa_stage_momo_content_ai_webhook_result_v1/u);
  assert.match(edgeSource, /veroxa_complete_staged_momo_content_ai_webhook_v1/u);
  assert.match(edgeSource, /veroxa_momo_upload_pipeline_v2/u);
  assert.match(edgeSource, /p_operation: "record_exception"/u);
  assert.match(edgeSource, /p_payload: \{[\s\S]*?runId: body\.runId,[\s\S]*?evidenceSha256: body\.evidenceSha256/u);
  assert.match(edgeSource, /veroxa_fail_momo_content_ai_webhook_v1/u);
  assert.match(edgeSource, /veroxa_finish_momo_content_ai_webhook_v1/u);
  assert.match(edgeSource, /p_provider_called: true/u);
  assert.doesNotMatch(webhookRouteSource, /responses\.delete/u);
  assert.match(webhookRouteSource, /delivery can be replayed after our final 2xx is lost/u);
});
