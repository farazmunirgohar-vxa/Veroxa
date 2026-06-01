import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "..");
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
  console.error(`Missing client media lifecycle labels: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Media lifecycle labels verified.");
