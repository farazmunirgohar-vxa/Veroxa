import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const checkpointPath = resolve(root, "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json");
const checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8")) as {
  schemaVersion: number;
  status: string;
  scope: { operationalRestaurant: string; otherRestaurantCapability: string; automaticProspectConversion: boolean };
  databaseMigrations: string[];
  fullReviewTriggers: string[];
  boundaryGroups: Record<string, { review: string; files: string[]; sha256: string }>;
};

function groupHash(files: string[]): string {
  const hash = createHash("sha256");
  for (const file of [...files].sort()) {
    hash.update(`${file}\0`);
    hash.update(readFileSync(resolve(root, file)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

if (checkpoint.schemaVersion !== 1 || !["candidate", "verified"].includes(checkpoint.status)) {
  throw new Error("RR checkpoint schema/status is invalid");
}
if (
  checkpoint.scope.operationalRestaurant !== "Momo's House San Antonio" ||
  checkpoint.scope.otherRestaurantCapability !== "Restaurant Audit Center only" ||
  checkpoint.scope.automaticProspectConversion !== false
) {
  throw new Error("RR checkpoint drifted from the locked Momo-only operating scope");
}
if (checkpoint.fullReviewTriggers.length < 4) throw new Error("RR checkpoint review triggers are incomplete");

const activeMigrations = readdirSync(resolve(root, "supabase/migrations"))
  .filter((name) => name.endsWith(".sql"))
  .sort();
if (JSON.stringify(activeMigrations) !== JSON.stringify([...checkpoint.databaseMigrations].sort())) {
  throw new Error("RR checkpoint migration inventory does not match the active migration chain");
}

const auth = readFileSync(resolve(root, "artifacts/veroxa-sites/app/veroxa-supabase.ts"), "utf8");
const milestone = readFileSync(resolve(root, "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md"), "utf8");
if (!auth.includes("shouldCreateUser: false") || /signInWithPassword|resetPasswordForEmail/.test(auth)) {
  throw new Error("RR checkpoint auth boundary is no longer magic-link-only/fail-closed");
}
for (const marker of [
  "Momo's House San Antonio is Veroxa's only operational client",
  "Restaurant Audit Center",
  "does not become an operational client",
]) {
  if (!milestone.includes(marker)) throw new Error(`RR checkpoint scope marker missing: ${marker}`);
}

for (const [name, group] of Object.entries(checkpoint.boundaryGroups)) {
  if (!group.files.length || !group.review) throw new Error(`RR checkpoint group is incomplete: ${name}`);
  const actual = groupHash(group.files);
  if (group.sha256 === "pending") {
    throw new Error(`RR checkpoint fingerprint is pending: ${name}`);
  }
  if (actual !== group.sha256) {
    throw new Error(`RR checkpoint boundary changed; route an exact delta review for: ${name}`);
  }
}

console.log("RR release checkpoint guardrail passed.");
