import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const scanRoots = [
  "artifacts/veroxa/src",
  "AGENTS.md",
  "artifacts/veroxa/docs/PRICING_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/PUBLIC_PRICING_AND_SERVICES.md",
  "artifacts/veroxa/docs/VEROXA_OS_LOCKED_MODEL.md",
  "artifacts/veroxa/docs/FIRST_5_LAUNCH_READINESS_AND_GUARDRAILS.md",
  "artifacts/veroxa/docs/FIRST_5_QA_READINESS_CHECKLIST.md",
  "artifacts/veroxa/docs/CURRENT_REAL_VEROXA_MODEL.md",
  ".agents/memory/veroxa-two-role-model.md",
  "artifacts/veroxa/src/lib/permissions/README.md",
];
const ignoredPathParts = [
  "/dist/",
  "/node_modules/",
  "/.git/",
  "scripts/src/check-business-guardrails.ts",
  "scripts/src/check-profit-validation-model.ts",
];
const activeRealPortalPages = new Set([
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/client-media.tsx",
  "artifacts/veroxa/src/pages/client-requests.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
  "artifacts/veroxa/src/pages/team-dashboard.tsx",
  "artifacts/veroxa/src/pages/team-upload-inbox.tsx",
  "artifacts/veroxa/src/pages/team-work-queue.tsx",
  "artifacts/veroxa/src/pages/team-direction-queue.tsx",
  "artifacts/veroxa/src/pages/team-report-queue.tsx",
  "artifacts/veroxa/src/pages/team-audit-leads.tsx",
  "artifacts/veroxa/src/pages/team-approval-queue.tsx",
  "artifacts/veroxa/src/pages/team-visibility-audit.tsx",
]);
const demoRestaurantNames = [
  "Demo Grill House",
  "Demo Taco Bar",
  "Demo Cafe",
  "Demo Bistro",
] as const;
const sourceExtensions = new Set([".ts", ".tsx", ".md"]);

const failures: string[] = [];

function walk(path: string): string[] {
  const full = join(root, path);
  const stat = statSync(full);
  if (stat.isFile()) return [full];
  const out: string[] = [];
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    const child = join(full, entry.name);
    if (ignoredPathParts.some((part) => child.includes(part))) continue;
    if (entry.isDirectory()) out.push(...walk(child.slice(root.length + 1)));
    else if (sourceExtensions.has(extname(entry.name))) out.push(child);
  }
  return out;
}

function rel(fullPath: string): string {
  return fullPath.startsWith(root) ? fullPath.slice(root.length + 1) : fullPath;
}

function isExemptContext(file: string, line: string): boolean {
  if (
    /sql_drafts|migration|MIGRATION_|CODEX_PRICING_CLEANUP_BRIEF|BUILD_STATUS|CURRENT_BUILD_STATUS/i.test(
      file,
    )
  )
    return true;
  return /deprecated|historical|history|legacy|retired|inactive|internal-only|compatibility alias|must not|do not|never|forbidden|guardrail|denylist|not current|not active|no active|NO active/i.test(
    line,
  );
}

const riskyCustomerServiceClaim =
  /Veroxa\s+(handles|manages|replies to|responds to|takes care of)[^\n]*(DMs?|comments?|complaints?|refunds?|order questions?|inboxes?|customer-service conversations?|customer service)/i;
const serviceBoundarySafe =
  /does not|doesn't|do not|not handle|not included|outside included services|restaurant remains responsible|customer-service outside/i;
const activeRoleClaim =
  /(active|current|runtime|live|human|portal|user-facing)\s+(human\s+)?roles?[^\n]*(Operator|Owner|Super Admin)|roles?\s+(are always|include|includes)[^\n]*(Operator|Owner|Super Admin)|(Operator|Owner|Super Admin)\s+as\s+an?\s+(active|current|runtime|live|human|portal|user-facing)\s+roles?/i;

