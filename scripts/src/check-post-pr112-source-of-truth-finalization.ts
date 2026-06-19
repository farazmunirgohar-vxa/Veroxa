import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const cwd = process.cwd();
const root = cwd.endsWith("/scripts") ? join(cwd, "..") : cwd;
const read = (p: string) => readFileSync(join(root, p), "utf8");
const failures: string[] = [];
const must = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg);
};

const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
const login = read("artifacts/veroxa/src/pages/login.tsx");
const pilotAccess = read("artifacts/veroxa/src/lib/auth/pilotAccessAccounts.ts");
const app = read("artifacts/veroxa/src/App.tsx");
const nav = read("artifacts/veroxa/src/lib/teamPortalNav.ts");
const readinessPage = read("artifacts/veroxa/src/pages/team-momo-live-readiness.tsx");
const activationPage = read("artifacts/veroxa/src/pages/team-momo-activation-gate.tsx");
const readinessConfig = read("artifacts/veroxa/src/lib/momoReadiness/momoReadinessConfig.ts");
const activationConfig = read("artifacts/veroxa/src/lib/momoActivation/momoActivationConfig.ts");
const readinessService = read("artifacts/veroxa/src/lib/momoReadiness/momoReadinessService.ts");
const activationService = read("artifacts/veroxa/src/lib/momoActivation/momoActivationGateService.ts");
const pkg = read("package.json");
const scriptsPkg = read("scripts/package.json");

const activeDocPaths = [
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_PR_SEQUENCE.md",
  "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_ARCHITECTURE.md",
  "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_MOMO_READINESS_GATE.md",
  "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_MOMO_ACTIVATION_GATE.md",
  "artifacts/veroxa/docs/ROUTE_PAGE_INVENTORY.md",
  "artifacts/veroxa/docs/VEROXA_ROUTE_SURFACE_MAP.md",
];
const activeDocs = activeDocPaths.map(read).join("\n");

must(/AUTH_MODE\s*:\s*AuthMode\s*=\s*["']placeholder["']/.test(authMode), "AUTH_MODE must remain placeholder.");
must(/pilot-access/.test(login + pilotAccess), "/api/pilot-access must remain active.");
must(!/role\s*===\s*["'](owner|operator|admin|super_admin)["']/.test([app, nav, readinessConfig, activationConfig, readinessService, activationService].join("\n")), "Roles must remain client/team only.");
must(app.includes('path="/team/momo-live-readiness"'), "/team/momo-live-readiness route must exist.");
must(app.includes('path="/team/momo-activation-gate"'), "/team/momo-activation-gate route must exist.");
must(!app.includes('path="/client/momo-activation-gate"'), "No /client/momo-activation-gate route exists.");
must(!existsSync(join(root, "artifacts/veroxa/src/pages/client-momo-activation-gate.tsx")), "No client Momo activation page exists.");
for (const [name, source] of [["readiness", app.match(/<Route path="\/team\/momo-live-readiness">[\s\S]*?<\/Route>/)?.[0] ?? ""], ["activation", app.match(/<Route path="\/team\/momo-activation-gate">[\s\S]*?<\/Route>/)?.[0] ?? ""]] as const) {
  must(source.includes('InternalDemoGuard role="team"'), `${name} gate must be guarded by InternalDemoGuard role=team.`);
  must(source.includes('RealPortalDataBoundary portal="team"'), `${name} gate must be guarded by RealPortalDataBoundary portal=team.`);
}

const requiredDocPhrases = [
  "PR #109 Momo Live Pilot Readiness Gate is merged",
  "PR #110 Post-PR109 Momo readiness alignment is merged",
  "PR #111 Controlled Momo Pilot Activation Gate is merged",
  "PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged",
  "PR #113 is source-of-truth finalization only",
  "No next activation PR is approved by default",
  "Future real-world activation requires separate explicit Faraz approval",
  "AUTH_MODE` remains `placeholder",
  "/api/pilot-access` remains active",
  "Momo owner walkthrough remains blocked",
];
for (const phrase of requiredDocPhrases) {
  must(activeDocs.includes(phrase), `Active docs must include: ${phrase}`);
}
for (const status of ["please_review", "pre_filled", "confirmed", "optional", "veroxa_review"]) {
  must(activeDocs.includes(status), `Active docs must mention PR #112 status: ${status}.`);
}
for (const stale of [
  "Current GitHub PR is PR #111",
  "current source-of-truth correction for GitHub PR numbering through GitHub PR #111",
  "PR #110 remains Controlled Momo Pilot Activation Gate",
  "Controlled Momo Pilot Activation Gate remains PR #110",
  "whether PR #110 can be considered later",
]) {
  must(!activeDocs.includes(stale), `Active docs contain stale wording: ${stale}`);
}

must(scriptsPkg.includes("check-post-pr112-source-of-truth-finalization"), "scripts package wires PR #113 guardrail.");
must(pkg.includes("check-post-pr112-source-of-truth-finalization"), "root verify:veroxa wires PR #113 guardrail.");

const activeCode = [app, nav, readinessPage, activationPage, readinessConfig, activationConfig, readinessService, activationService].join("\n");
const forbidden = [
  /go live now/i, /start pilot/i, /pilot activated/i, /activate pilot/i, /contact Momo/i, /send to owner/i,
  /publish externally/i, /sync Google/i, /sync Meta/i, /connect Instagram/i, /connect Facebook/i,
  /create auth user/i, /invite client/i, /\bcron\b/i, /webhook/i, /background job/i, /scheduled job/i,
  /stripe/i, /checkout/i, /service_role/i, /platform token/i, /fake readiness/i, /fake metrics/i, /fake reports/i, /fake activity/i,
];
for (const pattern of forbidden) {
  const hits = activeCode.match(new RegExp(pattern.source, pattern.flags.includes("i") ? "gi" : "g")) ?? [];
  const safeHits = activeCode.match(new RegExp(`(does not|do not|no|without|not|blocked before|blocked until)[^\\n.]{0,140}${pattern.source}`, "gi")) ?? [];
  must(hits.length === safeHits.length, `Forbidden unsafe active-code phrase found: ${pattern} (${hits.length} hits, ${safeHits.length} safe hits).`);
}

if (failures.length) {
  console.error(failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}
console.log("Post-PR112 source-of-truth finalization guardrail passed.");
