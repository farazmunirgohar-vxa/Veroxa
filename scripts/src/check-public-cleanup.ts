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
  "artifacts/veroxa/src/pages/free-audit.tsx",
  "artifacts/veroxa/src/components/PortalLayout.tsx",
  "artifacts/veroxa/src/components/auth/RealPortalDataBoundary.tsx",
  "artifacts/veroxa/src/hooks/useDocumentMeta.ts",
];

const bannedLabels = [
  "Public Demo Preview",
  "Client Portal Preview",
  "Start Client Preview",
  "Experience Demo",
  "Portal Demo",
  "Guided Sales Demo",
  "Start Guided Demo",
];

const failures: string[] = [];
const metadataSource = readFileSync(join(root, "artifacts/veroxa/src/hooks/useDocumentMeta.ts"), "utf8");
for (const term of ["Demo Preview", "Guided Demo", "Client Portal Preview", "backend", "Supabase", "OpenAI", "API"]) {
  if (metadataSource.includes(term)) failures.push(`useDocumentMeta.ts must not seed public metadata with ${term}.`);
}
for (const required of ["og:title", "og:description", "twitter:card", "twitter:title", "twitter:description"]) {
  if (!metadataSource.includes(required)) failures.push(`useDocumentMeta.ts missing social metadata field ${required}.`);
}

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

const freeAudit = readFileSync(join(root, "artifacts/veroxa/src/pages/free-audit.tsx"), "utf8");
for (const required of [
  "review-mode audit preview",
  "Live Google/API scanning is not connected here yet",
  "recommendations are not guarantees",
  "Premium ads readiness assessment",
]) {
  if (!freeAudit.includes(required)) {
    failures.push(`free-audit.tsx is missing Phase 2 safety wording: ${required}`);
  }
}
for (const risky of [
  /AI-assisted summary/i,
  /Generate AI/i,
  /searches Google directly/i,
  /Live Google lookup found/i,
  /Loading live profile/i,
]) {
  if (risky.test(freeAudit)) {
    failures.push(`free-audit.tsx contains public live/AI claim blocked in pre-live mode: ${risky}`);
  }
}

for (const file of publicFiles) {
  const text = readFileSync(join(root, file), "utf8");
  if (/href=[{]?['"]\/team\//.test(text)) {
    failures.push(`${file} must not link public visitors directly into guarded /team/* routes.`);
  }
  if (/href=[{]?['"]\/client\//.test(text)) {
    failures.push(`${file} must not link public visitors directly into guarded /client/* routes.`);
  }
}

const nav = readFileSync(join(root, "artifacts/veroxa/src/components/public/PublicNav.tsx"), "utf8");
for (const label of ["Services", "Pricing", "Login"]) {
  if (!nav.includes(`label: "${label}"`) && !new RegExp(`>\\s*${label}\\s*</Link>`).test(nav)) failures.push(`PublicNav is missing centered ${label} link.`);
}
for (const label of ["Free Audit", "Client Demo", "Veroxa", "Request Free Audit"]) {
  if (nav.includes(`label: "${label}"`) || new RegExp(`>\\s*${label}\\s*</Link>`).test(nav)) failures.push(`PublicNav should not show ${label}.`);
}

const devCredentials = readFileSync(join(root, "artifacts/veroxa/src/lib/auth/devCredentials.ts"), "utf8");
const loginPage = readFileSync(join(root, "artifacts/veroxa/src/pages/login.tsx"), "utf8");
const previewCredentialSources = `${devCredentials}\n${loginPage}`;
for (const required of ["client@veroxa.com", "team@veroxa.com", "farazclient", "farazteam"]) {
  if (!previewCredentialSources.includes(required)) failures.push(`Preview login is missing required placeholder credential marker: ${required}.`);
}
if (!devCredentials.includes("Preview access is enabled for review. Use client@veroxa.com / farazclient or team@veroxa.com / farazteam.")) {
  failures.push("Preview login helper copy must stay clean and non-technical when preview access is enabled.");
}
for (const forbidden of ["veroxa-client", "veroxa-team"]) {
  if (loginPage.includes(forbidden) || devCredentials.includes(`Use ${forbidden}`)) failures.push(`Visible preview helper passwords must not include ${forbidden}.`);
}

const servicesPage = readFileSync(join(root, "artifacts/veroxa/src/pages/services.tsx"), "utf8");
for (const forbidden of [
  "Ready to see where your restaurant stands?",
  "btn-services-cta-audit",
  "btn-services-cta-pricing",
  "$295",
  "$495",
  "$995",
  "/month",
  "/mo",
]) {
  if (servicesPage.includes(forbidden)) failures.push(`services.tsx must not contain removed CTA/pricing text: ${forbidden}.`);
}

const pricingPage = readFileSync(join(root, "artifacts/veroxa/src/pages/pricing.tsx"), "utf8");
for (const forbidden of ["Want details before comparing plans?", "btn-pricing-cta-services", "btn-pricing-cta-audit"]) {
  if (pricingPage.includes(forbidden)) failures.push(`pricing.tsx must not contain removed bottom CTA text/marker: ${forbidden}.`);
}

const pricingSource = readFileSync(join(root, "artifacts/veroxa/src/data/pricing/veroxaPricing.ts"), "utf8");
const pricingCombined = `${pricingPage}\n${pricingSource}`;
for (const required of [
  "Facebook support",
  "Instagram support",
  "Up to 3 posts/week depending on usable client-provided media",
  "Reels support",
  "TikTok support",
  "Better support / stronger communication",
  "Ad management",
  "Up to 1 post/day depending on usable client-provided media",
  "$295",
  "$495",
  "$995",
]) {
  if (!pricingCombined.includes(required)) failures.push(`Pricing/package copy is missing required marker: ${required}.`);
}
const growthBlocks = [
  pricingPage.match(/name: "Growth"[\s\S]*?\n  \},\n  \{/m)?.[0] ?? "",
  pricingSource.match(/const growthIncludes = \[[\s\S]*?\];/m)?.[0] ?? "",
];
for (const block of growthBlocks) {
  if (!block) failures.push("Could not locate Growth package block for posting-limit guardrail.");
  if (/up to 1 post\/day/i.test(block)) failures.push("Growth package block must not contain up to 1 post/day.");
  if (/up to 3 posts\/week/i.test(block)) failures.push("Growth package block must not contain up to 3 posts/week.");
}

const authMode = readFileSync(join(root, "artifacts/veroxa/src/lib/auth/authMode.ts"), "utf8");
if (!authMode.includes('"placeholder"')) failures.push("AUTH_MODE must remain placeholder.");

for (const [file, text] of [
  ["PublicNav.tsx", nav],
  ["services.tsx", servicesPage],
  ["pricing.tsx", pricingPage],
  ["devCredentials.ts", devCredentials],
] as const) {
  for (const risky of [/createUser/i, /signUp/i, /storage\.from/i, /openai/i, /stripe/i, /googleapis/i, /youtube/i, /cron/i, /webhook/i]) {
    if (risky.test(text)) failures.push(`${file} contains risky live integration/auth marker: ${risky}.`);
  }
}

if (failures.length > 0) {
  console.error("Public cleanup guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Public cleanup guardrail passed.");
