import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createMomoContentAiRecoveryHandler,
  momoContentAiRecoveryWakeCanonicalBody,
  momoContentAiRecoveryWakeContext,
} from "../app/api/internal/momo/content-ai/recover/core.ts";
import { context, output } from "./momo-content-fixture.mjs";

const RUN_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const RESTAURANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ACTOR_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const WAKE_NONCE = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const CLAIM_TOKEN = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const RESPONSE_ID = "resp_momo_content_001";
const REQUEST_HASH = "1".repeat(64);
const WAKE_SECRET = "ab".repeat(32);
const INCIDENT_ID = "44444444-4444-4444-8444-444444444444";
const EXCEPTION_EVENT_ID = "55555555-5555-4555-8555-555555555555";
const CANONICAL_ASSET_ID = "66666666-6666-4666-8666-666666666666";
const routeSource = await readFile(new URL(
  "../app/api/internal/momo/content-ai/recover/route.ts",
  import.meta.url,
), "utf8");
const recoverySql = await readFile(new URL(
  "../supabase/migrations/20260801045327_momo_content_ai_response_recovery.sql",
  import.meta.url,
), "utf8");

function recoveryRequest({
  rawBody = momoContentAiRecoveryWakeCanonicalBody,
  timestamp = Date.now().toString(),
  nonce = WAKE_NONCE,
  signature,
  url = "https://veroxa.example/api/internal/momo/content-ai/recover",
} = {}) {
  const signed = signature ?? createHmac(
    "sha256",
    Buffer.from(WAKE_SECRET, "hex"),
  ).update(
    `${momoContentAiRecoveryWakeContext}\n${timestamp}\n${nonce}\n${momoContentAiRecoveryWakeCanonicalBody}`,
  ).digest("hex");
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-veroxa-recovery-timestamp-ms": timestamp,
      "x-veroxa-recovery-nonce": nonce,
      "x-veroxa-recovery-signature": signed,
    },
    body: rawBody,
  });
}

function providerPayload(overrides = {}) {
  return {
    id: RESPONSE_ID,
    object: "response",
    model: "gpt-5.6-sol",
    status: "completed",
    metadata: {
      veroxa_run_id: RUN_ID,
      veroxa_request_hash: REQUEST_HASH,
    },
    output_text: JSON.stringify(output()),
    usage: {
      input_tokens: 10_000,
      output_tokens: 2_000,
      total_tokens: 12_000,
      input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 },
    },
    ...overrides,
  };
}

function harness(options = {}) {
  const state = {
    runStatus: "provider_running",
    eventStatus: "claimed",
    providerErrorCode: null,
    storedOutput: null,
    provider: providerPayload(),
  };
  const calls = {
    order: [], recovery: [], retrieve: [], claim: [], stage: [], complete: [],
    recordException: [], fail: [], finish: [],
  };
  const dependencies = {
    configured: options.configured ?? true,
    wakeHmacSecret: options.wakeHmacSecret ?? WAKE_SECRET,
    async claimRecovery(input) {
      calls.order.push("claim_recovery");
      calls.recovery.push(input);
      return options.recoveryClaim === undefined ? [{
        run_id: RUN_ID,
        request_hash: REQUEST_HASH,
        restaurant_id: RESTAURANT_ID,
        provider_response_id: RESPONSE_ID,
      }] : options.recoveryClaim;
    },
    async retrieveOpenAI(responseId) {
      calls.order.push("retrieve");
      calls.retrieve.push(responseId);
      return state.provider;
    },
    async claim(identity) {
      calls.order.push("claim");
      calls.claim.push(identity);
      return [{
        run_id: RUN_ID,
        run_status: state.runStatus,
        request_hash: REQUEST_HASH,
        target_platforms: [...context.targetPlatforms],
        truth_snapshot: context.truthFields,
        reserved_microusd: 6_000_000,
        provider_response_id: RESPONSE_ID,
        output_payload: state.storedOutput,
        provider_error_code: state.providerErrorCode,
        requested_by: ACTOR_ID,
        event_status: state.eventStatus,
        event_id: identity.eventId,
        webhook_id: identity.webhookId,
        webhook_claim_token: state.eventStatus === "claimed"
          ? identity.claimToken
          : null,
        webhook_claim_lease_expires_at: state.eventStatus === "claimed"
          ? new Date(Date.now() + 240_000).toISOString()
          : null,
        owns_webhook_claim: state.eventStatus === "claimed",
        webhook_claim_status: state.eventStatus === "claimed"
          ? "acquired"
          : "terminal_other",
      }];
    },
    async stage(input) {
      calls.order.push("stage");
      calls.stage.push(input);
      state.runStatus = "result_staged";
      state.storedOutput = input.output;
      return RUN_ID;
    },
    async completeStaged(identity) {
      calls.order.push("complete");
      calls.complete.push(identity);
      state.runStatus = "pending_review";
      return RUN_ID;
    },
    async recordException(input) {
      calls.order.push("record_exception");
      calls.recordException.push(input);
      return {
        incidentId: INCIDENT_ID,
        eventId: EXCEPTION_EVENT_ID,
        status: "open",
        occurrenceCount: 1,
        canonicalAssetId: CANONICAL_ASSET_ID,
        runId: RUN_ID,
      };
    },
    async fail(input) {
      calls.order.push("fail");
      calls.fail.push(input);
      state.runStatus = "failed";
      state.providerErrorCode = input.errorCode;
      return RUN_ID;
    },
    async finish(input) {
      calls.order.push("finish");
      calls.finish.push(input);
      state.eventStatus = input.outcome;
      return input.eventId;
    },
    randomUUID() {
      return CLAIM_TOKEN;
    },
    ...options.dependencies,
  };
  return {
    calls,
    state,
    handler: createMomoContentAiRecoveryHandler(dependencies),
  };
}

