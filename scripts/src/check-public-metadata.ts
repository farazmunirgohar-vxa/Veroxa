import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "..");
const publicFiles = [
  "artifacts/veroxa/src/pages/landing.tsx",
  "artifacts/veroxa/src/pages/services.tsx",
  "artifacts/veroxa/src/pages/pricing.tsx",
  "artifacts/veroxa/src/pages/free-audit.tsx",
  "artifacts/veroxa/src/pages/demo-hub.tsx",
  "artifacts/veroxa/src/pages/login.tsx",
];

const banned = [
  /Demo Preview/i,
  /Guided Sales Demo/i,
  /Client Portal Preview/i,
  /OpenAI/i,
];

const failures: string[] = [];
for (const rel of publicFiles) {
  const text = readFileSync(join(root, rel), "utf8");
  if (!text.includes("useDocumentMeta"))
    failures.push(`${rel} must call useDocumentMeta.`);
  const metaBlocks = text.match(/useDocumentMeta\(\{[\s\S]*?\}\);/g) ?? [];
  const metadataText = metaBlocks.join("\n");
  for (const pattern of banned) {
    if (pattern.test(metadataText))
      failures.push(`${rel} contains public metadata drift term: ${pattern}`);
  }
}

const hook = readFileSync(
  join(root, "artifacts/veroxa/src/hooks/useDocumentMeta.ts"),
  "utf8",
);
for (const required of [
  "og:title",
  "og:description",
  "twitter:card",
  "twitter:title",
  "twitter:description",
]) {
  if (!hook.includes(required))
    failures.push(`useDocumentMeta must manage ${required}.`);
}

if (failures.length > 0) {
  console.error(
    "Public metadata guardrail failed:\n" +
      failures.map((f) => `- ${f}`).join("\n"),
  );
  process.exit(1);
}

console.log(
  "Public metadata guardrail passed: public metadata stays client-safe and social-preview ready.",
);
