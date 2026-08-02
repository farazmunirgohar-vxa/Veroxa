import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createMomoContentAiWebhookPostHandler } from "../app/api/openai/webhook/core.ts";
import { context, output } from "./momo-content-fixture.mjs";

const RUN_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const ACTOR_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const EVENT_ID = "evt_momo_content_001";
const WEBHOOK_ID = "wh_momo_content_001";
const RESPONSE_ID = "resp_momo_content_001";
const REQUEST_HASH = "1".repeat(64);
const INCIDENT_ID = "44444444-4444-4444-8444-444444444444";
const EXCEPTION_EVENT_ID = "55555555-5555-4555-8555-555555555555";
const CANONICAL_ASSET_ID = "66666666-6666-4666-8666-666666666666";
const CLAIM_TOKENS = [
  "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  "ffffffff-ffff-4fff-8fff-ffffffffffff",
  "99999999-9999-4999-8999-999999999999",
];

function webhookRequest(type = "response.completed", overrides = {}, headers = {}) {
  return new Request("https://veroxa.example/api/openai/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": WEBHOOK_ID,
      "webhook-timestamp": String(Math.floor(Date.now() / 1_000)),
      "webhook-signature": "v1,test",
      ...headers,
    },
    body: JSON.stringify({
      id: EVENT_ID,
      type,
      data: { id: RESPONSE_ID },
      ...overrides,
    }),
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

function claimRow(identity, state, overrides = {}) {
  return {
    run_id: RUN_ID,
    run_status: state.runStatus,
    request_hash: REQUEST_HASH,
    source_storage_path: "restaurants/momo/source.jpg",
    source_mime_type: "image/jpeg",
    source_file_size: 250_000,
    source_content_sha256: "2".repeat(64),
    source_width: 1080,
    source_height: 1080,
    target_platforms: [...context.targetPlatforms],
    truth_snapshot: context.truthFields,
    truth_snapshot_sha256: "3".repeat(64),
    reserved_microusd: 6_000_000,
    provider_response_id: RESPONSE_ID,
    output_payload: state.storedOutput,
    provider_error_code: state.providerErrorCode,
    requested_by: ACTOR_ID,
    event_status: state.eventStatus,
    event_id: EVENT_ID,
    webhook_id: WEBHOOK_ID,
    webhook_claim_token: state.eventStatus === "claimed" ? identity.claimToken : null,
    webhook_claim_lease_expires_at: state.eventStatus === "claimed"
      ? new Date(Date.now() + 240_000).toISOString()
      : null,
    owns_webhook_claim: state.eventStatus === "claimed",
    webhook_claim_status: state.eventStatus === "claimed" ? "acquired" : "terminal_other",
    ...overrides,
  };
}

function harness(overrides = {}) {
  const state = {
    runStatus: "provider_running",
    eventStatus: "claimed",
    storedOutput: null,
    providerErrorCode: null,
    payload: providerPayload(),
  };
  const calls = {
    order: [], unwrap: [], retrieve: [], claim: [], stage: [], complete: [],
    recordException: [], fail: [], finish: [],
  };
  let tokenIndex = 0;
  const dependencies = {
    configured: true,
    async unwrap(raw, headers) {
      calls.order.push("unwrap");
      calls.unwrap.push({ raw, headers });
      return JSON.parse(raw);
    },
    async retrieveOpenAI(responseId) {
      calls.order.push("retrieve");
      calls.retrieve.push(responseId);
      return state.payload;
    },
    async claim(identity) {
      calls.order.push("claim");
      calls.claim.push(identity);
      return [claimRow(identity, state)];
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
      return EVENT_ID;
    },
    randomUUID() {
      const token = CLAIM_TOKENS[tokenIndex] ?? CLAIM_TOKENS.at(-1);
      tokenIndex += 1;
      return token;
    },
    ...overrides,
  };
  return {
    calls,
    state,
    handler: createMomoContentAiWebhookPostHandler(dependencies),
  };
}

test("verifies, claims, validates, and completes one stored Momo response", async () => {
  const { calls, handler } = harness();
  const result = await handler(webhookRequest());
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { received: true });
  assert.deepEqual(calls.order, ["unwrap", "retrieve", "claim", "stage", "complete", "finish"]);
  assert.deepEqual(calls.retrieve, [RESPONSE_ID]);
  assert.equal(calls.claim[0].eventId, EVENT_ID);
  assert.equal(calls.claim[0].webhookId, WEBHOOK_ID);
  assert.equal(calls.claim[0].responseId, RESPONSE_ID);
  assert.equal(calls.claim[0].runId, RUN_ID);
  assert.equal(calls.claim[0].requestHash, REQUEST_HASH);
  assert.equal(calls.claim[0].claimToken, CLAIM_TOKENS[0]);
  assert.equal(calls.stage[0].accountedMicrousd, 110_000);
  assert.equal(calls.stage[0].accountingBasis, "provider_usage_estimate");
  assert.deepEqual(calls.finish[0], {
    ...calls.claim[0],
    outcome: "processed",
    errorCode: null,
  });
});

