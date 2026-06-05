import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const landing = read("artifacts/veroxa/src/pages/landing.tsx");
const services = read("artifacts/veroxa/src/pages/services.tsx");
const pricing = read("artifacts/veroxa/src/pages/pricing.tsx");
const nav = read("artifacts/veroxa/src/components/public/PublicNav.tsx");
for (const required of ["Complete Online Presence for Restaurants", "$495/month", "What Veroxa handles", "How it works", "Coming soon", "Add-ons", "Not included at launch", "Weekly updates", "Request Audit", "Login"]) if (!landing.includes(required)) failures.push(`Landing missing polished launch marker: ${required}`);
for (const required of ["Compatibility page", "Services are now bundled into one launch offer", "Google Business Profile", "Google Maps/local visibility", "website alignment", "Facebook and Instagram", "weekly updates", "Portal requests", "+$95", "+$45/profile"]) if (!services.includes(required)) failures.push(`Services compatibility missing marker: ${required}`);
for (const required of ["Compatibility page", "One public launch offer", "Complete Online Presence", "$495", "Included", "Coming soon / not included", "Add-ons", "Boundaries", "Back to Home", "Request Audit"]) if (!pricing.includes(required)) failures.push(`Pricing compatibility missing marker: ${required}`);
if (!nav.includes("Veroxa")) failures.push("Public nav missing centered Veroxa brand marker.");
for (const forbidden of ['href: "/free-audit"', 'href: "/login"', 'label: "Home"', 'label: "Audit"', 'label: "Login"', "nav-link-home", "nav-link-audit", "nav-link-login"]) if (nav.includes(forbidden)) failures.push(`Public nav must not render header marker: ${forbidden}`);
for (const forbidden of ["Client Demo", "/demo/client", 'label: "Services"', 'label: "Pricing"', "pricing-card-starter", "pricing-card-growth", "pricing-card-premium"]) if (`${landing}\n${services}\n${pricing}\n${nav}`.includes(forbidden)) failures.push(`Public surface contains retired demo/multi-plan marker: ${forbidden}`);
if (failures.length) { console.error("Public preview polish guardrail failed:\n" + failures.map(f => `- ${f}`).join("\n")); process.exit(1); }
console.log("Public preview polish guardrail passed.");
