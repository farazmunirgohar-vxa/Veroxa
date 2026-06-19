import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const cwd = process.cwd();
const root = cwd.endsWith("/scripts") ? join(cwd, "..") : cwd;
const read = (path: string) => readFileSync(join(root, path), "utf8");
const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
const pilotAccess = read("artifacts/veroxa/src/lib/auth/pilotAccessAccounts.ts");
const app = read("artifacts/veroxa/src/App.tsx");
const nav = read("artifacts/veroxa/src/lib/teamPortalNav.ts");
const page = read("artifacts/veroxa/src/pages/team-momo-pilot-prep.tsx");
const checklist = read("artifacts/veroxa/src/lib/momoPilotPrep/momoPilotPrepChecklist.ts");
const controlCenter = read("artifacts/veroxa/src/pages/team-control-center.tsx");
const activeDocsIndex = read("artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md");
const pkg = read("package.json");
const scriptsPkg = read("scripts/package.json");
const docs = [
  "artifacts/veroxa/docs/MOMO_INTERNAL_PILOT_PREP_PACK.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_PR_SEQUENCE.md",
  "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_ARCHITECTURE.md",
  "artifacts/veroxa/docs/ROUTE_PAGE_INVENTORY.md",
  "artifacts/veroxa/docs/VEROXA_ROUTE_SURFACE_MAP.md",
  "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_MOMO_READINESS_GATE.md",
  "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_MOMO_ACTIVATION_GATE.md",
].map(read).join("\n");

must(/AUTH_MODE\s*:\s*AuthMode\s*=\s*["']placeholder["']/.test(authMode), "AUTH_MODE must remain placeholder.");
must(pilotAccess.includes("/api/pilot-access"), "/api/pilot-access must remain active.");
must(app.includes('path="/team/momo-pilot-prep"'), "/team/momo-pilot-prep route exists.");
const routeStart = app.indexOf('path="/team/momo-pilot-prep"');
const routeEnd = app.indexOf('path="/team/momo-activation-gate"');
const routeBlock = app.slice(routeStart, routeEnd > routeStart ? routeEnd : undefined);
must(routeBlock.includes('<InternalDemoGuard role="team">'), "Momo prep route must be guarded by InternalDemoGuard role=team.");
must(routeBlock.includes('<RealPortalDataBoundary portal="team">'), "Momo prep route must be wrapped in RealPortalDataBoundary portal=team.");
must(nav.includes("Momo Prep") && nav.includes("/team/momo-pilot-prep"), "Team nav includes /team/momo-pilot-prep.");
must(controlCenter.includes("Momo Internal Prep") && controlCenter.includes("PR #114") && controlCenter.includes("/team/momo-pilot-prep"), "Team Control Center links to Momo Prep.");
must(!app.includes('path="/client/momo-pilot-prep"'), "No client Momo prep route exists.");
must(!existsSync(join(root, "artifacts/veroxa/src/pages/client-momo-pilot-prep.tsx")), "No client Momo prep page exists.");
must(!/path=["']\/team\/.*owner.*walkthrough/i.test(app), "No owner walkthrough route exists.");
must(!/role\s*===\s*["'](owner|operator|admin|super_admin|execution)["']/.test([app, nav, page, checklist].join("\n")), "No new roles beyond client/team.");

for (const phrase of [
  "Internal prep only.",
  "This does not activate the pilot.",
  "This does not turn on real auth.",
  "This does not create credentials.",
  "This does not contact Momo’s House.",
  "This does not publish externally.",
  "This does not connect Google, Meta, Yelp, TikTok, or delivery platforms.",
  "Business-truth changes still require owner confirmation.",
  "Momo owner walkthrough remains blocked.",
  "No next activation PR is approved by default.",
  "Future real-world activation requires separate explicit Faraz approval.",
]) must(page.includes(phrase), `Page missing required safety copy: ${phrase}`);

for (const category of [
  "Business Truth Confirmation",
  "Missing / Uncertain Fields",
  "Media Needs",
  "Access / Account Needs",
  "Internal Owner Walkthrough Prep",
  "Activation Boundaries",
  "Next Decision",
]) must(checklist.includes(category), `Checklist missing category: ${category}`);

must(!/\.insert\(|\.update\(|\.upsert\(|\.delete\(/.test([page, checklist].join("\n")), "No DB writes in Momo prep pack code.");
must(!readdirSync(join(root, "artifacts/veroxa")).includes("supabase"), "No database migration folder added under artifacts/veroxa.");

const activeCode = [app, nav, page, checklist, controlCenter].join("\n");
const unsafePatterns = [/go live now/i, /pilot activated/i, /owner walkthrough can begin/i, /activation approved/i, /real auth activation approved/i, /service_role/i, /platform token/i, /\.insert\(/, /\.update\(/, /\.upsert\(/, /\.delete\(/];
for (const pattern of unsafePatterns) must(!pattern.test(activeCode), `Forbidden active-code pattern found: ${pattern}`);
for (const phrase of ["create auth user", "invite client", "fake metrics", "fake reports", "fake activity"]) {
  const hits = activeCode.match(new RegExp(phrase, "gi")) ?? [];
  const safeHits = activeCode.match(new RegExp(`(does not|no|without|must not)[^\\n.]{0,100}${phrase}`, "gi")) ?? [];
  must(hits.length === safeHits.length, `Forbidden unsafe active-code phrase found: ${phrase}`);
}
for (const source of [
  "start " + "pilot",
  "activate " + "pilot",
  "contact " + "Momo",
  "send to " + "owner",
  "publish " + "externally",
  "connect " + "Instagram",
  "connect " + "Facebook",
  "create " + "credentials",
  "turn on " + "real auth",
  "sync " + "Google",
  "sync " + "Meta",
  "OAuth",
  "web" + "hook",
  "cron",
  "background " + "job",
  "scheduled " + "job",
  "stripe",
  "check" + "out",
]) {
  const hits = activeCode.match(new RegExp(source, "gi")) ?? [];
  const safeHits = activeCode.match(new RegExp(`(does not|do not|no|without|must not|blocked)[^\\n.]{0,140}${source}`, "gi")) ?? [];
  must(hits.length === safeHits.length, `Forbidden unsafe active-code phrase found: /${source}/ (${hits.length} hits, ${safeHits.length} safe hits).`);
}

for (const marker of [
  "GitHub PR #114",
  "Momo Internal Pilot Prep Pack",
  "internal preparation only",
  "AUTH_MODE remains placeholder",
  "/api/pilot-access remains active",
  "Momo owner walkthrough remains blocked",
  "No next activation PR is approved by default",
  "Future real-world activation requires separate explicit Faraz approval",
]) must(docs.includes(marker), `Docs missing ${marker}.`);
must(activeDocsIndex.includes("MOMO_INTERNAL_PILOT_PREP_PACK.md"), "Active Docs Index must list Momo Internal Pilot Prep Pack as a source-of-truth doc.");

must(scriptsPkg.includes("check-momo-internal-pilot-prep-pack"), "scripts package wires Momo prep guardrail.");
must(pkg.includes("check-momo-internal-pilot-prep-pack"), "root verify:veroxa wires Momo prep guardrail.");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log("Momo Internal Pilot Prep Pack guardrail passed.");
