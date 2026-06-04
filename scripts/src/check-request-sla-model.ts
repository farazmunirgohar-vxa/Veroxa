import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const exists = (p: string) => existsSync(join(root, p));
const dir = "artifacts/veroxa/src/domain/requestSla";
for (const f of ["types.ts", "slaClock.ts", "requestStatusEngine.ts", "responseDueEngine.ts", "escalationEngine.ts", "clientRequestMessages.ts", "teamSlaQueue.ts", "requestSlaSeedData.ts", "index.ts"]) if (!exists(`${dir}/${f}`)) failures.push(`Missing requestSla/${f}`);
const all = [read(`${dir}/clientRequestMessages.ts`), read(`${dir}/responseDueEngine.ts`), read("artifacts/veroxa/src/pages/client-requests.tsx"), read("artifacts/veroxa/docs/PORTAL_REQUEST_SLA_24_HOUR_MODEL.md")].join("\n");
for (const required of ["24 hours", "answer", "review", "Portal requests are the normal channel", "not a promise", "coming-soon"]) if (!all.includes(required)) failures.push(`SLA missing marker ${required}`);
if (/completed within 24 hours/i.test(all) && !/not a promise that.*completed within 24 hours/i.test(all)) failures.push("SLA appears to promise completion within 24 hours.");
if (failures.length) { console.error("Request SLA guardrail failed:\n" + failures.map(f => `- ${f}`).join("\n")); process.exit(1); }
console.log("Request SLA guardrail passed.");
