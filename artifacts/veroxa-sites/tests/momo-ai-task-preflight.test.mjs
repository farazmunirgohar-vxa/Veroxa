import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  evaluateMomoAiTaskPreflight,
} from "../app/momo-ai-task-preflight.ts";

const RESTAURANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function request(overrides = {}) {
  return {
    taskKind: "restaurant_research",
    actorRole: "team",
    restaurantId: RESTAURANT_ID,
    authorizedRestaurantId: RESTAURANT_ID,
    requestedTools: ["openai.responses.create", "openai.web_search"],
    consequence: "read_only_research",
    estimatedMicrousd: 1_920_200,
    authorizedMicrousd: 20_000_000,
    untrustedDataBoundary: true,
    humanReviewRequired: true,
    externalActionAuthorized: false,
    ...overrides,
  };
}

test("allows only the exact scoped internal task contract", () => {
  const result = evaluateMomoAiTaskPreflight(request());
  assert.equal(result.allowed, true);
  assert.equal(result.decision, "allow");
  assert.deepEqual(result.reasonCodes, []);
});

test("denies Client, cross-restaurant, unknown-tool, and prompt-escalated requests", () => {
  for (const candidate of [
    request({ actorRole: "client" }),
    request({ authorizedRestaurantId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }),
    request({ requestedTools: ["openai.responses.create", "shell.exec"] }),
    request({
      requestedTools: ["openai.responses.create", "external.publish"],
      consequence: "external_write",
      externalActionAuthorized: true,
    }),
    request({ untrustedDataBoundary: false }),
  ]) {
    const result = evaluateMomoAiTaskPreflight(candidate);
    assert.equal(result.allowed, false);
    assert.equal(result.decision, "deny");
    assert.ok(result.reasonCodes.length > 0);
  }
});

test("pauses above the explicit per-task budget instead of crossing it", () => {
  const result = evaluateMomoAiTaskPreflight(request({
    estimatedMicrousd: 20_000_001,
  }));
  assert.equal(result.allowed, false);
  assert.equal(result.decision, "approval_required");
  assert.deepEqual(result.reasonCodes, ["budget_approval_required"]);
});

test("recognizes the three production-private provider boundaries", () => {
  const cases = [
    request({
      taskKind: "content_package_generation",
      actorRole: "system",
      requestedTools: ["openai.responses.create"],
      consequence: "private_draft",
      estimatedMicrousd: 6_000_000,
    }),
    request({
      taskKind: "media_improvement",
      requestedTools: ["openai.images.edit"],
      consequence: "private_media_candidate",
      estimatedMicrousd: 20_000_000,
    }),
    request(),
  ];
  for (const candidate of cases) {
    assert.equal(evaluateMomoAiTaskPreflight(candidate).allowed, true);
  }
});

test("production provider boundaries import and enforce the shared preflight", async () => {
  const files = [
    "app/api/internal/momo/content-ai/dispatch/core.ts",
    "app/api/team/media-ai/improve/core.ts",
    "app/api/team/restaurant-audits/research/research-core.ts",
  ];
  for (const file of files) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.match(source, /evaluateMomoAiTaskPreflight/u, file);
  }
});
