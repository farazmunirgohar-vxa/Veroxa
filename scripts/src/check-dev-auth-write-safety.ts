import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures: string[] = [];
const sourceExtensions = new Set([".ts", ".tsx"]);

function walk(relativePath: string): string[] {
  const full = join(root, relativePath);
  const stat = statSync(full);
  if (stat.isFile()) return [full];
  const out: string[] = [];
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    const child = join(full, entry.name);
    if (child.includes("/node_modules/") || child.includes("/dist/")) continue;
    if (entry.isDirectory()) out.push(...walk(child.slice(root.length + 1)));
    else if (sourceExtensions.has(extname(entry.name))) out.push(child);
  }
  return out;
}

function rel(fullPath: string): string {
  return fullPath.startsWith(root) ? fullPath.slice(root.length + 1) : fullPath;
}

for (const file of walk("artifacts/veroxa/src")) {
  const relative = rel(file);
  const text = readFileSync(file, "utf8");
  const allowedPreviewCredentialFile =
    relative === "artifacts/veroxa/src/lib/auth/devCredentials.ts";
  if (/farazclient|farazteam/.test(text) && !allowedPreviewCredentialFile) {
    failures.push(`${relative} contains a plaintext placeholder password outside the approved preview-only credential matcher.`);
  }
}

const devCredentials = readFileSync(join(root, "artifacts/veroxa/src/lib/auth/devCredentials.ts"), "utf8");
for (const token of [
  "VITE_VEROXA_DEV_CLIENT_EMAIL",
  "VITE_VEROXA_DEV_CLIENT_PASSWORD",
  "VITE_VEROXA_DEV_TEAM_EMAIL",
  "VITE_VEROXA_DEV_TEAM_PASSWORD",
]) {
  if (!devCredentials.includes(token)) failures.push(`devCredentials.ts must read ${token}.`);
}
for (const requiredPreviewCredential of [
  "client@veroxa.com",
  "team@veroxa.com",
  "farazclient",
  "farazteam",
]) {
  if (!devCredentials.includes(requiredPreviewCredential)) {
    failures.push(`devCredentials.ts is missing approved placeholder preview credential: ${requiredPreviewCredential}`);
  }
}
if (/password:\s*["'](?!farazclient|farazteam|veroxa-preview-client|veroxa-preview-team)[^"']+["']/.test(devCredentials)) {
  failures.push("devCredentials.ts defines an unapproved source plaintext password.");
}
for (const marker of [
  "VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN",
  "getPlaceholderCredentialStatus",
  "Preview login configured",
  "Preview login not configured",
  "publicPreviewFallbackEnabled",
]) {
  if (!devCredentials.includes(marker)) {
    failures.push(`devCredentials.ts is missing temp-login safety marker: ${marker}`);
  }
}
if (!/const explicitFlag = readViteEnv\(PUBLIC_PREVIEW_LOGIN_FLAG\)/.test(devCredentials) || !/import\.meta\.env\.DEV \|\| explicitFlag !== ["']false["']/.test(devCredentials)) {
  failures.push("public preview fallback login must stay placeholder-only and allow preview review unless VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN=false.");
}
const loginSource = readFileSync(join(root, "artifacts/veroxa/src/pages/login.tsx"), "utf8");
for (const marker of [
  "getPlaceholderCredentialStatus",
  "temp-login-status-note",
  "placeholderCredentialStatus.statusLabel",
  "createPlaceholderSession",
]) {
  if (!loginSource.includes(marker)) {
    failures.push(`login.tsx is missing placeholder temp-login marker: ${marker}`);
  }
}
const authModeSource = readFileSync(join(root, "artifacts/veroxa/src/lib/auth/authMode.ts"), "utf8");
if (!/export\s+const\s+AUTH_MODE(?:\s*:\s*AuthMode)?\s*=\s*["']placeholder["']/.test(authModeSource)) {
  failures.push("AUTH_MODE must remain placeholder until production auth is explicitly approved.");
}

const writeReadiness = readFileSync(join(root, "artifacts/veroxa/src/lib/data/writeReadiness.ts"), "utf8");
if (!writeReadiness.includes("VITE_VEROXA_DEV_WRITE_ENV")) {
  failures.push("writeReadiness.ts must require the second dev write safety flag.");
}
if (!/!import\.meta\.env\.PROD/.test(writeReadiness)) {
  failures.push("writeReadiness.ts must force dev writes off in production builds.");
}
if (!/raw === ["']true["'] && safetyEnv === ["']dev["'] && !import\.meta\.env\.PROD/.test(writeReadiness)) {
  failures.push("dev writes must require exact true flag, safety env dev, and non-production mode.");
}

const productionLikeDocs = [
  "artifacts/veroxa/docs/DEPLOYMENT.md",
  "artifacts/veroxa/docs/PRODUCTION.md",
  "artifacts/veroxa/docs/ENVIRONMENT.md",
  "artifacts/veroxa/docs/PRODUCTION_LAUNCH_RUNBOOK.md",
  "artifacts/veroxa/docs/DEV_AUTH_AND_WRITE_SAFETY.md",
].filter((file) => {
  try { statSync(join(root, file)); return true; } catch { return false; }
});
for (const file of productionLikeDocs) {
  const text = readFileSync(join(root, file), "utf8");
  if (/VITE_VEROXA_ENABLE_DEV_WRITES\s*=\s*["']?true["']?/i.test(text) && !/dev-only|local-only|non-production|never production/i.test(text)) {
    failures.push(`${file} implies dev writes can be true without a clear non-production warning.`);
  }
  if (/VITE_VEROXA_DEV_(CLIENT|TEAM)_(EMAIL|PASSWORD)/.test(text) && !/preview-only|local-only|do not set|never set|must not be set/i.test(text)) {
    failures.push(`${file} mentions placeholder credentials without a clear preview-only / do-not-set-in-production warning.`);
  }
}

const envLikeFiles = ["artifacts/veroxa/.env.example"].filter((file) => {
  try { statSync(join(root, file)); return true; } catch { return false; }
});
for (const file of envLikeFiles) {
  const text = readFileSync(join(root, file), "utf8");
  const activePlaceholderCredential = text
    .split(/\r?\n/)
    .some((line) => /^\s*VITE_VEROXA_DEV_(CLIENT|TEAM)_(EMAIL|PASSWORD)\s*=/.test(line));
  if (activePlaceholderCredential) {
    failures.push(`${file} must not set preview-only VITE_VEROXA_DEV_* placeholder credentials.`);
  }
}

if (failures.length > 0) {
  console.error("Dev auth/write safety guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Dev auth/write safety guardrail passed: placeholder preview credentials stay contained and dev writes are production-disabled.");
