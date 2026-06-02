import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const files = [
  "artifacts/veroxa/src/pages/team-dashboard.tsx",
  "artifacts/veroxa/docs/TEAM_COCKPIT_RULE.md",
];
const failures: string[] = [];
const dashboard = readFileSync(join(root, files[0]), "utf8");

for (const requiredCopy of [
  "Today's Veroxa Work",
  "Start here",
  "Today at a glance",
  "Needs review",
  "Ready to schedule",
  "Client requests",
  "Blocked / needs input",
  "Reports due",
]) {
  if (!dashboard.includes(requiredCopy)) {
    failures.push(
      `team-dashboard.tsx missing Today View copy ${requiredCopy}.`,
    );
  }
}

for (const requiredRoute of [
  "/team/approval-queue",
  "/team/visibility-audit",
  "/team/first-client-readiness",
  "/team/work-queue",
  "/team/direction-queue",
  "/team/report-queue",
]) {
  if (!dashboard.includes(requiredRoute)) {
    failures.push(
      `team-dashboard.tsx no longer links important team route ${requiredRoute}.`,
    );
  }
}

const duplicateShortcutPatterns = [
  /section-dashboard-quick-links/,
  /const\s+quickLinks\s*=/,
  /quickLinks\.map/,
  /priorityCards\.map/,
  /priority-approvals-ready/,
  /section-work-queue-summary/,
];
for (const pattern of duplicateShortcutPatterns) {
  if (pattern.test(dashboard)) {
    failures.push(
      `team-dashboard.tsx should avoid generic duplicate shortcut-card clutter (${pattern}).`,
    );
  }
}

const activeLanguage = [
  /Owner dashboard/i,
  /Operator dashboard/i,
  /Super Admin/i,
  /command center/i,
  /analytics wall/i,
  /backend console/i,
  /live AI/i,
  /live publishing/i,
  /live storage/i,
  /real client data/i,
];
for (const file of files) {
  const text = readFileSync(join(root, file), "utf8");
  text.split(/\r?\n/).forEach((line, index) => {
    for (const pattern of activeLanguage) {
      if (
        pattern.test(line) &&
        !/Avoid adding|against reintroducing|Do not turn|does not imply/i.test(
          line,
        )
      ) {
        failures.push(
          `${file}:${index + 1} should avoid cockpit drift language ${pattern}: ${line.trim()}`,
        );
      }
    }
  });
}

if (failures.length > 0) {
  console.error("Team cockpit guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Team cockpit guardrail passed: dashboard keeps a clear Today View without duplicate shortcut clutter.",
);
