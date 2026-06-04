import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const nav = read("artifacts/veroxa/src/components/public/PublicNav.tsx");
for (const required of ['label: "Home"', 'label: "Audit"', 'label: "Login"']) if (!nav.includes(required)) failures.push(`PublicNav missing ${required}`);
for (const forbidden of ["Services", "Pricing", "Client Demo", "Free Audit", "demo/client", "guided-demo"]) if (nav.includes(forbidden)) failures.push(`PublicNav promotes forbidden public link/copy: ${forbidden}`);
const landing = read("artifacts/veroxa/src/pages/landing.tsx");
for (const required of ["Complete Online Presence for Restaurants", "$495", "Google", "Maps", "Yelp", "website alignment", "Facebook", "Instagram", "TikTok", "Reels/video", "Ads management", "Request Audit", "Login"]) if (!landing.includes(required)) failures.push(`Landing missing launch marker: ${required}`);
for (const forbidden of ["Client Demo", "/demo/client", "Request Free Audit", "Most popular", "Starter", "Premium —", "$295", "$995"]) if (landing.includes(forbidden)) failures.push(`Landing contains forbidden public copy: ${forbidden}`);
for (const file of ["artifacts/veroxa/src/pages/pricing.tsx", "artifacts/veroxa/src/pages/services.tsx"]) {
  const text = read(file);
  if (!text.includes("Compatibility page")) failures.push(`${file} must be a hidden compatibility page.`);
  for (const forbidden of ["Starter", "Growth", "Premium", "$295", "$995", "Client Demo", "/demo/client"]) if (text.includes(forbidden)) failures.push(`${file} contains retired public funnel marker: ${forbidden}`);
}
const freeAudit = read("artifacts/veroxa/src/pages/free-audit.tsx");
for (const required of ["Restaurant Online Presence Audit", "Complete Online Presence", "$495", "Live third-party lookup is not part of this preview yet", "recommendations are not guarantees"]) if (!freeAudit.includes(required)) failures.push(`free-audit.tsx missing audit launch marker: ${required}`);
if (failures.length) { console.error("Public cleanup guardrail failed:\n" + failures.map(f => `- ${f}`).join("\n")); process.exit(1); }
console.log("Public cleanup guardrail passed.");
