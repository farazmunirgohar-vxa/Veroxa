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
const clientRequestsPage = read("artifacts/veroxa/src/pages/client-requests.tsx");
const seedSource = read(`${dir}/requestSlaSeedData.ts`);
const authModeSource = read("artifacts/veroxa/src/lib/auth/authMode.ts");
const all = [
  read(`${dir}/responseDueEngine.ts`),
  read(`${dir}/clientRequestMessages.ts`),
  clientRequestsPage,
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
  clientRequestsPage.includes("Portal requests are the normal channel"),
  "Portal must remain normal routine channel.",
);
assert(
  clientRequestsPage.includes("useRealPortalDataMode") &&
    clientRequestsPage.includes("mode.isPublicDemoRoute"),
  "Client requests page must read real portal data mode and gate demo seed data by public demo route.",
);
assert(
  /canUseSeedRequests\s*=\s*mode\.isPublicDemoRoute/.test(clientRequestsPage) &&
    /const requestRows = canUseSeedRequests\s*\?[\s\S]*getRequestSlaSeedData\(\)\.map/.test(clientRequestsPage),
  "Client request seed rows must only be derived behind the demo/public preview route gate.",
);
assert(
  !/requestSlaSeedData\.map/.test(clientRequestsPage),
  "Client requests page must not unconditionally map requestSlaSeedData.",
);
assert(
  /showSafeEmptyState\s*=\s*!pageState\.isDemoData\s*&&\s*!pageState\.canShowRealData/.test(clientRequestsPage) &&
    clientRequestsPage.includes("SafePortalEmptyCard") &&
    clientRequestsPage.includes('getClientSafeEmptyStateForPage("requests", pageState)'),
  "Real client requests route must keep the safe setup/empty state when real data cannot be shown.",
);
assert(
  !/requestSummary\.total\s*\|\|\s*requestRows\.length/.test(clientRequestsPage),
  "Real client request metrics must not fall back to seed request counts.",
);
assert(
  /export function getRequestSlaSeedData\(now = new Date\(\)\)/.test(seedSource) &&
    seedSource.includes("baseTime = now.getTime()") &&
    seedSource.includes("dueAt: addHours(submittedAt)"),
  "SLA seed data must be generated relative to a runtime preview clock.",
);
assert(
  !/2026-06-04T12:00:00\.000Z/.test(seedSource) &&
    !/const\s+base\s*=\s*["']20\d{2}-\d{2}-\d{2}T/.test(seedSource),
  "SLA seed data must not use a fixed aging ISO timestamp.",
);
assert(
  /export const AUTH_MODE: AuthMode = "placeholder"/.test(authModeSource),
  "AUTH_MODE must remain placeholder.",
);
if (failures.length) {
  console.error(
    "Request SLA guardrail failed:\n" +
      failures.map((f) => `- ${f}`).join("\n"),
  );
  process.exit(1);
}
console.log("Request SLA guardrail passed.");
