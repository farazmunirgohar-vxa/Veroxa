import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const centerModule = new URL("../app/audit-center.tsx", import.meta.url).href;
const engineModule = new URL("../app/restaurant-audit-engine.ts", import.meta.url).href;

test("AI UI normalizes one exact payload and validates the complete provenance response", () => {
  const source = `
    import {
      aiResearchErrorMessage,
      aiResearchPayloadKey,
      aiResearchRequestHash,
      normalizeAiResearchPayload,
      parseAiResearchResult,
    } from ${JSON.stringify(centerModule)};
    import { RESTAURANT_AUDIT_CATEGORY_DEFINITIONS } from ${JSON.stringify(engineModule)};

    const raw = {
      targetRequestId: null,
      restaurantName: "  Momo House  ",
      city: " Chicago ",
      state: " IL ",
      websiteUrl: "https://momo.example/?b=2&a=1#hours",
      googleProfileUrl: "https://www.google.com/maps/place/Momo",
    };
    const payload = normalizeAiResearchPayload(raw);
    const requestHash = await aiResearchRequestHash(payload);
    const response = {
      researchId: "11111111-1111-4111-8111-111111111111",
      requestHash,
      targetRequestId: payload.targetRequestId,
      model: "gpt-5.6-luna",
      pricingVersion: "openai-gpt-5.6-luna-web-2026-07-14-v2",
      actualMicrousd: 45678,
      websiteUrl: payload.websiteUrl,
      googleProfileUrl: payload.googleProfileUrl,
      identityNote: "Momo House in Chicago, IL is corroborated by its website and exact Google profile.",
      identityEvidenceUrls: [payload.websiteUrl, payload.googleProfileUrl],
      sources: [
        { url: payload.websiteUrl, title: "Momo House", sourceType: "url" },
        { url: payload.googleProfileUrl, title: "Momo House Google profile", sourceType: "url" },
        { url: "https://www.yelp.com/biz/momo-house-chicago", title: "Momo House listing", sourceType: "url" },
      ],
      categories: RESTAURANT_AUDIT_CATEGORY_DEFINITIONS.map((category) => ({
        key: category.key,
        status: "confirmed_present",
        score: category.weight,
        evidenceUrl: payload.websiteUrl,
        note: "The consulted public source supports this reviewed category state.",
      })),
    };
    const parsed = parseAiResearchResult(response, requestHash, payload);
    console.log(JSON.stringify({
      payload,
      keyMatches: aiResearchPayloadKey(raw) === aiResearchPayloadKey({
        ...raw,
        restaurantName: "Momo House",
        websiteUrl: "https://momo.example/?a=1&b=2",
      }),
      privateUrlRejected: normalizeAiResearchPayload({ ...raw, websiteUrl: "http://127.0.0.1/admin" }) === null,
      parsedSourceCount: parsed?.sources.length,
      parsedResearchRef: parsed?.researchRef,
      mismatchedHashRejected: parseAiResearchResult(response, "b".repeat(64), payload) === null,
      mismatchedTargetRejected: parseAiResearchResult({ ...response, targetRequestId: "22222222-2222-4222-8222-222222222222" }, requestHash, payload) === null,
      embeddedStateRejected: parseAiResearchResult({ ...response, identityNote: "Momo House in Chicago has an ILLEGAL listing, but no explicit state." }, requestHash, payload) === null,
      overBoundCostRejected: parseAiResearchResult({ ...response, actualMicrousd: 1920201 }, requestHash, payload) === null,
      disabledMessage: aiResearchErrorMessage("ai_audit_disabled"),
      budgetMessage: aiResearchErrorMessage("ai_budget_exhausted"),
      conflictMessage: aiResearchErrorMessage("idempotency_conflict"),
      failedAttemptMessage: aiResearchErrorMessage("ai_previous_attempt_failed"),
    }));
  `;
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "--eval", source],
    { cwd: appRoot, encoding: "utf8", env: { ...process.env } },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const checked = JSON.parse(result.stdout);
  assert.deepEqual(checked.payload, {
    targetRequestId: null,
    restaurantName: "Momo House",
    city: "Chicago",
    state: "IL",
    websiteUrl: "https://momo.example/?a=1&b=2",
    googleProfileUrl: "https://www.google.com/maps/place/Momo",
  });
  assert.equal(checked.keyMatches, true);
  assert.equal(checked.privateUrlRejected, true);
  assert.equal(checked.parsedSourceCount, 3);
  assert.equal(checked.parsedResearchRef.researchId, "11111111-1111-4111-8111-111111111111");
  assert.equal(checked.mismatchedHashRejected, true);
  assert.equal(checked.mismatchedTargetRejected, true);
  assert.equal(checked.embeddedStateRejected, true);
  assert.equal(checked.overBoundCostRejected, true);
  assert.match(checked.disabledMessage, /disabled.*No provider call or charge/i);
  assert.match(checked.budgetMessage, /daily AI research budget has been reached/i);
  assert.match(checked.conflictMessage, /bound to a different restaurant payload/i);
  assert.match(checked.failedAttemptMessage, /previous provider attempt was finalized as failed/i);
});

test("Audit Center sends and saves only payload-bound, visibly retained research provenance", async () => {
  const source = await readFile(new URL("../app/audit-center.tsx", import.meta.url), "utf8");
  assert.match(source, /previousAttempt\?\.payloadKey === payloadKey/);
  assert.match(source, /"idempotency-key": idempotencyKey/);
  assert.match(source, /\.\.\.researchPayload,[\s\S]{0,80}idempotencyKey/);
  assert.match(source, /expectedRequestHash = await aiResearchRequestHash\(researchPayload\)/);
  assert.match(source, /targetRequestId: targetRequestIdFor\(target\)/);
  assert.match(source, /aiResearchPayloadKey\(aiResearchPayloadFor\(builderRef\.current, builderTargetRef\.current\)\)[\s\S]{0,40}!== payloadKey/);
  assert.match(source, /errorCode === "ai_previous_attempt_failed"/);
  assert.match(source, /clearAiResearchDraft\(\)/);
  assert.match(source, /All consulted sources \(\{aiResearchProvenance\.sources\.length\}\)/);
  assert.match(source, /researchRef: aiResearchProvenance\?\.researchRef/);
  assert.match(source, /savedSnapshot\.researchRef/);
});
