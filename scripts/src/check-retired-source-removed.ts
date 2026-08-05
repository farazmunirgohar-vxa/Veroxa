import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const absolute = (path: string) => resolve(repoRoot, path);
const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

const retiredPaths = [
  "artifacts/veroxa/src",
  "artifacts/veroxa/public",
  "artifacts/veroxa/e2e",
  "artifacts/veroxa/.replit-artifact",
  "artifacts/veroxa/.env.example",
  "artifacts/veroxa/components.json",
  "artifacts/veroxa/index.html",
  "artifacts/veroxa/package.json",
  "artifacts/veroxa/tsconfig.json",
  "artifacts/veroxa/vite.config.ts",
  "artifacts/veroxa/ARCHIVED.md",
] as const;

for (const path of retiredPaths) {
  must(!existsSync(absolute(path)), `Retired source returned: ${path}`);
}

for (const path of [
  "artifacts/veroxa/docs",
  "artifacts/veroxa/docs/RETIRED_SOURCE_REMOVAL.md",
  "artifacts/veroxa-sites/app",
  "artifacts/veroxa-sites/.openai/hosting.json",
  "supabase/migrations",
  "supabase/functions",
]) {
  must(
    existsSync(absolute(path)),
    `Required active source is missing: ${path}`,
  );
}

const veroxaEntries = readdirSync(absolute("artifacts/veroxa")).sort();
must(
  veroxaEntries.length === 1 && veroxaEntries[0] === "docs",
  `artifacts/veroxa must contain only active operating docs; found: ${veroxaEntries.join(", ")}`,
);

const cleanupRecord = readFileSync(
  absolute("artifacts/veroxa/docs/RETIRED_SOURCE_REMOVAL.md"),
  "utf8",
);
for (const marker of [
  "authorized permanent repository cleanup on 2026-08-05",
  "sole deployable Veroxa application source",
  "Immutable Git commit history",
  "performs no Sites deployment",
]) {
  must(
    cleanupRecord.includes(marker),
    `Cleanup record missing marker: ${marker}`,
  );
}

const scriptsPackagePath = absolute("scripts/package.json");
const scriptsPackageSource = readFileSync(scriptsPackagePath, "utf8");
const scriptsPackage = JSON.parse(scriptsPackageSource) as {
  scripts?: Record<string, string>;
};
const scriptNames = new Set(Object.keys(scriptsPackage.scripts ?? {}));

for (const [name, command] of Object.entries(scriptsPackage.scripts ?? {})) {
  const match = command.match(/(?:\.\/)?src\/([^\s]+\.ts)/);
  if (match) {
    must(
      existsSync(absolute(`scripts/src/${match[1]}`)),
      `Script command ${name} targets a missing file: ${match[1]}`,
    );
  }
}

const workflowFiles = readdirSync(absolute(".github/workflows"))
  .filter((name) => /\.ya?ml$/.test(name))
  .map((name) => `.github/workflows/${name}`);
const automationFiles = [
  "package.json",
  "pnpm-workspace.yaml",
  "scripts/package.json",
  ...workflowFiles,
];
for (const path of automationFiles) {
  const source = readFileSync(absolute(path), "utf8");
  for (const match of source.matchAll(
    /pnpm --filter @workspace\/scripts run ([a-z0-9:-]+)/g,
  )) {
    must(
      scriptNames.has(match[1]),
      `${path} references an undefined script command: ${match[1]}`,
    );
  }
}

const workspace = readFileSync(absolute("pnpm-workspace.yaml"), "utf8");
must(
  !workspace.includes("!artifacts/veroxa\n") &&
    !workspace.includes("!artifacts/veroxa\r\n"),
  "The removed Vite package must not remain as a workspace exclusion.",
);
must(
  workspace.includes("!artifacts/veroxa-sites"),
  "ChatGPT Sites must remain isolated from the root pnpm lifecycle.",
);

for (const path of [
  "artifacts/veroxa/docs",
  "artifacts/veroxa-sites/app",
  "supabase/migrations",
]) {
  must(
    statSync(absolute(path)).isDirectory(),
    `Required active path is not a directory: ${path}`,
  );
}

if (failures.length) {
  console.error("Retired-source removal guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Retired-source removal guardrail passed: the Vite/Replit tree is absent, active Sites/docs/Supabase source is preserved, and automation references resolve.",
);
