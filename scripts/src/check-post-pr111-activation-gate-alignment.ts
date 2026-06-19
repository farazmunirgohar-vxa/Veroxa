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
const pilotAccess = read(
  "artifacts/veroxa/src/lib/auth/pilotAccessAccounts.ts",
);
const activationConfig = read(
  "artifacts/veroxa/src/lib/momoActivation/momoActivationConfig.ts",
);
const activationService = read(
  "artifacts/veroxa/src/lib/momoActivation/momoActivationGateService.ts",
);
const readinessService = read(
  "artifacts/veroxa/src/lib/momoReadiness/momoReadinessService.ts",
);
const businessTruth = read(
  "artifacts/veroxa/src/lib/momoReadiness/businessTruthStatus.ts",
);
const app = read("artifacts/veroxa/src/App.tsx");
const nav = read("artifacts/veroxa/src/lib/teamPortalNav.ts");
const pkg = read("package.json");
const scriptsPkg = read("scripts/package.json");
const activeDocs = [
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_PR_SEQUENCE.md",
  "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_MOMO_ACTIVATION_GATE.md",
  "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_MOMO_READINESS_GATE.md",
  "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_ARCHITECTURE.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/ROUTE_PAGE_INVENTORY.md",
  "artifacts/veroxa/docs/VEROXA_ROUTE_SURFACE_MAP.md",
  "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
]
  .map(read)
  .join("\n");

must(
  /AUTH_MODE\s*:\s*AuthMode\s*=\s*["']placeholder["']/.test(authMode),
  "AUTH_MODE must remain placeholder.",
);
must(
  /pilot-access/.test(login + pilotAccess),
  "/api/pilot-access must remain active.",
);
must(
  !/role\s*===\s*["'](owner|operator|admin|super_admin)["']/.test(
    [activationConfig, activationService, readinessService, app, nav].join(
      "\n",
    ),
  ),
  "Roles must remain client/team only.",
);
must(
  app.includes('path="/team/momo-activation-gate"'),
  "Activation gate route remains /team/momo-activation-gate.",
);
must(
  !app.includes('path="/client/momo-activation-gate"'),
  "No /client/momo-activation-gate route exists.",
);
must(
  !existsSync(
    join(root, "artifacts/veroxa/src/pages/client-momo-activation-gate.tsx"),
  ),
  "No client Momo activation page exists.",
);
must(
  activationConfig.includes('AUTH_MODE === "real"') &&
    activationConfig.includes("VITE_VEROXA_MOMO_ACTIVATION_GATE_ENABLED") &&
    activationConfig.includes('auth.status === "authenticated"') &&
    activationConfig.includes('role === "team"'),
  "Activation feature gate must require real auth, flag, and authenticated Team role.",
);
for (const status of [
  "please_review",
  "pre_filled",
  "confirmed",
  "optional",
  "veroxa_review",
]) {
  must(
    (activationService + readinessService + businessTruth).includes(status),
    `Activation/readiness code must recognize ${status}.`,
  );
}
must(
  activationService.includes("hasUnconfirmedBusinessTruth") &&
    activationService.includes("!hasUnconfirmedBusinessTruth") &&
    activationService.includes("unconfirmedFields.length"),
  "readyForDecision must depend on no unconfirmed business-truth fields.",
);
must(
  !/\["missing", "needs_owner_verification", "owner_corrected", "blocked_needs_access"\]/.test(
    activationService,
  ),
  "Activation gate must not use stale profile-field statuses.",
);
must(
  !/needs_owner_confirmation/.test(
    activationService.match(/pendingTruth[\s\S]{0,220}/)?.[0] ?? "",
  ),
  "Activation pendingTruth must not treat needs_owner_confirmation as a database profile_corrections status.",
);
must(
  !/title:\s*["']PR #110 required["']/.test(readinessService) &&
    !/status:\s*["']future_pr_required["'][\s\S]{0,160}PR #110/.test(
      readinessService,
    ),
  "Readiness service must not keep stale PR #110 required as a future/critical blocker.",
);
must(
  !activeDocs.includes(
    "PR #110 remains Controlled Momo Pilot Activation Gate",
  ) &&
    !activeDocs.includes(
      "Controlled Momo Pilot Activation Gate remains PR #110",
    ),
  "Active docs must not say PR #110 is the Controlled Momo Pilot Activation Gate.",
);
must(
  activeDocs.includes(
    "PR #111 Controlled Momo Pilot Activation Gate is already merged",
  ),
  "Active docs must say PR #111 is already merged as the Controlled Momo Pilot Activation Gate.",
);
must(
  activeDocs.includes("PR #112 is corrective alignment only"),
  "Active docs must say PR #112 is corrective alignment only.",
);
must(
  scriptsPkg.includes("check-post-pr111-activation-gate-alignment"),
  "scripts package wires PR #112 guardrail.",
);
must(
  pkg.includes("check-post-pr111-activation-gate-alignment"),
  "root verify:veroxa wires PR #112 guardrail.",
);

const activeCode = [
  activationConfig,
  activationService,
  readinessService,
  app,
  nav,
].join("\n");
const forbidden = [
  /go live now/i,
  /start pilot/i,
  /pilot activated/i,
  /activate pilot/i,
  /contact Momo/i,
  /send to owner/i,
  /publish externally/i,
  /sync Google/i,
  /sync Meta/i,
  /connect Instagram/i,
  /connect Facebook/i,
  /create auth user/i,
  /invite client/i,
  /\bcron\b/i,
  /webhook/i,
  /background job/i,
  /scheduled job/i,
  /stripe/i,
  /checkout/i,
  /service_role/i,
  /platform token/i,
  /fake readiness/i,
  /fake metrics/i,
  /fake reports/i,
  /fake activity/i,
];
for (const pattern of forbidden) {
  const hits =
    activeCode.match(
      new RegExp(pattern.source, pattern.flags.includes("i") ? "gi" : "g"),
    ) ?? [];
  const safeHits =
    activeCode.match(
      new RegExp(
        `(does not|do not|no|without|not)[^\\n.]{0,100}${pattern.source}`,
        "gi",
      ),
    ) ?? [];
  must(
    hits.length === safeHits.length,
    `Forbidden unsafe active-code phrase found: ${pattern}`,
  );
}

if (failures.length) {
  console.error(failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}
console.log("Post-PR111 activation gate alignment guardrail passed.");
