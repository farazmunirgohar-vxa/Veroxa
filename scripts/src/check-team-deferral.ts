import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
function collect(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join(root, dir))) {
    const rel = `${dir}/${entry}`;
    const st = statSync(join(root, rel));
    if (st.isDirectory()) out.push(...collect(rel));
    else if ([".ts", ".tsx"].includes(extname(entry))) out.push(rel);
  }
  return out;
}
const app = readFileSync(join(root, "artifacts/veroxa/src/App.tsx"), "utf8");
for (const forbidden of ["/owner", "/operator", "/super-admin", "/admin/dashboard", "/execution"]) if (app.includes(forbidden)) failures.push(`App route suggests deferred dashboard: ${forbidden}`);
const code = collect("artifacts/veroxa/src").map((file) => `${file}\n${readFileSync(join(root, file), "utf8")}`).join("\n");
for (const pattern of [/Owner Dashboard/i, /Operator Dashboard/i, /Super Admin/i, /Execution Dashboard/i, /generic Admin Dashboard/i]) if (pattern.test(code)) failures.push(`Code contains deferred Team role language: ${pattern}`);
const docs = ["AGENTS.md", "artifacts/veroxa/docs/VEROXA_90_PERCENT_PREPAID_OS_READINESS_MAP.md", "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md"].map((file) => readFileSync(join(root, file), "utf8")).join("\n");
for (const marker of ["Team complexity", "deferred", "supporting/action-focused", "Owner/Operator/Super Admin/generic Admin/Execution dashboards"]) if (!docs.includes(marker)) failures.push(`Team deferral docs missing ${marker}`);
if (failures.length) { console.error("Team deferral guardrail failed:\n" + failures.map((f) => `- ${f}`).join("\n")); process.exit(1); }
console.log("Team deferral guardrail passed.");
