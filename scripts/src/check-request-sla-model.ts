import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const exists = (p: string) => existsSync(join(root, p));
const assert = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg);
};
const dir = "artifacts/veroxa/src/domain/requestSla";
for (const f of [
  "types.ts",
  "slaClock.ts",
  "requestStatusEngine.ts",
  "responseDueEngine.ts",
  "escalationEngine.ts",
  "clientRequestMessages.ts",
  "teamSlaQueue.ts",
  "requestSlaSeedData.ts",
  "index.ts",
])
  assert(exists(`${dir}/${f}`), `Missing requestSla/${f}`);
const all = [
  read(`${dir}/responseDueEngine.ts`),
  read(`${dir}/clientRequestMessages.ts`),
  read("artifacts/veroxa/src/pages/client-requests.tsx"),
  read("artifacts/veroxa/src/pages/team-work-queue.tsx"),
].join("\n");
assert(
  /respond within 24 hours|within 24-hour|24-hour response|24 hours/.test(all),
  "SLA copy must include 24 hours.",
);
assert(
  /answer|review|response/.test(all),
  "SLA must be about answer/review/response.",
);
assert(
  !/promise(s)? (that )?(all )?work (is )?completed within 24 hours/i.test(all),
  "SLA must not promise all work completed within 24 hours.",
);
assert(
  read("artifacts/veroxa/src/pages/client-requests.tsx").includes(
    "Portal requests are the normal channel",
  ),
  "Portal must remain normal routine channel.",
);
if (failures.length) {
  console.error(
    "Request SLA guardrail failed:\n" +
      failures.map((f) => `- ${f}`).join("\n"),
  );
  process.exit(1);
}
console.log("Request SLA guardrail passed.");
