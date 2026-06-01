import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "..");
const failures: string[] = [];
const source = readFileSync(
  join(root, "artifacts/veroxa/src/lib/clientMediaLifecycle.ts"),
  "utf8",
);

const required = [
  "Uploaded",
  "Reviewed",
  "Ready",
  "Scheduled",
  "Posted",
  "Needs better media",
  "Saved for later",
  "Waiting for direction",
  "Not usable",
  "Already used",
];

const missing = required.filter((label) => !source.includes(`"${label}"`));
if (missing.length > 0) {
  failures.push(`Missing client media lifecycle labels: ${missing.join(", ")}`);
}

const clientMediaSource = readFileSync(join(root, "artifacts/veroxa/src/pages/client-media.tsx"), "utf8");
for (const forbidden of ["Uploaded. Veroxa has your media", "uploaded successfully", "upload successful"]) {
  if (clientMediaSource.toLowerCase().includes(forbidden.toLowerCase())) {
    failures.push(`Client media upload copy overpromises storage/persistence: ${forbidden}`);
  }
}
if (!clientMediaSource.includes("No file storage is connected yet")) {
  failures.push("Client media page must clearly avoid implying cloud file storage is connected.");
}
if (!clientMediaSource.includes("buildClientSubmissionKey") || !clientMediaSource.includes("duplicate-skipped")) {
  failures.push("Client media dev write path must include simple duplicate retry protection.");
}

if (failures.length > 0) {
  console.error("Media lifecycle guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Media lifecycle labels verified.");
