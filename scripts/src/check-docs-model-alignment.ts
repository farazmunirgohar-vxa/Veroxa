import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const currentDocs = [
  "AGENTS.md",
  "artifacts/veroxa/docs/CURRENT_TWO_ROLE_OPERATING_MODEL.md",
  "artifacts/veroxa/docs/PRODUCTION_LAUNCH_RUNBOOK.md",
  "artifacts/veroxa/docs/CURRENT_REPLIT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/BUILD_STATUS.md",
  "artifacts/veroxa/docs/CURRENT_REAL_VEROXA_MODEL.md",
];

const controlDocs = [
  "artifacts/veroxa/docs/VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md",
  "artifacts/veroxa/docs/VEROXA_ROUTE_SURFACE_MAP.md",
  "artifacts/veroxa/docs/FIRST_CLIENT_SIMULATION_POLICY.md",
  "artifacts/veroxa/docs/MANUAL_BROWSER_SMOKE_CHECKLIST.md",
];

type Rule = {
  label: string;
  pattern: RegExp;
};

const dangerousCurrentStateRules: Rule[] = [
  {
    label: "/client/* marked unprotected",
    pattern: /\/client\/\* is not yet protected/i,
  },
  {
    label: "/client/* marked unprotected",
    pattern: /\/client\/\* is not protected/i,
  },
  {
    label: "owner/operator alpha stage revived",
    pattern: /owner\s*\/\s*operator alpha/i,
  },
  {
    label: "owner/operator-only active stage revived",
    pattern: /owner and operator only/i,
  },
  {
    label: "Owner dashboard marked active",
    pattern: /Owner dashboard is active/i,
  },
  {
    label: "Operator dashboard marked active",
    pattern: /Operator dashboard is active/i,
  },
  {
    label: "production auth marked complete",
    pattern: /production auth is complete/i,
  },
  { label: "live AI marked connected", pattern: /live AI is connected/i },
  { label: "OpenAI calls marked live", pattern: /OpenAI calls are live/i },
  {
    label: "storage uploads marked connected",
    pattern: /storage uploads are connected/i,
  },
  { label: "publishing marked connected", pattern: /publishing is connected/i },
  { label: "payments marked connected", pattern: /payments are connected/i },
  { label: "ad spend marked included", pattern: /ad spend is included/i },
  { label: "contracts marked required", pattern: /contracts are required/i },
];

const pricingContradictionRules: Rule[] = [
  {
    label: "Starter public price does not match $295",
    pattern:
      /\bStarter\b(?:(?!\bGrowth\b|\bPremium\b).){0,80}\$(?!295\b)\d[\d,]*(?:\/month|\/mo|\s*per month|\s*monthly)?/i,
  },
  {
    label: "Growth public price does not match $495",
    pattern:
      /\bGrowth\b(?:(?!\bStarter\b|\bPremium\b).){0,80}\$(?!495\b)\d[\d,]*(?:\/month|\/mo|\s*per month|\s*monthly)?/i,
  },
  {
    label: "Premium public price does not match $995",
    pattern:
      /\bPremium\b(?:(?!\bStarter\b|\bGrowth\b).){0,80}\$(?!995\b)\d[\d,]*(?:\/month|\/mo|\s*per month|\s*monthly)?/i,
  },
];

const requiredCurrentMarkers: Rule[] = [
  {
    label: "Starter $295 marker",
    pattern: /Starter[^\n]*(?:\$295|295\/month|295\/mo)/i,
  },
  {
    label: "Growth $495 marker",
    pattern: /Growth[^\n]*(?:\$495|495\/month|495\/mo)/i,
  },
  {
    label: "Premium $995 marker",
    pattern: /Premium[^\n]*(?:\$995|995\/month|995\/mo)/i,
  },
];

function isClearlyHistoricalOrDeprecated(line: string): boolean {
  return /historical|history|deprecated|retired|legacy|not current|do not use|must not appear as active/i.test(
    line,
  );
}

function isFutureOrGatedPlanningLine(line: string): boolean {
  return /future|gated|not active|parked|planned|pending|not enabled|not wired|not connected|no production auth|before this stage|must be reviewed|requires.*approval/i.test(
    line,
  );
}

const failures: string[] = [];

function requireFile(file: string): string {
  const fullPath = join(root, file);
  if (!existsSync(fullPath)) {
    failures.push(`Required documentation file is missing: ${file}`);
    return "";
  }

  return readFileSync(fullPath, "utf8");
}

function requireText(file: string, text: string, label: string): void {
  const content = requireFile(file);
  if (!content.includes(text)) {
    failures.push(`${file} is missing required marker: ${label}`);
  }
}

for (const file of [...currentDocs, ...controlDocs]) {
  const fullPath = join(root, file);
  const text = readFileSync(fullPath, "utf8");
  let inHistoricalSection = false;

  text.split(/\r?\n/).forEach((line, index) => {
    if (/^#{1,6}\s/.test(line)) {
      inHistoricalSection = isClearlyHistoricalOrDeprecated(line);
    }

    const contextAllowsPlanning =
      inHistoricalSection ||
      isClearlyHistoricalOrDeprecated(line) ||
      isFutureOrGatedPlanningLine(line) ||
      /\$295\s*\/\s*\$495\s*\/\s*\$995/.test(line);

    for (const rule of dangerousCurrentStateRules) {
      if (rule.pattern.test(line)) {
        failures.push(`${file}:${index + 1} ${rule.label}: ${line.trim()}`);
      }
    }

    for (const rule of pricingContradictionRules) {
      if (rule.pattern.test(line) && !contextAllowsPlanning) {
        failures.push(`${file}:${index + 1} ${rule.label}: ${line.trim()}`);
      }
    }
  });
}

