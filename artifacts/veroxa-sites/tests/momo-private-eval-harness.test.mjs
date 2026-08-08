import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildBlindLiveCase,
  buildLiveExecutionPlan,
  compare,
  parseArgs,
} from "../evals/run-local.mjs";

async function evalCases() {
  const raw = await readFile(new URL("../evals/cases.jsonl", import.meta.url), "utf8");
  return raw.split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

test("private eval harness passes offline without a key or external action", () => {
  const result = spawnSync(process.execPath, [
    "evals/run-local.mjs",
    "--max-cases",
    "10",
  ], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
    env: { ...process.env, OPENAI_API_KEY: "", OPENAI_BASE_URL: "" },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.privateOnly, true);
  assert.equal(report.externalWritesAllowed, false);
  assert.equal(report.responseStorage, false);
  assert.equal(report.toolsEnabled, false);
  assert.equal(report.requestRetries, 0);
  assert.equal(report.liveModel, null);
  assert.equal(report.summary.passed, true);
  assert.equal(report.summary.liveCases, 0);
  assert.equal(report.summary.total, 17);
});

test("private live eval requires exactly ten cases", () => {
  assert.deepEqual(parseArgs(["--live", "--max-cases", "10"]), {
    live: true,
    maxCases: 10,
    priorCostUsd: 0,
  });
  assert.throws(
    () => parseArgs(["--live", "--max-cases", "9"]),
    /invalid_max_cases/u,
  );
});

test("private live eval hides labels and preflights below the hard cost ceiling", async () => {
  const cases = await evalCases();
  const plan = buildLiveExecutionPlan(cases, 10);
  assert.equal(plan.requests.length, 10);
  assert.ok(plan.aggregateWorstCaseCostUsd > 0);
  assert.ok(plan.aggregateWorstCaseCostUsd <= 2);
  assert.ok(plan.cumulativeWorstCaseCostUsd <= 2);
  for (const request of plan.requests) {
    const blind = buildBlindLiveCase(request.caseItem);
    assert.deepEqual(Object.keys(blind).sort(), [
      "input",
      ...(Object.hasOwn(request.caseItem, "untrustedText") ? ["untrustedText"] : []),
    ].sort());
    assert.doesNotMatch(request.input, /expectedDecision|requiredReasonCodes/u);
    assert.doesNotMatch(request.input, new RegExp(request.caseItem.id, "u"));
  }
  assert.throws(
    () => buildLiveExecutionPlan(cases, 10, 0.8),
    /live_eval_cost_ceiling_exceeded/u,
  );
});

test("private eval requires an exact canonical reason set", () => {
  const caseItem = {
    expectedDecision: "deny",
    requiredReasonCodes: ["actor_role_denied"],
  };
  assert.equal(compare(caseItem, {
    decision: "deny",
    reasonCodes: ["actor_role_denied"],
  }), true);
  assert.equal(compare(caseItem, {
    decision: "deny",
    reasonCodes: ["actor_role_denied", "unknown_tool"],
  }), false);
});
