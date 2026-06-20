import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (path: string) => readFileSync(join(root, path), "utf8");
const failures: string[] = [];
const must = (ok: boolean, message: string) => {
  if (!ok) failures.push(message);
};
const joined = (parts: string[]) => parts.join("");

const qaDoc = read("artifacts/veroxa/docs/MOMO_PILOT_LAUNCH_QA.md");
const walkthroughDoc = read("artifacts/veroxa/docs/MOMO_OWNER_WALKTHROUGH.md");
const app = read("artifacts/veroxa/src/App.tsx");
const freeAudit = read("artifacts/veroxa/src/pages/free-audit.tsx");
const login = read("artifacts/veroxa/src/pages/login.tsx");
const onboarding = read("artifacts/veroxa/src/pages/client-onboarding.tsx");
const teamDashboard = read("artifacts/veroxa/src/pages/team-dashboard.tsx");
const pilotAccessClient = read("artifacts/veroxa/src/lib/auth/pilotAccessAccounts.ts");
const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");

for (const [path, text] of [
  ["MOMO_PILOT_LAUNCH_QA.md", qaDoc],
  ["MOMO_OWNER_WALKTHROUGH.md", walkthroughDoc],
] as const) {
  for (const required of [
    "historical/stale blocked reference only",
    "Momo owner walkthrough remains blocked",
    "No next activation PR is approved by default",
    "Future real-world activation requires separate explicit Faraz approval",
    "Do not use this doc",
  ]) {
    must(text.includes(required), `${path} missing blocked-reference marker: ${required}`);
  }

  for (const forbidden of [
    joined(["Status: active real", "-pilot/manual-mode"]),
    joined(["if Momo House says", " yes tomorrow"]),
  ]) {
    must(!text.includes(forbidden), `${path} still contains stale active-guide wording.`);
  }
}

for (const required of [
  "PR #120 — Momo Internal Dry Run + Go/No-Go Gate",
  "PR #120 is internal dry-run/go-no-go review only",
  "AUTH_MODE remains `placeholder`",
  "/api/pilot-access` remains active",
]) {
  must(qaDoc.includes(required) || walkthroughDoc.includes(required), `Historical docs must point to current PR120 truth: ${required}`);
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
  must(!routePaths.includes(retiredRoute), `${retiredRoute} must remain retired in App.tsx.`);
}

for (const required of [
  "VITE_VEROXA_PILOT_ACCESS_ENDPOINT",
  "Momo House San Antonio",
  "Team Faraz",
  "/client/dashboard",
  "/team/dashboard",
]) {
  must(
    pilotAccessClient.includes(required) || login.includes(required) || qaDoc.includes(required),
    `Pilot login expectation is not documented in frontend/docs: ${required}`,
  );
}

must(/AUTH_MODE\s*:\s*AuthMode\s*=\s*["']placeholder["']/.test(authMode), "AUTH_MODE must remain placeholder.");
must(pilotAccessClient.includes("/api/pilot-access"), "/api/pilot-access must remain active.");

const frontendText = `${login}\n${pilotAccessClient}\n${onboarding}\n${teamDashboard}`;
for (const forbidden of [
  joined(["faraz", "client"]),
  joined(["faraz", "team"]),
  joined(["VEROXA_PILOT_MOMO_HOUSE", "_PASSWORD="]),
  joined(["VEROXA_PILOT_TEAM_FARAZ", "_PASSWORD="]),
]) {
  must(!frontendText.includes(forbidden), "Frontend source contains retired password marker.");
}

must(
  freeAudit.includes("generated locally in your browser") && freeAudit.includes("portal lead capture is not connected yet"),
  "Free Audit must remain honest that lead capture/review request storage is local-only right now.",
);

for (const required of [
  "Momo Pilot Command Center",
  "Owner verification",
  "Access blockers",
  "First 7-day tasks",
  "First 30-day tasks",
  "No automated publishing warning",
]) {
  must(teamDashboard.includes(required), `Team dashboard missing Momo command center marker: ${required}`);
}

if (failures.length > 0) {
  console.error("Momo pilot launch QA guardrail failed:\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Momo pilot launch QA guardrail passed.");
