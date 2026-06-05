import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures: string[] = [];
const publicClientGuaranteePatterns: Array<[RegExp, string]> = [
  [/(?:10|15|20|50)\s+orders\/day/i, "exact order target"],
  [/guaranteed\s+orders/i, "order guarantee"],
  [/guaranteed\s+profit/i, "profit guarantee"],
  [/guaranteed\s+ROI/i, "ROI guarantee"],
  [/guaranteed\s+customers/i, "customer guarantee"],
  [/guaranteed\s+revenue/i, "revenue guarantee"],
  [/guaranteed\s+walk-ins/i, "walk-in guarantee"],
  [/we make restaurants profitable/i, "profit promise"],
];

const publicClientFiles = [
  "artifacts/veroxa/src/pages/landing.tsx",
  "artifacts/veroxa/src/pages/services.tsx",
  "artifacts/veroxa/src/pages/pricing.tsx",
  "artifacts/veroxa/src/pages/free-audit.tsx",
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
] as const;

const clientFiles = [
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/client-media.tsx",
  "artifacts/veroxa/src/pages/client-requests.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-ai-draft-preview.tsx",
  "artifacts/veroxa/src/components/client/ClientMediaTracker.tsx",
];

const internalClientTerms = [
  /approval queue/i,
  /\bAPI\b/i,
  /Supabase/i,
  /OpenAI/i,
  /backend/i,
  /dev database/i,
  /database/i,
  /raw scoring/i,
  /internal ID/i,
];
for (const file of publicClientFiles) {
  const text = readFileSync(join(root, file), "utf8");
  for (const [pattern, label] of publicClientGuaranteePatterns) {
    if (pattern.test(text)) {
      failures.push(`${file} contains blocked public/client guarantee language: ${label}`);
    }
  }
}

for (const file of clientFiles) {
  const text = readFileSync(join(root, file), "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of internalClientTerms) {
      if (pattern.test(line))
        failures.push(
          `${file}:${index + 1} client surface leaks ${pattern}: ${line.trim()}`,
        );
    }
  });
}

const fakeLiveClaims: Array<{ file: string; pattern: RegExp; label: string }> =
  [
    {
      file: "artifacts/veroxa/src/pages/client-media.tsx",
      pattern: /uploaded to (?:the )?(?:server|cloud)|stored securely/i,
      label: "fake live upload/storage claim",
    },
    {
      file: "artifacts/veroxa/src/pages/client-media.tsx",
      pattern: /live image editing|AI image editing|automatically edited/i,
      label: "fake live media editing claim",
    },
    {
      file: "artifacts/veroxa/src/pages/client-updates.tsx",
      pattern: /rankings? improved|reach increased|walk-?ins|revenue/i,
      label: "fake performance metric claim",
    },
    {
      file: "artifacts/veroxa/src/pages/client-reports.tsx",
      pattern: /rankings? improved|reach increased|walk-?ins/i,
      label: "fake report metric claim",
    },
    {
      file: "artifacts/veroxa/src/pages/client-requests.tsx",
      pattern: /comments|DMs|refunds|complaints|order issues/i,
      label: "customer-service handling implication",
    },
  ];

for (const claim of fakeLiveClaims) {
  const text = readFileSync(join(root, claim.file), "utf8");
  const allowedBoundaryEducation = claim.file.endsWith("client-requests.tsx") && text.includes("Not included at launch") && text.includes("DMs/comments/customer service");
  if (claim.pattern.test(text) && !allowedBoundaryEducation) {
    failures.push(
      `${claim.file} may contain a ${claim.label}: ${claim.pattern}`,
    );
  }
}