test("recovery retrieves and completes only the exact already-bound response", async () => {
  const { calls, handler } = harness();
  const result = await handler(recoveryRequest());
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { received: true });
  assert.deepEqual(calls.order, [
    "claim_recovery", "retrieve", "claim", "stage", "complete", "finish",
  ]);
  assert.deepEqual(calls.retrieve, [RESPONSE_ID]);
  assert.equal(calls.claim[0].runId, RUN_ID);
  assert.equal(calls.claim[0].requestHash, REQUEST_HASH);
  assert.match(calls.claim[0].eventId, /^evt_veroxa_recovery_[0-9a-f]{40}$/u);
  assert.match(calls.claim[0].webhookId, /^wh_veroxa_recovery_[0-9a-f]{40}$/u);
});

test("recovery identity is deterministic and replay-safe", async () => {
  const { calls, handler } = harness();
  assert.equal((await handler(recoveryRequest())).status, 200);
  assert.equal((await handler(recoveryRequest({
    nonce: "99999999-9999-4999-8999-999999999999",
  }))).status, 200);
  assert.equal(calls.claim[0].eventId, calls.claim[1].eventId);
  assert.equal(calls.claim[0].webhookId, calls.claim[1].webhookId);
  assert.deepEqual(calls.order.slice(6), ["claim_recovery", "retrieve", "claim"]);
});

test("recovery returns idle for a consumed or no-longer-eligible wake", async () => {
  const { calls, handler } = harness({ recoveryClaim: [] });
  const result = await handler(recoveryRequest());
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { status: "idle" });
  assert.deepEqual(calls.order, ["claim_recovery"]);
});

test("recovery rejects tampering, stale signatures, paths, and invalid claims", async () => {
  for (const request of [
    recoveryRequest({ rawBody: '{"schemaVersion":1,"extra":true}' }),
    recoveryRequest({ timestamp: String(Date.now() - 120_000) }),
    recoveryRequest({ signature: "00".repeat(32) }),
    recoveryRequest({ url: "https://veroxa.example/api/internal/momo/content-ai/recover?run=1" }),
  ]) {
    const { calls, handler } = harness();
    assert.notEqual((await handler(request)).status, 200);
    assert.deepEqual(calls.order, []);
  }
  const invalid = harness({ recoveryClaim: [{ run_id: "wrong" }] });
  assert.equal((await invalid.handler(recoveryRequest())).status, 503);
  assert.deepEqual(invalid.calls.order, ["claim_recovery"]);
});

test("recovery remains retryable while the exact provider response is running", async () => {
  const { calls, state, handler } = harness();
  state.provider = providerPayload({
    status: "in_progress",
    output_text: undefined,
    usage: undefined,
  });
  const result = await handler(recoveryRequest());
  assert.equal(result.status, 503);
  assert.deepEqual(await result.json(), { error: "webhook_provider_pending" });
  assert.deepEqual(calls.order, ["claim_recovery", "retrieve", "claim"]);
  assert.equal(calls.stage.length, 0);
  assert.equal(calls.fail.length, 0);
  assert.equal(calls.finish.length, 0);
});

test("recovery records a provider terminal failure without creating new work", async () => {
  const { calls, state, handler } = harness();
  state.provider = providerPayload({ status: "failed", output_text: undefined });
  const result = await handler(recoveryRequest());
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { received: true, failed: true });
  assert.deepEqual(calls.order, [
    "claim_recovery", "retrieve", "claim", "fail", "finish",
  ]);
  assert.equal(calls.fail[0].errorCode, "provider_failed");
});

test("recovery preserves one consolidated schema-valid validation exception before failure", async () => {
  const { calls, state, handler } = harness();
  const generated = output();
  generated.assetAssessment.qualityScore = 3;
  generated.assetAssessment.qualityIssues = ["dark", "blur"];
  state.provider = providerPayload({ output_text: JSON.stringify(generated) });
  const result = await handler(recoveryRequest());
  assert.equal(result.status, 200);
  assert.deepEqual(calls.order, [
    "claim_recovery", "retrieve", "claim", "record_exception", "fail", "finish",
  ]);
  assert.deepEqual(calls.recordException[0].blockers, [
    "media_quality_issue_detected",
    "media_quality_too_low",
  ]);
  assert.deepEqual(calls.recordException[0].evidenceSnapshot.qualityAssessment.qualityIssues, [
    "blur", "dark",
  ]);
});

test("recovery route is GET-only toward OpenAI and SQL wakes are one-time", () => {
  assert.match(routeSource, /responses\.retrieve\(responseId\)/u);
  assert.match(routeSource, /operation: "record_exception"/u);
  assert.doesNotMatch(routeSource, /responses\.create|callOpenAI/u);
  assert.match(recoverySql, /state in \('issued','consumed','expired'\)/u);
  assert.match(recoverySql, /momo_content_ai_recovery_one_issued_per_run_idx/u);
  assert.match(recoverySql, /outbox\.state = 'response_bound'/u);
  assert.match(recoverySql, /event\.claim_lease_expires_at > pg_catalog\.clock_timestamp\(\)/u);
  assert.match(recoverySql, /set state = 'consumed'/u);
  assert.match(recoverySql, /grant execute on function public\.veroxa_claim_momo_content_ai_recovery_v1/u);
  assert.doesNotMatch(recoverySql, /responses\.create|api\.openai|net\.http/iu);
});
