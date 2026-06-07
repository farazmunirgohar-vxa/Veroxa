import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const nav = read("artifacts/veroxa/src/components/public/PublicNav.tsx");
if (!nav.includes("Veroxa")) failures.push("PublicNav must render Veroxa.");
for (const forbidden of ['label: "Home"', 'label: "Audit"', 'label: "Login"', 'nav-link-home', 'nav-link-audit', 'nav-link-login', '>Home<', '>Audit<', '>Login<', "Services", "Pricing", "Client Demo", "Free Audit", "demo/client", "guided-demo"]) if (nav.includes(forbidden)) failures.push(`PublicNav must not render public header link/copy: ${forbidden}`);
const landing = read("artifacts/veroxa/src/pages/landing.tsx");
for (const required of ["Complete Online Presence for Restaurants", "$495", "Google", "Maps", "Yelp", "coming soon", "website alignment", "Facebook", "Instagram", "Weekly updates", "Monthly online presence report", "What you get every month", "Portal request review within 24 hours", "+$95", "+$45/profile", "TikTok", "Reels/video", "Ads management", "Request Audit", "Login"]) if (!landing.includes(required)) failures.push(`Landing missing launch marker: ${required}`);
for (const forbidden of ["Client Demo", "/demo/client", "Request Free Audit", "Most popular", "Premium —", "$295", "$995"]) if (landing.includes(forbidden)) failures.push(`Landing contains forbidden public copy: ${forbidden}`);
if (/What Veroxa handles[\s\S]*Yelp profile alignment/.test(landing)) failures.push("Landing must not show Yelp as included.");
for (const file of ["artifacts/veroxa/src/pages/pricing.tsx", "artifacts/veroxa/src/pages/services.tsx"]) {
  const text = read(file);
  if (!text.includes("Compatibility page")) failures.push(`${file} must be a hidden compatibility page.`);
  for (const forbidden of ["$295", "$995", "Client Demo", "/demo/client"]) if (text.includes(forbidden)) failures.push(`${file} contains retired public funnel marker: ${forbidden}`);
}

const publicDemoPromotionFiles = [
  "artifacts/veroxa/src/pages/landing.tsx",
  "artifacts/veroxa/src/pages/free-audit.tsx",
  "artifacts/veroxa/src/pages/login.tsx",
  "artifacts/veroxa/src/components/public/PublicNav.tsx",
  "artifacts/veroxa/src/components/public/PublicFooter.tsx",
  "artifacts/veroxa/src/pages/services.tsx",
  "artifacts/veroxa/src/pages/pricing.tsx",
];
for (const file of publicDemoPromotionFiles) {
  const text = read(file);
  for (const pattern of [/href=[{]?"\/demo(?:\/client)?/i, /href=[{]?"\/guided-demo/i, /href=[{]?"\/upload/i]) {
    if (pattern.test(text)) failures.push(`${file} must not visibly link/CTA to demo, guided-demo, demo client, or upload routes: ${pattern}`);
  }
}

const freeAudit = read("artifacts/veroxa/src/pages/free-audit.tsx");
for (const required of ["Restaurant Online Presence Audit", "Complete Online Presence", "$495", "Yelp is a coming-soon/future review area", "This preliminary assessment uses the information you provide", "recommendations are not guarantees"]) if (!freeAudit.includes(required)) failures.push(`free-audit.tsx missing audit launch marker: ${required}`);
if (failures.length) { console.error("Public cleanup guardrail failed:\n" + failures.map(f => `- ${f}`).join("\n")); process.exit(1); }
console.log("Public cleanup guardrail passed.");