const mediaPath = "artifacts/veroxa/src/pages/client-media.tsx";
const media = readFileSync(join(root, mediaPath), "utf8");
const mediaDetailCardTestIds =
  media.match(/data-testid=["']card-media-detail["']/g) ?? [];
if (mediaDetailCardTestIds.length !== 1) {
  failures.push(
    `${mediaPath} must contain exactly one data-testid=\"card-media-detail\"; found ${mediaDetailCardTestIds.length}.`,
  );
}
for (const label of ["Submitted", "Prepared by Veroxa", "Included in report"]) {
  if (
    new RegExp(
      `status:\\s*["']${label}["']|<[^>]*>${label}<|${label}\\s*→`,
    ).test(media)
  ) {
    failures.push(
      `client-media.tsx must not use ${label} as a media lifecycle step.`,
    );
  }
}

const requests = readFileSync(
  join(root, "artifacts/veroxa/src/pages/client-requests.tsx"),
  "utf8",
);
for (const status of ["Received", "In Review", "Handled", "Waiting for you"]) {
  if (!requests.includes(status))
    failures.push(
      `client-requests.tsx missing client-safe request status ${status}.`,
    );
}
if (
  /ticket|approval|queue/i.test(requests.replace(/getClientWorkflowItems/g, ""))
) {
  failures.push(
    "client-requests.tsx should feel like requests, not tickets/approval queues.",
  );
}

const clientDashboard = readFileSync(
  join(root, "artifacts/veroxa/src/pages/client-dashboard.tsx"),
  "utf8",
);
if (
  /section-dashboard-quick-links|const\s+quickLinks\s*=|quickLinks\.map/.test(
    clientDashboard,
  )
) {
  failures.push(
    "client-dashboard.tsx must not render duplicate sidebar shortcut cards for Media, Updates, Requests, and Reports.",
  );
}

const teamDashboard = readFileSync(
  join(root, "artifacts/veroxa/src/pages/team-dashboard.tsx"),
  "utf8",
);
if (
  /section-dashboard-quick-links|const\s+quickLinks\s*=|quickLinks\.map/.test(
    teamDashboard,
  )
) {
  failures.push(
    "team-dashboard.tsx must not render generic duplicate sidebar shortcut cards.",
  );
}

const portalLayoutPath = "artifacts/veroxa/src/components/PortalLayout.tsx";
const portalLayout = readFileSync(join(root, portalLayoutPath), "utf8");
if (
  !portalLayout.includes("function isPortalItemRouteActive") ||
  !portalLayout.includes(
    "isRouteActive(getSafePortalHref(itemHref, location), location)",
  )
) {
  failures.push(
    `${portalLayoutPath} must route active-state checks through getSafePortalHref so /demo/client/* highlights Client Portal nav items.`,
  );
}
if (
  (portalLayout.match(/isPortalItemRouteActive\(item\.href, location\)/g) ?? [])
    .length < 2
) {
  failures.push(
    `${portalLayoutPath} must use the demo-safe active helper for both sidebar highlighting and breadcrumb active item lookup.`,
  );
}

const reports = readFileSync(
  join(root, "artifacts/veroxa/src/pages/client-reports.tsx"),
  "utf8",
);
for (const claim of [/\b\d+%\b/, /rankings? up/i, /revenue/i]) {
  if (claim.test(reports))
    failures.push(
      `client-reports.tsx may contain fake/overclaim metric language: ${claim}`,
    );
}
if (
  !reports.includes("Weekly Reports") ||
  !reports.includes("Monthly Reports")
) {
  failures.push(
    "client-reports.tsx must keep clear Weekly Reports and Monthly Reports sections.",
  );
}


const saasScaffold = readFileSync(join(root, "artifacts/veroxa/src/domain/saas/repositoryProvider.ts"), "utf8");
for (const marker of ["createSaasRepositoryBundle", "placeholder repository", "demo repository"]) {
  if (!saasScaffold.includes(marker)) failures.push(`Phase 1 SaaS scaffold marker missing: ${marker}`);
}

if (failures.length > 0) {
  console.error("Client product language guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Client product language guardrail passed: media, requests, reports, and updates stay client-safe.",
);
