import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const publicFiles = [
  "artifacts/veroxa/src/components/public/PublicNav.tsx",
  "artifacts/veroxa/src/components/public/PublicFooter.tsx",
  "artifacts/veroxa/src/pages/landing.tsx",
  "artifacts/veroxa/src/pages/demo-hub.tsx",
  "artifacts/veroxa/src/pages/guided-demo.tsx",
  "artifacts/veroxa/src/pages/services.tsx",
  "artifacts/veroxa/src/pages/pricing.tsx",
  "artifacts/veroxa/src/components/PortalLayout.tsx",
  "artifacts/veroxa/src/components/auth/RealPortalDataBoundary.tsx",
];

const bannedLabels = [
  "Demo Preview",
  "Public Demo Preview",
  "Client Portal Preview",
  "Start Client Preview",
  "Experience Demo",
  "Portal Demo",
  "Guided Sales Demo",
  "Start Guided Demo",
];

const failures: string[] = [];

for (const file of publicFiles) {
  const text = readFileSync(join(root, file), "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const label of bannedLabels) {
      if (line.includes(label)) {
        failures.push(`${file}:${index + 1} banned public demo label "${label}": ${line.trim()}`);
      }
    }
  });
}

const landing = readFileSync(join(root, "artifacts/veroxa/src/pages/landing.tsx"), "utf8");
const auditCount = (landing.match(/Request Free Audit/g) ?? []).length;
const clientDemoCount = (landing.match(/Client Demo/g) ?? []).length;
if (auditCount !== 1 || clientDemoCount !== 1) {
  failures.push(
    `landing.tsx should keep one hero CTA area with one "Request Free Audit" and one "Client Demo" label; found Request Free Audit=${auditCount}, Client Demo=${clientDemoCount}.`,
  );
}
if (/View Services/.test(landing) && /Request Free Audit/.test(landing)) {
  failures.push("landing.tsx must not reintroduce a lower CTA that pairs Request Free Audit with View Services.");
}

const nav = readFileSync(join(root, "artifacts/veroxa/src/components/public/PublicNav.tsx"), "utf8");
for (const label of ["Services", "Pricing", "Login"]) {
  if (!new RegExp(`>\\s*${label}\\s*</Link>`).test(nav)) failures.push(`PublicNav is missing centered ${label} link.`);
}
for (const label of ["Veroxa", "Request Free Audit", "Client Demo"]) {
  if (new RegExp(`>\\s*${label}\\s*</Link>`).test(nav)) failures.push(`PublicNav should not show ${label}.`);
}

if (failures.length > 0) {
  console.error("Public cleanup guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Public cleanup guardrail passed.");
