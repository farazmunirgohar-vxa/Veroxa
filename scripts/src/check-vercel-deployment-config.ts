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
    installCommand?: string;
    buildCommand?: string;
    outputDirectory?: string;
    rewrites?: Array<{ source?: string; destination?: string }>;
  };

  if (config.installCommand !== "pnpm install --frozen-lockfile") {
    failures.push("vercel.json installCommand must be pnpm install --frozen-lockfile.");
  }
  if (config.buildCommand !== "pnpm --filter @workspace/veroxa run build") {
    failures.push("vercel.json buildCommand must build the @workspace/veroxa Vite app.");
  }
  if (config.outputDirectory !== "artifacts/veroxa/dist") {
    failures.push("vercel.json outputDirectory must be artifacts/veroxa/dist.");
  }
  const hasSpaRewrite = config.rewrites?.some(
    (rewrite) => rewrite.source === "/(.*)" && rewrite.destination === "/index.html",
  );
  if (!hasSpaRewrite) {
    failures.push("vercel.json must include the SPA rewrite to /index.html.");
  }
}

if (failures.length > 0) {
  console.error("Vercel deployment config guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Vercel deployment config guardrail passed: Veroxa is configured as a Vite frontend, not a Services app.");