const publicMetadataFiles = [
  "artifacts/veroxa/index.html",
  "artifacts/veroxa/src/pages/landing.tsx",
  "artifacts/veroxa/src/pages/services.tsx",
  "artifacts/veroxa/src/pages/pricing.tsx",
] as const;

for (const file of publicMetadataFiles) {
  const text = readFileSync(join(root, file), "utf8");
  for (const forbidden of ["built on Replit", "Update this description"]) {
    if (text.includes(forbidden)) {
      failures.push(
        `${file} contains placeholder public metadata/copy: ${forbidden}`,
      );
    }
  }
}

const knownWarmAuditSearchFixtures = [
  "Mamadali",
  "Mamdali",
  "Mamadali Kebab",
  "Mamadali Kebab House",
  "Mamadali Kabob",
  "Mamadali Kebob",
  "Selda",
  "Selda Mediterranean",
  "Selda Restaurant",
  "Selda San Antonio",
];

const demoRestaurantSearch = readFileSync(
  join(root, "artifacts/veroxa/src/data/demo/demoRestaurantSearch.ts"),
  "utf8",
);
for (const restaurantName of knownWarmAuditSearchFixtures) {
  if (!demoRestaurantSearch.includes(restaurantName)) {
    failures.push(
      `Known warm audit target fixture/alias missing from search data: ${restaurantName}`,
    );
  }
}
for (const marker of [
  "normalizeRestaurantSearchText",
  "searchAliases",
  "editDistanceWithinOne",
  "cuisineType?: string",
]) {
  if (!demoRestaurantSearch.includes(marker)) {
    failures.push(
      `Audit search normalization/fallback marker missing: ${marker}`,
    );
  }
}

const freeAudit = readFileSync(
  join(root, "artifacts/veroxa/src/pages/free-audit.tsx"),
  "utf8",
);
for (const marker of [
  "btn-use-manual-audit-fallback",
  "potential Veroxa opportunity",
  "review-mode audit preview",
  "Live Google/API scanning is not connected here yet",
  'restaurantSource: candidate.source === "manual" ? "manual" : "fixture"',
]) {
  if (!freeAudit.includes(marker)) {
    failures.push(`Free Audit manual fallback marker missing: ${marker}`);
  }
}

const teamAuditLeads = readFileSync(
  join(root, "artifacts/veroxa/src/pages/team-audit-leads.tsx"),
  "utf8",
);
for (const marker of [
  "audit-lead-search-input",
  "btn-create-manual-audit-lead",
  "searchRestaurantCandidates(manualLeadInput)",
  "manual-lead-link-fields",
  "Weak discoverability / name-indexing issue — potential Veroxa opportunity",
  'selectedSource: "manual"',
]) {
  if (!teamAuditLeads.includes(marker)) {
    failures.push(
      `Team Audit Leads search/manual fallback marker missing: ${marker}`,
    );
  }
}


const restaurantNameMatching = readFileSync(
  join(root, "artifacts/veroxa/src/lib/audit/restaurantNameMatching.ts"),
  "utf8",
);
for (const marker of [
  "normalizeRestaurantSearchText",
  "getRestaurantSearchVariants",
  "editDistanceWithinOne",
  "isLikelySameRestaurantName",
  "searchRestaurantCandidates",
  "buildManualAuditLeadFallback",
  "Weak discoverability / name-indexing issue — potential Veroxa opportunity.",
]) {
  if (!restaurantNameMatching.includes(marker)) {
    failures.push(`restaurantNameMatching.ts missing audit-search marker: ${marker}`);
  }
}
const publicClientGuaranteePatterns: Array<[RegExp, string]> = [
  [/(?:10|15|20|50)\s+orders\/day/i, "exact public/client order target"],
  [/guaranteed\s+orders/i, "public/client order guarantee"],
  [/guaranteed\s+profit/i, "public/client profit guarantee"],
  [/guaranteed\s+ROI/i, "public/client ROI guarantee"],
  [/guaranteed\s+customers/i, "public/client customer guarantee"],
  [/guaranteed\s+revenue/i, "public/client revenue guarantee"],
  [/guaranteed\s+walk-ins/i, "public/client walk-in guarantee"],
  [/we make restaurants profitable/i, "public/client profit promise"],
  [
    /20\s+online-influenced\s+actions/i,
    "internal proof target on public/client surface",
  ],
];

