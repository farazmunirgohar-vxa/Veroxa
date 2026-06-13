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

function requireIncludes(source: string, file: string, markers: string[]) {
  for (const marker of markers) {
    if (!source.includes(marker)) failures.push(`${file} missing Real Login V1 marker: ${marker}`);
  }
}

function forbidIncludes(source: string, file: string, markers: string[]) {
  for (const marker of markers) {
    if (source.includes(marker)) failures.push(`${file} contains retired preview-login marker: ${marker}`);
  }
}

const retiredPreviewLoginMarkers = [
  "VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN",
  "Preview access ready",
  "Preview access not enabled",
  "publicPreviewFallbackEnabled",
  "isPreviewFriendlyHostname",
  "temp-login-status-note",
  "placeholderCredentialStatus.statusLabel",
  "faraz@client.com",
  "faraz@team.com",
  "farazclient",
  "farazteam",
  "review sign-in",
  "not production client billing",
];

for (const file of walk("artifacts/veroxa/src")) {
  const relative = rel(file);
  const text = readFileSync(file, "utf8");
  for (const marker of retiredPreviewLoginMarkers) {
    if (text.includes(marker)) {
      failures.push(`${relative} contains retired preview-login marker: ${marker}`);
    }
  }
}

const devCredentialsPath = "artifacts/veroxa/src/lib/auth/devCredentials.ts";
const pilotAccountsPath = "artifacts/veroxa/src/lib/auth/pilotAccessAccounts.ts";
const loginPath = "artifacts/veroxa/src/pages/login.tsx";
const appPath = "artifacts/veroxa/src/App.tsx";

const devCredentials = readFileSync(join(root, devCredentialsPath), "utf8");
const pilotAccounts = readFileSync(join(root, pilotAccountsPath), "utf8");
const loginSource = readFileSync(join(root, loginPath), "utf8");
const appSource = readFileSync(join(root, appPath), "utf8");

requireIncludes(devCredentials, devCredentialsPath, [
  "Real Login V1 pilot portal access",
  "getPilotAccessAccounts",
  "validatePilotAccessCredentials",
  "getPilotRouteForRole",
]);
forbidIncludes(devCredentials, devCredentialsPath, retiredPreviewLoginMarkers);

requireIncludes(pilotAccounts, pilotAccountsPath, [
  "Momo House San Antonio",
  "Team Faraz",
  "VITE_VEROXA_PILOT_ACCESS_ENDPOINT",
  "server-controlled",
  "Pilot login endpoint unavailable",
  "getRoleHomePath(role)",
]);
forbidIncludes(pilotAccounts, pilotAccountsPath, retiredPreviewLoginMarkers);
if (/password:\s*["'][^"']+["']/.test(pilotAccounts) || /momohousepilot|teamfarazpilot/.test(pilotAccounts)) {
  failures.push("pilotAccessAccounts.ts must not define bundled plaintext pilot passwords.");
}

requireIncludes(loginSource, loginPath, [
  "Sign in to Veroxa",
  "Access your Veroxa portal.",
  "validatePilotAccessCredentials",
  "createPlaceholderSession",
  "setLocation(getPilotRouteForRole(account.role))",
  "Portal access is not configured",
]);
forbidIncludes(loginSource, loginPath, retiredPreviewLoginMarkers.concat(["demo access", "preview access"]));
if (/momohousepilot|teamfarazpilot/.test(loginSource)) {
  failures.push("login.tsx must not expose pilot passwords in production-facing copy/source literals.");
}

requireIncludes(appSource, appPath, [
  'path="/client/dashboard"',
  'path="/team/dashboard"',
  "<ClientPortalGuard>",
  '<InternalDemoGuard role="team">',
]);
for (const retiredRoute of ['path="/demo"', 'path="/guided-demo"', 'path="/upload"', 'path="/demo/client/dashboard"']) {
  if (appSource.includes(retiredRoute)) failures.push(`Retired demo/upload route is active in App.tsx: ${retiredRoute}`);
}
for (const forbiddenPortal of ["/owner", "/operator", "/admin", "/super-admin", "/execution"]) {
  if (appSource.includes(`path="${forbiddenPortal}`)) failures.push(`Forbidden portal route is active in App.tsx: ${forbiddenPortal}`);
}

const authContractSource = readFileSync(join(root, "artifacts/veroxa/src/lib/auth/authContract.ts"), "utf8");
if (!/export type VeroxaRole = ["']client["'] \| ["']team["']/.test(authContractSource)) {
  failures.push("Auth contract must keep only client and team roles active.");
}
if (!authContractSource.includes('client:   "/client/dashboard"') || !authContractSource.includes('team:     "/team/dashboard"')) {
  failures.push("Auth contract must route client/team roles to /client/dashboard and /team/dashboard.");
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
  if (/VITE_VEROXA_(DEV_)?(CLIENT|TEAM)_(EMAIL|PASSWORD)|VITE_VEROXA_PILOT_ACCESS_ENDPOINT/.test(text) && !/pilot|manual|local-only|do not set|never set|must not be set|server-controlled/i.test(text)) {
    failures.push(`${file} mentions portal access without a clear pilot/manual/server-controlled warning.`);
  }
}

const envLikeFiles = ["artifacts/veroxa/.env.example"].filter((file) => {
  try { statSync(join(root, file)); return true; } catch { return false; }
});
for (const file of envLikeFiles) {
  const text = readFileSync(join(root, file), "utf8");
  const activePortalCredential = text
    .split(/\r?\n/)
    .some((line) => /^\s*VITE_VEROXA_(DEV_)?(CLIENT|TEAM)_(EMAIL|PASSWORD)\s*=/.test(line));
  if (activePortalCredential) {
    failures.push(`${file} must not set pilot/manual portal credentials.`);
  }
}

if (failures.length > 0) {
  console.error("Dev auth/write safety guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Dev auth/write safety guardrail passed: Real Login V1 pilot access is constrained to Client/Team and dev writes are production-disabled.");