test("acknowledges unrelated verified event types without provider or database work", async () => {
  const { calls, handler } = harness();
  const result = await handler(webhookRequest("fine_tuning.job.succeeded"));
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { received: true, ignored: true });
  assert.deepEqual(calls.order, ["unwrap"]);
});

test("rejects a bad signature and a mismatched webhook header before retrieval", async () => {
  const invalidSignature = harness({ unwrap: async () => { throw new Error("invalid signature"); } });
  assert.equal((await invalidSignature.handler(webhookRequest())).status, 400);
  assert.equal(invalidSignature.calls.retrieve.length, 0);

  const invalidHeader = harness();
  assert.equal((await invalidHeader.handler(webhookRequest(
    "response.completed",
    {},
    { "webhook-id": "evt_not_a_webhook" },
  ))).status, 400);
  assert.deepEqual(invalidHeader.calls.order, []);
});

test("acknowledges an already-terminal delivery while retaining response evidence for late retries", async () => {
  const { calls, state, handler } = harness();
  state.runStatus = "pending_review";
  state.eventStatus = "processed";
  state.storedOutput = output();
  const result = await handler(webhookRequest());
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { received: true, replayed: true });
  assert.deepEqual(calls.order, ["unwrap", "retrieve", "claim"]);
});

test("completes a staged result after a worker response is lost", async () => {
  const { calls, state, handler } = harness();
  state.runStatus = "result_staged";
  state.storedOutput = output();
  const result = await handler(webhookRequest());
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { received: true, recovered: true });
  assert.deepEqual(calls.order, ["unwrap", "retrieve", "claim", "complete", "finish"]);
});

test("fails closed while another live database claim owns the delivery", async () => {
  const { calls, handler } = harness({
    async claim(identity) {
      calls.order.push("claim");
      calls.claim.push(identity);
      throw new Error("momo_content_ai_webhook_claim_live_conflict");
    },
  });
  const result = await handler(webhookRequest());
  assert.equal(result.status, 503);
  assert.deepEqual(calls.order, ["unwrap", "retrieve", "claim"]);
  assert.equal(calls.stage.length, 0);
  assert.equal(calls.finish.length, 0);
});

test("returns retryable while the authoritative stored response is still running", async () => {
  const { calls, state, handler } = harness();
  state.payload = providerPayload({ status: "in_progress", output_text: undefined, usage: undefined });
  const result = await handler(webhookRequest());
  assert.equal(result.status, 503);
  assert.equal((await result.json()).error, "webhook_provider_pending");
  assert.deepEqual(calls.order, ["unwrap", "retrieve", "claim"]);
});

test("settles incomplete provider usage and binds the exact failure to the event", async () => {
  const { calls, state, handler } = harness();
  state.payload = providerPayload({
    status: "incomplete",
    output_text: undefined,
    incomplete_details: { reason: "max_output_tokens" },
  });
  const result = await handler(webhookRequest("response.incomplete"));
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { received: true, failed: true });
  assert.deepEqual(calls.order, ["unwrap", "retrieve", "claim", "fail", "finish"]);
  assert.equal(calls.fail[0].errorCode, "provider_incomplete_max_output_tokens");
  assert.equal(calls.fail[0].accountedMicrousd, 110_000);
  assert.equal(calls.finish[0].errorCode, calls.fail[0].errorCode);
});

test("lets the database apply conservative settlement when failed usage is absent", async () => {
  const { calls, state, handler } = harness();
  state.payload = providerPayload({
    status: "failed",
    output_text: undefined,
    usage: undefined,
  });
  const result = await handler(webhookRequest("response.failed"));
  assert.equal(result.status, 200);
  assert.deepEqual(calls.order, ["unwrap", "retrieve", "claim", "fail", "finish"]);
  assert.equal(calls.fail[0].errorCode, "provider_failed");
  assert.equal(calls.fail[0].accountedMicrousd, null);
  assert.equal(calls.fail[0].providerUsage, null);
});

