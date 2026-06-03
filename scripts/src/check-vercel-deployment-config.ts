import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd(), "..");
const vercelPath = join(root, "vercel.json");
const failures: string[] = [];

if (!existsSync(vercelPath)) {
  failures.push("Missing root-level vercel.json for Veroxa Vite deployment.");
} else {
  const raw = readFileSync(vercelPath, "utf8");
  if (/experimentalServices/.test(raw)) {
    failures.push("vercel.json must not declare experimentalServices; Veroxa is not a Vercel Services app.");
  }
  if (/"framework"\s*:\s*"services"/.test(raw)) {
    failures.push('vercel.json must not set "framework": "services"; use Vite or Other in the Vercel dashboard.');
  }

  const config = JSON.parse(raw) as {
    framework?: string;
    installCommand?: string;
    buildCommand?: string;
    outputDirectory?: string;
    rewrites?: Array<{ source?: string; destination?: string }>;
  };

  if (config.framework !== "vite") {
    failures.push('vercel.json framework must be "vite".');
  }
  if (config.installCommand !== "pnpm install --frozen-lockfile") {
    failures.push("vercel.json installCommand must be pnpm install --frozen-lockfile.");
  }
  if (config.buildCommand !== "pnpm --filter @workspace/veroxa run build") {
    failures.push("vercel.json buildCommand must build the @workspace/veroxa Vite app.");
  }
  if (config.outputDirectory !== "artifacts/veroxa/dist/public") {
    failures.push("vercel.json outputDirectory must be artifacts/veroxa/dist/public.");
  }
  const hasSpaRewrite = config.rewrites?.some(
    (rewrite) => rewrite.source === "/(.*)" && rewrite.destination === "/index.html",
  );
  if (!hasSpaRewrite) {
    failures.push("vercel.json must include the SPA rewrite to /index.html.");
  }
}

const indexHtml = readFileSync(join(root, "artifacts/veroxa/index.html"), "utf8");
for (const required of [
  "Veroxa Systems — Online Presence for Restaurants",
  "helps restaurants become easier to find, easier to trust, and easier to choose",
  "og:title",
  "og:description",
  "twitter:card",
]) {
  if (!indexHtml.includes(required)) {
    failures.push(`index.html is missing polished public metadata marker: ${required}`);
  }
}
for (const forbidden of [/built on Replit/i, /Update this description/i]) {
  if (forbidden.test(indexHtml)) {
    failures.push(`index.html contains placeholder metadata: ${forbidden}`);
  }
}

if (failures.length > 0) {
  console.error("Vercel deployment config guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Vercel deployment config guardrail passed: Veroxa is configured as a Vite frontend, not a Services app.");
