import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const dataSource = await readFile(new URL("../app/momo-data.ts", import.meta.url), "utf8");
const operatingSource = await readFile(new URL("../app/momo-operating-center.tsx", import.meta.url), "utf8");

test("content preparation preserves one deterministic review-scoped idempotency key", () => {
  const start = dataSource.indexOf("export async function generateMomoContentPackage");
  const end = dataSource.indexOf("export async function approveMomoContentPackage", start);
  assert.ok(start >= 0 && end > start);
  const implementation = dataSource.slice(start, end);
  assert.match(implementation, /idempotencyKey: string/u);
  assert.doesNotMatch(implementation, /randomUUID/u);
  assert.match(implementation, /"idempotency-key": idempotencyKey/u);
  assert.match(implementation, /standingAutomation: true,[\s\S]*?idempotencyKey/u);
  const queuePackage = operatingSource.match(
    /const queueContentPackage = async \(reviewId: string\) => \{[\s\S]*?\n  \};\n  const prepareContentPackage/u,
  )?.[0] || "";
  assert.match(queuePackage, /generateMomoContentPackage\(\{[\s\S]*?restaurantId,[\s\S]*?assetId: asset\.id,[\s\S]*?idempotencyKey: `momo-content-\$\{reviewId\}`,[\s\S]*?\}\)/u);
  assert.doesNotMatch(implementation, /localStorage|recoveryResponseId/u);
  assert.doesNotMatch(operatingSource, /resumeExistingContentPreparation|requestOrResumeContentPackage/u);
});
