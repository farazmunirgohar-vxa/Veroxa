import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

const app = read("artifacts/api-server/src/app.ts");
const routesIndex = read("artifacts/api-server/src/routes/index.ts");
const apiSecurity = read("artifacts/api-server/src/middlewares/apiSecurity.ts");
const pilotAccessSource = read("artifacts/api-server/src/routes/pilotAccess.ts");
const vercelPilotAccessSource = read("api/pilot-access.ts");
const corsPolicy = read("artifacts/api-server/src/middlewares/corsPolicy.ts");
const openApiSpec = read("lib/api-spec/openapi.yaml");

if (/app\.use\(cors\(\)\)/.test(app) || /\bcors\(\s*\)/.test(app)) {
  failures.push("api-server app must not mount open cors(); use veroxaCors() allowlist policy.");
}
if (!/app\.use\(veroxaCors\(\)\)/.test(app)) {
  failures.push("api-server app must mount veroxaCors().");
}
if (!/express\.json\(\{\s*limit:\s*["']32kb["']\s*\}\)/s.test(app)) {
  failures.push("api-server app must keep express.json limited to 32kb.");
}
if (!/VEROXA_ALLOWED_ORIGINS/.test(corsPolicy) || /origin:\s*["']\*["']/.test(corsPolicy)) {
  failures.push("CORS policy must use VEROXA_ALLOWED_ORIGINS and must not use wildcard origins.");
}

const healthIndex = routesIndex.indexOf("router.use(healthRouter)");
const authIndex = routesIndex.indexOf("router.use(requireProtectedApiAccess)");
if (healthIndex === -1) failures.push("health router must be mounted.");
if (authIndex === -1) failures.push("protected API access middleware must be mounted.");
if (healthIndex !== -1 && authIndex !== -1 && healthIndex > authIndex) {
  failures.push("health router must remain public and be mounted before protected API middleware.");
}
if (!/router\.use\(protectedApiRateLimit\)/.test(routesIndex)) {
  failures.push("protected routes must be rate-limited.");
}
if (!/router\.use\(requireAiRoutesEnabled,\s*auditAiRouter\)/.test(routesIndex)) {
  failures.push("audit AI router must be behind requireAiRoutesEnabled.");
}
if (!/router\.use\(requireGoogleRoutesEnabled,\s*auditLiveRouter\)/.test(routesIndex)) {
  failures.push("Google audit router must be behind requireGoogleRoutesEnabled.");
}
if (!/router\.use\(requireAiRoutesEnabled,\s*aiDraftsRouter\)/.test(routesIndex)) {
  failures.push("AI drafts router must be behind requireAiRoutesEnabled.");
}
for (const token of [
  "VEROXA_INTERNAL_API_KEY",
  "VEROXA_API_ACCESS_TOKEN",
  "x-veroxa-api-key",
  "VEROXA_ENABLE_AI_ROUTES",
  "VEROXA_ENABLE_GOOGLE_ROUTES",
  "VEROXA_ALLOW_UNAUTHENTICATED_DEV_API",
  "VEROXA_DEV_ENVIRONMENT",
]) {
  if (!apiSecurity.includes(token)) failures.push(`api security middleware missing ${token}.`);
}
if (!/envFlag\(["']VEROXA_DEV_ENVIRONMENT["']\)/.test(apiSecurity)) {
  failures.push("dev API bypass must require explicit VEROXA_DEV_ENVIRONMENT flag, not NODE_ENV alone.");
}
if (!/res\.status\(429\)/.test(apiSecurity)) {
  failures.push("protected API rate limiter must return 429 when exceeded.");
}

if (!app.includes("VEROXA_TRUST_PROXY") || !app.includes('app.set("trust proxy", getTrustProxySetting())')) {
  failures.push("api-server app must keep trust proxy explicitly env-controlled and default-disabled.");
}
if (/req\.header\(["']x-forwarded-for["']\)/i.test(pilotAccessSource)) {
  failures.push("pilotAccess.ts must not read raw X-Forwarded-For for rate limiting.");
}
if (!pilotAccessSource.includes("req.ip") || !pilotAccessSource.includes("req.socket.remoteAddress")) {
  failures.push("pilotAccess.ts rate limit key must use server-trusted req.ip with socket fallback.");
}
if (/headers\[["']x-forwarded-for["']\]/i.test(vercelPilotAccessSource)) {
  failures.push("Vercel api/pilot-access.ts must not read raw X-Forwarded-For for rate limiting.");
}
for (const required of ["x-vercel-forwarded-for", "req.socket.remoteAddress", "method_not_allowed", "disabled", "unauthorized", "rate_limited"]) {
  if (!vercelPilotAccessSource.includes(required)) failures.push(`Vercel api/pilot-access.ts missing safe pilot marker: ${required}`);
}
if (!pilotAccessSource.includes("VEROXA_PILOT_MOMO_HOUSE_PASSWORD") || !pilotAccessSource.includes("VEROXA_PILOT_TEAM_FARAZ_PASSWORD") || !vercelPilotAccessSource.includes("VEROXA_PILOT_MOMO_HOUSE_PASSWORD") || !vercelPilotAccessSource.includes("VEROXA_PILOT_TEAM_FARAZ_PASSWORD")) {
  failures.push("pilotAccess.ts must keep pilot passwords server-side in API environment variables.");
}


for (const route of [
  "/ai/draft",
  "/audit/ai-draft",
  "/audit/search-restaurants",
  "/audit/restaurant-details",
]) {
  if (!openApiSpec.includes(route)) failures.push(`OpenAPI spec must document protected route ${route}.`);
}
if (!openApiSpec.includes("VeroxaInternalApiKey") || !openApiSpec.includes("Server-side/internal use only")) {
  failures.push("OpenAPI spec must document protected route API-key security as internal/server-side only.");
}

if (failures.length > 0) {
  console.error("API security guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("API security guardrail passed: protected routes, feature flags, CORS, body limits, and public health route are contained.");
