import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (path: string) => readFileSync(join(root, path), "utf8");
const failures: string[] = [];

const qaDoc = read("artifacts/veroxa/docs/MOMO_PILOT_LAUNCH_QA.md");
const walkthroughDoc = read("artifacts/veroxa/docs/MOMO_OWNER_WALKTHROUGH.md");
const app = read("artifacts/veroxa/src/App.tsx");
const freeAudit = read("artifacts/veroxa/src/pages/free-audit.tsx");
const login = read("artifacts/veroxa/src/pages/login.tsx");
const onboarding = read("artifacts/veroxa/src/pages/client-onboarding.tsx");
const teamDashboard = read("artifacts/veroxa/src/pages/team-dashboard.tsx");
const pilotAccessClient = read("artifacts/veroxa/src/lib/auth/pilotAccessAccounts.ts");

for (const required of [
  "Momo House routes to `/client/dashboard`",
  "Team Faraz routes to `/team/dashboard`",
  "No pilot password appears in frontend source",
  "Free Audit remains honest",
  "Momo House routes to `/client/dashboard`",
]) {
  if (!qaDoc.includes(required)) failures.push(`MOMO_PILOT_LAUNCH_QA.md missing: ${required}`);
}

for (const required of [
  "Veroxa is a simple online presence system for restaurants",
  "preliminary public-signal assessment",
  "narrow menu is a content challenge, but it is manageable",
  "First 7 days",
  "First 30 days",
  "Veroxa cannot promise",
  "This is a controlled pilot",
]) {
  if (!walkthroughDoc.includes(required)) failures.push(`MOMO_OWNER_WALKTHROUGH.md missing: ${required}`);
}

const routePaths = [...app.matchAll(/<Route\s+path=["']([^"']+)["']/g)].map((match) => match[1]);
for (const retiredRoute of [
  "/demo",
  "/guided-demo",
  "/upload",
  "/demo/client/dashboard",
  "/demo/client/onboarding",
  "/demo/client/media",
  "/demo/client/updates",
  "/demo/client/requests",
  "/demo/client/reports",
]) {
  if (routePaths.includes(retiredRoute)) failures.push(`${retiredRoute} must remain retired in App.tsx.`);
}

for (const required of [
  "VITE_VEROXA_PILOT_ACCESS_ENDPOINT",
  "Momo House San Antonio",
  "Team Faraz",
  "/client/dashboard",
  "/team/dashboard",
]) {
  if (!pilotAccessClient.includes(required) && !login.includes(required) && !qaDoc.includes(required)) {
    failures.push(`Pilot login expectation is not documented in frontend/docs: ${required}`);
  }
}

for (const forbidden of [
  "farazclient",
  "farazteam",
  "VEROXA_PILOT_MOMO_HOUSE_PASSWORD=",
  "VEROXA_PILOT_TEAM_FARAZ_PASSWORD=",
]) {
  const frontendText = `${login}\n${pilotAccessClient}\n${onboarding}\n${teamDashboard}`;
  if (frontendText.includes(forbidden)) failures.push(`Frontend source contains retired credential/password marker: ${forbidden}`);
}

for (const forbidden of [
  "preview access",
  "demo access",
  "review-mode preview",
  "sample data",
  "public preview",
  "not production client billing",
  "guided demo",
  "upload demo",
]) {
  const activeOwnerFacingText = [
    "artifacts/veroxa/src/pages/login.tsx",
    "artifacts/veroxa/src/pages/client-dashboard.tsx",
    "artifacts/veroxa/src/pages/client-onboarding.tsx",
    "artifacts/veroxa/src/pages/client-media.tsx",
    "artifacts/veroxa/src/pages/client-updates.tsx",
    "artifacts/veroxa/src/pages/client-requests.tsx",
    "artifacts/veroxa/src/pages/client-reports.tsx",
    "artifacts/veroxa/src/components/public/PublicNav.tsx",
    "artifacts/veroxa/src/components/public/PublicFooter.tsx",
    "artifacts/veroxa/src/pages/landing.tsx",
  ].map((path) => [path, read(path)] as const);
  for (const [path, text] of activeOwnerFacingText) {
    if (text.toLowerCase().includes(forbidden)) failures.push(`${path} contains retired owner-facing phrase: ${forbidden}`);
  }
}

if (!freeAudit.includes("generated locally in your browser") || !freeAudit.includes("portal lead capture is not connected yet")) {
  failures.push("Free Audit must remain honest that lead capture/review request storage is local-only right now.");
}

for (const required of [
  "Momo Pilot Command Center",
  "Owner verification",
  "Access blockers",
  "First 7-day tasks",
  "First 30-day tasks",
  "No automated publishing warning",
]) {
  if (!teamDashboard.includes(required)) failures.push(`Team dashboard missing Momo command center marker: ${required}`);
}

if (failures.length > 0) {
  console.error("Momo pilot launch QA guardrail failed:\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Momo pilot launch QA guardrail passed.");
