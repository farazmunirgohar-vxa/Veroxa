import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const exists = (p: string) => existsSync(join(root, p));
const assert = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg);
};
const dir = "artifacts/veroxa/src/domain/valueProof";
for (const f of [
  "types.ts",
  "proofSignalCatalog.ts",
  "restaurantReachEngine.ts",
  "onlineInfluencedActionEngine.ts",
  "attributionConfidence.ts",
  "valueStatusEngine.ts",
  "internalCostJustification.ts",
  "clientSafeValueSummary.ts",
  "teamValueProofQueue.ts",
  "valueProofSeedData.ts",
  "index.ts",
])
  assert(exists(`${dir}/${f}`), `Missing valueProof/${f}`);
assert(
  read(`${dir}/proofSignalCatalog.ts`).includes("customerActionSignalTypes") &&
    read(`${dir}/restaurantReachEngine.ts`).includes("Reach"),
  "Value proof must distinguish reach from customer actions.",
);
const clientFiles = [
  "artifacts/veroxa/src/pages/client-reports.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/pricing.tsx",
  "artifacts/veroxa/src/pages/services.tsx",
];
for (const f of clientFiles) {
  const t = read(f);
  for (const rx of [
    /requiredDailyOrders/i,
    /net margin/i,
    /profit math/i,
    /break-even formula/i,
  ])
    assert(!rx.test(t), `${f} exposes internal profit math marker ${rx}`);
}
assert(
  read("artifacts/veroxa/src/pages/team-dashboard.tsx").includes(
    "Value proof",
  ) ||
    read("artifacts/veroxa/src/pages/team-dashboard.tsx").includes(
      "value proof",
    ),
  "Team dashboard must show value proof/reach summary.",
);
if (failures.length) {
  console.error(
    "Value proof guardrail failed:\n" +
      failures.map((f) => `- ${f}`).join("\n"),
  );
  process.exit(1);
}
console.log("Value proof guardrail passed.");
