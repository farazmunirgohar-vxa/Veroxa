import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  deploymentManifestPath,
  hashTree,
  readDeploymentManifest,
  repoRoot,
  writeJson,
} from "./release-manifest";

type RrCheckpoint = {
  databaseMigrations: string[];
  boundaryGroups: Record<
    string,
    { review: string; files: string[]; sha256: string }
  >;
};

function groupHash(files: string[]): string {
  const hash = createHash("sha256");
  for (const file of [...files].sort()) {
    hash.update(`${file}\0`);
    hash.update(readFileSync(resolve(repoRoot, file)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

const manifest = readDeploymentManifest();
const source = hashTree(resolve(repoRoot, manifest.source.root), {
  exclusions: manifest.source.generatedPathExclusions,
});
const migrations = hashTree(resolve(repoRoot, manifest.migrations.root), {
  suffix: ".sql",
});
manifest.source.fileCount = source.fileCount;
manifest.source.treeSha256 = source.sha256;
manifest.migrations.fileCount = migrations.fileCount;
manifest.migrations.treeSha256 = migrations.sha256;
writeJson(deploymentManifestPath, manifest);

const rrPath = resolve(
  repoRoot,
  "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json",
);
const rr = JSON.parse(readFileSync(rrPath, "utf8")) as RrCheckpoint;
rr.databaseMigrations = readdirSync(resolve(repoRoot, "supabase/migrations"))
  .filter((name) => name.endsWith(".sql"))
  .sort();
for (const group of Object.values(rr.boundaryGroups)) {
  group.sha256 = groupHash(group.files);
}
writeJson(rrPath, rr);

console.log(
  `Refreshed release fingerprints: ${source.fileCount} Sites files, ${migrations.fileCount} migrations, and ${Object.keys(rr.boundaryGroups).length} RR boundary groups.`,
);
