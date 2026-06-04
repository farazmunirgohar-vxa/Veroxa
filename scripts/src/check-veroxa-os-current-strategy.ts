import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const combined = ["AGENTS.md", "artifacts/veroxa/docs/VEROXA_OS_CURRENT_MASTER.md", "artifacts/veroxa/docs/CURRENT_REAL_VEROXA_MODEL.md"].map(p => readFileSync(join(root, p), "utf8")).join("\n");
for (const required of ["GitHub + Codex + Vercel", "Codex is the primary", "Vercel is the deployment target", "Client and Team", "Owner/Operator", "Complete Online Presence", "$495/month", "Home -> Audit -> Login", "AUTH_MODE", "placeholder", "90% complete"]) if (!combined.includes(required)) failures.push(`Current strategy missing ${required}`);
if (failures.length) { console.error("Veroxa OS current strategy failed:\n" + failures.map(f => `- ${f}`).join("\n")); process.exit(1); }
console.log("Veroxa OS current strategy passed.");