const combinedDocs = currentDocs.map((file) => requireFile(file)).join("\n");

for (const required of [
  "Profit Fit Layer",
  "requiredDailyOrders = monthlyFee / netMargin / averageTicket / 30",
  "online-influenced orders/actions",
  "break-even progress",
  "attribution confidence",
  "internal only",
  "not public/client-facing guarantee",
]) {
  if (!new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(combinedDocs)) {
    failures.push(`Profit Fit Layer is documented marker missing: ${required}`);
  }
}

for (const marker of requiredCurrentMarkers) {
  if (!marker.pattern.test(combinedDocs)) {
    failures.push(
      `Current docs are missing required pricing marker: ${marker.label}`,
    );
  }
}

const twoRoleDoc = requireFile(
  "artifacts/veroxa/docs/CURRENT_TWO_ROLE_OPERATING_MODEL.md",
);
for (const required of [
  "ClientPortalGuard",
  "RealPortalDataBoundary",
  'InternalDemoGuard role="team"',
  "AUTH_MODE",
  "placeholder preview",
]) {
  if (!twoRoleDoc.includes(required)) {
    failures.push(
      `CURRENT_TWO_ROLE_OPERATING_MODEL.md is missing current guard/auth marker: ${required}`,
    );
  }
}

const runbook = requireFile(
  "artifacts/veroxa/docs/PRODUCTION_LAUNCH_RUNBOOK.md",
);
if (!runbook.includes("Stage 1 — Team/Internal Admin alpha")) {
  failures.push(
    "Production launch runbook must name Stage 1 as Team/Internal Admin alpha.",
  );
}
const stage1Block =
  runbook.match(/## Stage 1[\s\S]*?(?=## Stage 2)/)?.[0] ?? "";
if (/Real auth[^\n]*(?:owner|operator)/i.test(stage1Block)) {
  failures.push(
    "Production launch runbook Stage 1 appears to revive Owner/Operator auth/workflows.",
  );
}

const buildMapFile =
  "artifacts/veroxa/docs/VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md";
const routeSurfaceMapFile = "artifacts/veroxa/docs/VEROXA_ROUTE_SURFACE_MAP.md";
const firstClientSimulationFile =
  "artifacts/veroxa/docs/FIRST_CLIENT_SIMULATION_POLICY.md";
const manualSmokeFile =
  "artifacts/veroxa/docs/MANUAL_BROWSER_SMOKE_CHECKLIST.md";

for (const requiredPhase of [
  "Phase 1 — Control Tower + QA Foundation",
  "Phase 2 — Public Website + Free Audit Readiness",
  "Phase 3 — Client Portal Pre-Live Completion",
  "Phase 4 — Team Portal + Internal Workflow Completion",
  "Phase 5 — Rule-Based Automation + Manual Execution Launch Gate",
]) {
  requireText(buildMapFile, requiredPhase, requiredPhase);
}
requireText(buildMapFile, "## Hard Blocked Work", "Hard Blocked Work section");
requireFile(routeSurfaceMapFile);
requireFile(firstClientSimulationFile);
requireText(manualSmokeFile, "## Mobile QA", "Mobile QA section");

const activeClaimRules: Rule[] = [
  {
    label: "Live AI marked active",
    pattern:
      /\blive AI\b[^\n]*(?:active|enabled|connected|available|implemented)/i,
  },
  {
    label: "Live storage marked active",
    pattern:
      /\blive storage\b[^\n]*(?:active|enabled|connected|available|implemented)/i,
  },
  {
    label: "Live publishing marked active",
    pattern:
      /\blive publishing\b[^\n]*(?:active|enabled|connected|available|implemented)/i,
  },
  {
    label: "Live payments marked active",
    pattern:
      /\blive payments\b[^\n]*(?:active|enabled|connected|available|implemented)/i,
  },
  {
    label: "Production auth marked active",
    pattern:
      /\bproduction auth\b[^\n]*(?:active|enabled|connected|complete|implemented|live)/i,
  },
  {
    label: "Owner role marked active",
    pattern: /\bOwner\b[^\n]*(?:active|enabled|current runtime|real runtime)/,
  },
  {
    label: "Operator role marked active",
    pattern:
      /\bOperator\b[^\n]*(?:active|enabled|current runtime|real runtime)/,
  },
];

for (const file of [...currentDocs, ...controlDocs]) {
  const text = requireFile(file);
  let inHistoricalSection = false;

  text.split(/\r?\n/).forEach((line, index) => {
    if (/^#{1,6}\s/.test(line)) {
      inHistoricalSection = isClearlyHistoricalOrDeprecated(line);
    }

    const contextAllowsPlanning =
      inHistoricalSection ||
      isClearlyHistoricalOrDeprecated(line) ||
      isFutureOrGatedPlanningLine(line) ||
      /blocked|forbidden|not allowed|no live|does not|must not|parked|inactive|restricted|future integration|removed from active|hidden from all active|not proof/i.test(
        line,
      );

    for (const rule of activeClaimRules) {
      if (rule.pattern.test(line) && !contextAllowsPlanning) {
        failures.push(`${file}:${index + 1} ${rule.label}: ${line.trim()}`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error(
    "Docs/model alignment guardrail failed:\n" +
      failures.map((failure) => `- ${failure}`).join("\n"),
  );
  process.exit(1);
}

console.log(
  "Docs/model alignment guardrail passed: current docs match the two-role guarded placeholder-auth model.",
);
