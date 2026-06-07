import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const failures: string[] = [];
const read = (path: string) => readFileSync(join(root, path), "utf8");

function requireIncludes(file: string, markers: string[]) {
  const text = read(file);
  for (const marker of markers) {
    if (!text.includes(marker)) failures.push(`${file} missing marker: ${marker}`);
  }
  return text;
}

const clientDataHook = read("artifacts/veroxa/src/hooks/useClientPortalData.ts");
if (!clientDataHook.includes("ZERO_GOOGLE_METRICS")) failures.push("Client portal data hook must define ZERO_GOOGLE_METRICS.");
const emptyStart = clientDataHook.indexOf("!portalDataMode.allowDemoFixtures");
const emptyEnd = clientDataHook.indexOf("const realClientId");
if (emptyStart < 0 || emptyEnd < emptyStart) failures.push("Client portal real-route empty-state block could not be located.");
else {
  const emptyBlock = clientDataHook.slice(emptyStart, emptyEnd);
  if (!emptyBlock.includes("googleMetrics: ZERO_GOOGLE_METRICS")) failures.push("Real client empty/review state must use ZERO_GOOGLE_METRICS.");
  if (emptyBlock.includes("demoGoogleMetrics")) failures.push("Real client empty/review state must not reference demoGoogleMetrics.");
  for (const leaked of ["Demo Grill House", "14,820", "3,240", "412", "4.7 / 5"]) {
    if (emptyBlock.includes(leaked)) failures.push(`Real client empty/review state leaks demo marker: ${leaked}`);
  }
}

const devCredentials = requireIncludes("artifacts/veroxa/src/lib/auth/devCredentials.ts", [
  "Real Login V1 pilot portal access",
  "getPilotAccessAccounts",
  "validatePilotAccessCredentials",
  "getPilotRouteForRole",
]);
const pilotAccounts = requireIncludes("artifacts/veroxa/src/lib/auth/pilotAccessAccounts.ts", [
  "Momo House San Antonio",
  "Team Faraz",
  "VITE_VEROXA_PILOT_ACCESS_ENDPOINT",
  "server-controlled",
  "Portal access not configured",
]);
if (/password:\s*["'][^"']+["']/.test(pilotAccounts) || /momohousepilot|teamfarazpilot/.test(pilotAccounts)) failures.push("pilotAccessAccounts must not include bundled plaintext pilot passwords.");
for (const retired of ["VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN", "Preview access ready", "Preview access not enabled", "publicPreviewFallbackEnabled", "isPreviewFriendlyHostname", "faraz@client.com", "faraz@team.com", "farazclient", "farazteam", "momohousepilot", "teamfarazpilot"]) {
  if (devCredentials.includes(retired) || pilotAccounts.includes(retired)) failures.push(`Real Login V1 auth helpers must not retain retired preview-login marker ${retired}.`);
}

requireIncludes("artifacts/veroxa/docs/PRODUCTION_PREVIEW_LOGIN_CHECKLIST.md", [
  "Real Login V1 / Pilot Portal Access Checklist",
  "Sign in to Veroxa",
  "Access your Veroxa portal",
  "Momo House San Antonio",
  "Team Faraz",
  "`AUTH_MODE` remains `\"placeholder\"`",
]);

requireIncludes("artifacts/api-server/src/lib/webPresenceScanner.ts", [
  "validateScanUrlSafety",
  "normalizeUrl",
  "isPrivateOrInternalIp",
  "redirect: \"manual\"",
  "new URL(location, fetchUrl)",
  "lookup(hostname",
  "127.0.0.0",
  "10.0.0.0",
  "172.16.0.0",
  "192.168.0.0",
  "169.254.0.0",
  "169.254.169.254",
  "::1",
  "Manual review needed",
]);
requireIncludes("artifacts/veroxa/docs/API_SECURITY_CONTAINMENT.md", [
  "Website scanner SSRF containment",
  "manual redirects",
  "re-checks redirect/final URLs",
  "not connected to public/client UI",
]);

const requiredDocs: Record<string, string[]> = {
  "artifacts/veroxa/docs/MANUAL_FIRST_CLIENT_LAUNCH_PACK.md": ["Google Business Profile link/access status", "Website link/access status", "Facebook page link/access status", "Instagram profile link/access status", "Menu, order, and reservation links", "Business hours", "Best sellers", "Existing offers/promotions", "Usable media/photos", "manual/pre-live", "Nothing goes live without Veroxa team review"],
  "artifacts/veroxa/docs/FIRST_CLIENT_CLIENT_INSTRUCTIONS.md": ["Google Business Profile", "Website", "Facebook", "Instagram", "Menu, order, and reservation", "Business hours", "Best sellers", "Existing offers/promotions", "usable photos/media"],
  "artifacts/veroxa/docs/FIRST_CLIENT_TEAM_CHECKLIST.md": ["Intake checklist", "Manual work checklist", "Safety checklist"],
  "artifacts/veroxa/docs/FIRST_WEEK_EXECUTION_CHECKLIST.md": ["Intake review", "Profile/account", "Media review", "Website alignment/refinement", "Facebook", "Instagram", "Google updates", "Weekly update"],
  "artifacts/veroxa/docs/FIRST_WEEK_WEEKLY_UPDATE_TEMPLATE.md": ["What Veroxa worked on", "What was posted or prepared", "What is pending", "What media is needed", "What we need you to confirm", "No live automation"],
  "artifacts/veroxa/docs/FIRST_MONTH_MONTHLY_REPORT_TEMPLATE.md": ["What Veroxa handled", "What improved", "What is pending", "What media worked", "What Veroxa needs next", "fake metrics", "guaranteed"],
  "artifacts/veroxa/docs/PAKISTAN_TEAM_EXECUTION_SOP.md": ["manual/pre-live", "do not activate live automation", "Escalate to Faraz", "Yelp/TikTok/Reels/Ads/live integrations"],
  "artifacts/veroxa/docs/FARAZ_ESCALATION_RULES.md": ["Business truth", "Customer-service", "Requests outside", "Access issues", "Bad/insufficient media", "Do not publish automatically"],
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md": ["CURRENT_BUILD_STATUS.md", "PRICING_SOURCE_OF_TRUTH.md", "VEROXA_OS_SYSTEM_MAP.md", "ROUTE_PAGE_INVENTORY.md", "VEROXA_ROUTE_SURFACE_MAP.md", "PRE_PAID_ACTIVATION_GATE.md", "historical/deprecated/archive-only", "Complete Online Presence — $495/month"],
};
for (const [file, markers] of Object.entries(requiredDocs)) {
  if (!existsSync(join(root, file))) failures.push(`${file} must exist.`);
  else requireIncludes(file, markers);
}

requireIncludes("artifacts/veroxa/docs/ROUTE_PAGE_INVENTORY.md", [
  "/",
  "/free-audit",
  "/login",
  "/services",
  "/pricing",
  "/demo",
  "/guided-demo",
  "/demo/client/dashboard",
  "/upload",
  "/client/dashboard",
  "/team/dashboard",
  "quarantined",
]);

const teamGuard = requireIncludes("artifacts/veroxa/src/components/auth/InternalDemoGuard.tsx", [
  "Manual/pre-live Team portal",
  "No live automation or publishing is active",
  "team-manual-prelive-notice",
]);
if (!teamGuard.includes("Wrong portal for this login")) failures.push("Team guard must keep wrong-portal blocked state.");

if (failures.length) {
  console.error(`Manual first-client launch safety guardrail failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exit(1);
}
console.log("Manual first-client launch safety guardrail passed.");
