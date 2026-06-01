import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures: string[] = [];
const clientFiles = [
  "artifacts/veroxa/src/pages/client-media.tsx",
  "artifacts/veroxa/src/pages/client-requests.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/components/client/ClientMediaTracker.tsx",
];

const internalClientTerms = [/approval queue/i, /\bAPI\b/i, /Supabase/i, /OpenAI/i, /backend/i, /raw scoring/i, /internal ID/i];
for (const file of clientFiles) {
  const text = readFileSync(join(root, file), "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of internalClientTerms) {
      if (pattern.test(line)) failures.push(`${file}:${index + 1} client surface leaks ${pattern}: ${line.trim()}`);
    }
  });
}

const media = readFileSync(join(root, "artifacts/veroxa/src/pages/client-media.tsx"), "utf8");
for (const label of ["Submitted", "Prepared by Veroxa", "Included in report"]) {
  if (new RegExp(`status:\\s*["']${label}["']|<[^>]*>${label}<|${label}\\s*→`).test(media)) {
    failures.push(`client-media.tsx must not use ${label} as a media lifecycle step.`);
  }
}

const requests = readFileSync(join(root, "artifacts/veroxa/src/pages/client-requests.tsx"), "utf8");
for (const status of ["Received", "In Review", "Handled", "Waiting for you"]) {
  if (!requests.includes(status)) failures.push(`client-requests.tsx missing client-safe request status ${status}.`);
}
if (/ticket|approval|queue/i.test(requests.replace(/getClientWorkflowItems/g, ""))) {
  failures.push("client-requests.tsx should feel like requests, not tickets/approval queues.");
}

const reports = readFileSync(join(root, "artifacts/veroxa/src/pages/client-reports.tsx"), "utf8");
for (const claim of [/\b\d+%\b/, /guarantee/i, /rankings? up/i, /revenue/i]) {
  if (claim.test(reports)) failures.push(`client-reports.tsx may contain fake/overclaim metric language: ${claim}`);
}
if (!reports.includes("Weekly Reports") || !reports.includes("Monthly Reports")) {
  failures.push("client-reports.tsx must keep clear Weekly Reports and Monthly Reports sections.");
}

if (failures.length > 0) {
  console.error("Client product language guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Client product language guardrail passed: media, requests, reports, and updates stay client-safe.");