test("a quality-gate failure is durably failed, finished, and never staged", async () => {
  const { calls, state, handler } = harness();
  state.payload = providerPayload({ output_text: JSON.stringify({ schemaVersion: "wrong" }) });
  const result = await handler(webhookRequest());
  assert.equal(result.status, 200);
  assert.deepEqual(calls.order, [
    "unwrap", "retrieve", "claim", "record_exception", "fail", "finish",
  ]);
  assert.match(calls.fail[0].errorCode, /^validation_/u);
  assert.deepEqual(calls.recordException[0].blockers, ["schema_invalid"]);
  assert.deepEqual(calls.recordException[0].warnings, []);
  assert.deepEqual(calls.recordException[0].evidenceSnapshot, {
    schemaValid: false,
    qualityAssessment: null,
  });
  assert.equal(
    calls.recordException[0].evidenceSha256,
    createHash("sha256").update(calls.recordException[0].evidenceCanonical).digest("hex"),
  );
  assert.equal(calls.stage.length, 0);
});

test("a schema-valid media failure preserves every sorted blocker and only the bounded assessment", async () => {
  const { calls, state, handler } = harness();
  const generated = output();
  generated.assetAssessment.qualityScore = 3;
  generated.assetAssessment.qualityIssues = ["dark", "blur"];
  state.payload = providerPayload({ output_text: JSON.stringify(generated) });

  const result = await handler(webhookRequest());
  assert.equal(result.status, 200);
  assert.deepEqual(calls.recordException[0].blockers, [
    "media_quality_issue_detected",
    "media_quality_too_low",
  ]);
  assert.deepEqual(calls.recordException[0].warnings, []);
  assert.deepEqual(calls.recordException[0].evidenceSnapshot, {
    schemaValid: true,
    qualityAssessment: {
      subject: generated.assetAssessment.subject,
      visualSummary: generated.assetAssessment.visualSummary,
      qualityScore: 3,
      qualityIssues: ["blur", "dark"],
    },
  });
  const canonical = JSON.parse(calls.recordException[0].evidenceCanonical);
  assert.deepEqual(canonical, {
    stage: "content_validation",
    policyVersion: calls.recordException[0].policyVersion,
    blockers: calls.recordException[0].blockers,
    warnings: calls.recordException[0].warnings,
    evidenceSnapshot: calls.recordException[0].evidenceSnapshot,
  });
  assert.equal(Object.hasOwn(canonical, "output"), false);
  assert.equal(calls.fail[0].errorCode, "validation_media_quality_issue_detected");
});

test("does not fail the run when exception evidence has not been durably recorded", async () => {
  const box = harness({
    async recordException(input) {
      box.calls.order.push("record_exception");
      box.calls.recordException.push(input);
      throw new Error("exception ledger unavailable");
    },
  });
  box.state.payload = providerPayload({ output_text: JSON.stringify({ schemaVersion: "wrong" }) });
  const result = await box.handler(webhookRequest());
  assert.equal(result.status, 503);
  assert.deepEqual(box.calls.order, ["unwrap", "retrieve", "claim", "record_exception"]);
  assert.equal(box.calls.fail.length, 0);
  assert.equal(box.calls.finish.length, 0);
});

test("reclaims after a lost stage response and resumes from durable result_staged", async () => {
  let first = true;
  const box = harness({
    async stage(input) {
      box.calls.order.push("stage");
      box.calls.stage.push(input);
      box.state.runStatus = "result_staged";
      box.state.storedOutput = input.output;
      if (first) {
        first = false;
        throw new Error("bridge response lost");
      }
      return RUN_ID;
    },
  });
  assert.equal((await box.handler(webhookRequest())).status, 503);
  assert.equal(box.state.runStatus, "result_staged");
  const replay = await box.handler(webhookRequest());
  assert.equal(replay.status, 200);
  assert.equal(box.calls.stage.length, 1);
  assert.equal(box.calls.complete.length, 1);
  assert.equal(box.calls.finish.length, 1);
  assert.equal(box.calls.claim[1].claimToken, CLAIM_TOKENS[1]);
});

test("reclaims after a lost completion response and replays idempotent Ready reconciliation", async () => {
  let first = true;
  const box = harness({
    async completeStaged(identity) {
      box.calls.order.push("complete");
      box.calls.complete.push(identity);
      box.state.runStatus = "pending_review";
      if (first) {
        first = false;
        throw new Error("bridge response lost");
      }
      return RUN_ID;
    },
  });
  assert.equal((await box.handler(webhookRequest())).status, 503);
  assert.equal(box.state.runStatus, "pending_review");
  const replay = await box.handler(webhookRequest());
  assert.equal(replay.status, 200);
  assert.equal(box.calls.stage.length, 1);
  assert.equal(box.calls.complete.length, 2);
  assert.equal(box.calls.finish.length, 1);
  assert.equal(box.calls.claim[1].claimToken, CLAIM_TOKENS[1]);
});