const publicClientBoundaryFiles = [
  "artifacts/veroxa/src/pages/landing.tsx",
  "artifacts/veroxa/src/pages/services.tsx",
  "artifacts/veroxa/src/pages/pricing.tsx",
  "artifacts/veroxa/src/pages/free-audit.tsx",
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
] as const;

const forbiddenCopy: Array<[RegExp, string]> = [
  [/\b2 posts per day\b/i, "forbidden posting volume"],
  [/\btwo posts per day\b/i, "forbidden posting volume"],
  [/up to 2 posts/i, "forbidden posting volume"],
  [/up to 2 content posts/i, "forbidden posting volume"],
  [/\b2 content posts\b/i, "forbidden posting volume"],
  [/max 2 content posts/i, "forbidden posting volume"],
  [/Premium increases posting cap/i, "forbidden posting volume"],
  [/unlimited posting/i, "forbidden posting volume"],
  [/Veroxa handles DMs/i, "forbidden service-boundary claim"],
  [/Veroxa handles comments/i, "forbidden service-boundary claim"],
  [/Veroxa replies to comments/i, "forbidden service-boundary claim"],
  [/Veroxa handles inboxes/i, "forbidden service-boundary claim"],
  [/Veroxa handles refunds/i, "forbidden service-boundary claim"],
  [/Veroxa handles complaints/i, "forbidden service-boundary claim"],
  [/Veroxa handles order questions/i, "forbidden service-boundary claim"],
  [
    /Veroxa handles customer-service conversations/i,
    "forbidden service-boundary claim",
  ],
  [/Veroxa provides customer service/i, "forbidden service-boundary claim"],
  [
    /Veroxa manages live customer conversations/i,
    "forbidden service-boundary claim",
  ],
  [/\/demo\/team/i, "inactive team demo route"],
  [/\/demo\/operator/i, "inactive operator demo route"],
  [/\/demo\/owner/i, "inactive owner demo route"],
  [/Super Admin/i, "inactive role"],
];

for (const file of scanRoots.flatMap(walk)) {
  const relative = rel(file);
  const text = readFileSync(file, "utf8");
  text.split(/\r?\n/).forEach((line, index) => {
    if (isExemptContext(relative, line)) return;
    for (const [pattern, label] of forbiddenCopy) {
      if (pattern.test(line))
        failures.push(`${relative}:${index + 1} ${label}: ${line.trim()}`);
    }

    if (
      riskyCustomerServiceClaim.test(line) &&
      !serviceBoundarySafe.test(line)
    ) {
      failures.push(
        `${relative}:${index + 1} forbidden service-boundary claim: ${line.trim()}`,
      );
    }

    if (activeRoleClaim.test(line)) {
      failures.push(
        `${relative}:${index + 1} inactive role appears active: ${line.trim()}`,
      );
    }

    if (
      /Complete Online Presence|Google Optimization|Complete Plus Ads|Ads Management Only/i.test(
        line,
      )
    ) {
      const isActivePublicPricing =
        /price|\$497|\$697|\$997|current public|active public|plan card|publicVisible:\s*true/i.test(
          line,
        );
      const isCurrentGoogleService =
        /Google Optimization included|Google optimization included|Google Business Profile|Google Maps/i.test(
          line,
        );
      if (
        isActivePublicPricing &&
        !isCurrentGoogleService &&
        !isExemptContext(relative, line)
      ) {
        failures.push(
          `${relative}:${index + 1} retired package appears active: ${line.trim()}`,
        );
      }
    }
  });
}

for (const file of publicClientBoundaryFiles) {
  const text = readFileSync(join(root, file), "utf8");
  for (const [pattern, label] of publicClientGuaranteePatterns) {
    if (pattern.test(text)) {
      failures.push(
        `${file} contains blocked public/client guarantee language: ${label}`,
      );
    }
  }
}

