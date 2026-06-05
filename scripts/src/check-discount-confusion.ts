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
    else if ([".ts", ".tsx", ".md"].includes(extname(entry))) out.push(rel);
  }
  return out;
}
const files = ["AGENTS.md", ...collect("artifacts/veroxa/src"), ...collect("artifacts/veroxa/docs")];
const forbidden = [/20% off for everyone/i, /discount always available/i, /returning clients keep (?:the )?discount/i, /discount after cancellation/i, /reactivation keeps (?:the )?loyalty discount/i];
for (const file of files) {
  const text = readFileSync(join(root, file), "utf8");
  for (const pattern of forbidden) if (pattern.test(text)) failures.push(`${file} contains discount confusion: ${pattern}`);
}
const combined = files.map((file) => readFileSync(join(root, file), "utf8")).join("\n");
for (const marker of ["first-client loyalty", "20% off", "continuously active", "discount no longer applies"]) if (!combined.toLowerCase().includes(marker.toLowerCase())) failures.push(`Missing allowed first-client loyalty marker: ${marker}`);
if (failures.length) { console.error("Discount confusion guardrail failed:\n" + failures.map((f) => `- ${f}`).join("\n")); process.exit(1); }
console.log("Discount confusion guardrail passed.");