const appSource = readFileSync(
  join(root, "artifacts/veroxa/src/App.tsx"),
  "utf8",
);

function assertRouteBoundary(prefix: "client" | "team") {
  const routePattern = new RegExp(
    `<Route path=["']/${prefix}/[^"']+["']>([\\s\\S]*?)</Route>`,
    "g",
  );
  let match: RegExpExecArray | null;
  while ((match = routePattern.exec(appSource)) !== null) {
    const routeBlock = match[0];
    if (!routeBlock.includes(`RealPortalDataBoundary portal="${prefix}"`)) {
      failures.push(
        `App.tsx real /${prefix} route is missing RealPortalDataBoundary: ${routeBlock.split("\n")[0].trim()}`,
      );
    }
  }
}

assertRouteBoundary("client");
assertRouteBoundary("team");

const portalLayoutSource = readFileSync(
  join(root, "artifacts/veroxa/src/components/PortalLayout.tsx"),
  "utf8",
);
if (
  !portalLayoutSource.includes("getSafePortalHref") ||
  !/location\.startsWith\(["']\/demo\/client["']\)[\s\S]{0,200}\/demo\/client\//.test(
    portalLayoutSource,
  )
) {
  failures.push(
    "PortalLayout must keep demo client navigation inside /demo/client/* instead of linking demo users into real /client/* routes.",
  );
}

const realPortalBoundarySource = readFileSync(
  join(root, "artifacts/veroxa/src/components/auth/RealPortalDataBoundary.tsx"),
  "utf8",
);
if (!/\{children\}/.test(realPortalBoundarySource)) {
  failures.push(
    "RealPortalDataBoundary must render children so real /client/* and /team/* shells remain reachable.",
  );
}
if (
  /StillBuilding/.test(realPortalBoundarySource) &&
  !/children/.test(realPortalBoundarySource)
) {
  failures.push(
    "RealPortalDataBoundary appears to replace real routes with StillBuilding instead of providing data mode.",
  );
}
if (
  !/allowDemoFixtures/.test(realPortalBoundarySource) ||
  !/isLiveDataConnected/.test(realPortalBoundarySource)
) {
  failures.push(
    "RealPortalDataBoundary must expose live-data/demo-fixture mode flags.",
  );
}

for (const file of walk("artifacts/veroxa/src/pages")) {
  const relative = rel(file);
  if (!activeRealPortalPages.has(relative)) continue;
  const pageText = readFileSync(file, "utf8");
  const hasRealPortalMode =
    pageText.includes("useRealPortalDataMode") &&
    pageText.includes("canUseFixtureData");
  pageText.split(/\r?\n/).forEach((line, index) => {
    if (/getFirstFiveClientPortalViewModels\(\)\s*\[\d+\]/.test(line)) {
      failures.push(
        `${relative}:${index + 1} hardcoded first-five fixture index in real portal page: ${line.trim()}`,
      );
    }
    if (/\bhealthy_supply\b/.test(line) && /Low media risk/i.test(line)) {
      failures.push(
        `${relative}:${index + 1} healthy media supply is mislabeled as low risk: ${line.trim()}`,
      );
    }
    if (
      /\bdemo-[a-e]\b/.test(line) &&
      !hasRealPortalMode &&
      !/DEMO|SHOWCASE_ID|benchmark|fixture|sample/i.test(line)
    ) {
      failures.push(
        `${relative}:${index + 1} demo client id appears in real portal page without RealPortalDataMode gating: ${line.trim()}`,
      );
    }

    if (/from ["']@\/data\/demo\//.test(line) && !hasRealPortalMode) {
      failures.push(
        `${relative}:${index + 1} imports public demo fixture data without RealPortalDataMode gating: ${line.trim()}`,
      );
    }
    if (
      /from ["']@\/domain\/clientPortalJourney/.test(line) &&
      /firstFive/i.test(pageText) &&
      !/LaunchReadinessBenchmark|Not active client data|firstFive/i.test(
        pageText,
      )
    ) {
      failures.push(
        `${relative}:${index + 1} may use First-5 benchmark data without clear benchmark labeling: ${line.trim()}`,
      );
    }
    if (
      /href=\{?["']\/demo\/client/.test(line) &&
      !/public|sales|demoSafeClientHref/i.test(line)
    ) {
      failures.push(
        `${relative}:${index + 1} real portal page links directly to demo client route: ${line.trim()}`,
      );
    }
    for (const name of demoRestaurantNames) {
      if (
        line.includes(name) &&
        !/DEMO_SEED_INPUTS|DEMO_SEED|Launch readiness benchmark|Not active client data|Used to validate first 5 client scenarios/i.test(
          line,
        )
      ) {
        failures.push(
          `${relative}:${index + 1} demo restaurant name appears in real portal page: ${line.trim()}`,
        );
      }
    }
  });
}

const firstFiveSource = readFileSync(
  join(
    root,
    "artifacts/veroxa/src/domain/clientPortalJourney/firstFiveReadiness.ts",
  ),
  "utf8",
);
if (/healthy_supply[\s\S]{0,120}Low media risk/.test(firstFiveSource)) {
  failures.push(
    "First-5 healthy_supply must display as Healthy supply / Media healthy, not Low media risk.",
  );
}

const publicClientGuaranteeClaims: Array<[RegExp, string]> = [
  [/3[–-]5 customers/i, "public/client customer guarantee language"],
  [/guaranteed orders/i, "public/client guarantee language"],
  [/guaranteed profit/i, "public/client guarantee language"],
  [/guaranteed ROI/i, "public/client guarantee language"],
  [/guaranteed customers/i, "public/client guarantee language"],
  [/guaranteed walk-ins/i, "public/client guarantee language"],
  [/guaranteed revenue/i, "public/client guarantee language"],
  [
    /10 orders\/day|15 orders\/day|20 orders\/day|50 orders\/day/i,
    "public/client exact order target language",
  ],
  [/we make restaurants profitable/i, "public/client profit promise language"],
  [/we guarantee rankings/i, "public/client ranking guarantee language"],
];

for (const file of walk("artifacts/veroxa/src/pages")) {
  const relative = rel(file);
  const pageName = relative.split("/").pop() ?? "";
  if (pageName.startsWith("team-")) continue;
  const text = readFileSync(file, "utf8");
  text.split(/\r?\n/).forEach((line, index) => {
    if (isExemptContext(relative, line)) return;
    for (const [pattern, label] of publicClientGuaranteeClaims) {
      if (pattern.test(line)) {
        failures.push(`${relative}:${index + 1} ${label}: ${line.trim()}`);
      }
    }
  });
}

const pricing = readFileSync(
  join(root, "artifacts/veroxa/src/data/pricing/veroxaPricing.ts"),
  "utf8",
);
for (const required of [
  "Starter is capped at up to 3 posts/week",
  "Premium is capped at up to 1 post/day",
  "Growth is differentiated",
  "Premium adds ads management readiness/support",
  "AD_SPEND_DISCLAIMER",
  "SERVICE_BOUNDARY_DISCLAIMER",
]) {
  if (!pricing.includes(required))
    failures.push(`veroxaPricing.ts missing business-rule marker: ${required}`);
}

const saasScaffold = readFileSync(
  join(root, "artifacts/veroxa/src/domain/saas/repositoryProvider.ts"),
  "utf8",
);
for (const marker of [
  "createSaasRepositoryBundle",
  "placeholder repository",
  "demo repository",
]) {
  if (!saasScaffold.includes(marker))
    failures.push(`Phase 1 SaaS scaffold marker missing: ${marker}`);
}

if (failures.length) {
  console.error("Business guardrail check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(
    "\nExemptions: historical/deprecated/legacy/retired/internal-only lines are allowed; active public/client/team code is not.",
  );
  process.exit(1);
}

console.log(
  "Business guardrail check passed: active surfaces preserve pricing, service-boundary, and route-role rules.",
);
