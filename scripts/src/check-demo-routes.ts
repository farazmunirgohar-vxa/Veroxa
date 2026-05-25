/**
 * check-demo-routes.ts
 *
 * Lightweight parity check between App.tsx route registrations and
 * demoRoutes.ts visibility registry.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run check-demo-routes
 *
 * What it does:
 *   1. Extracts all /demo/* and /{client,team,operator,owner}/* path
 *      strings from App.tsx using a regex scan (no AST parsing).
 *   2. Collects all paths from demoRoutes.ts allDemoRoutes array via
 *      a regex scan.
 *   3. Reports:
 *      a) Paths in App.tsx not tracked in demoRoutes.ts (registry gap).
 *      b) Paths in demoRoutes.ts not in App.tsx (stale registry entry).
 *
 * This is a text-scan heuristic, not a full AST diff. It may produce
 * false positives if paths are constructed dynamically. Treat output
 * as a guide, not a hard error.
 *
 * Does NOT modify any files. Safe to run at any time.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../");

const APP_TSX      = resolve(root, "artifacts/veroxa/src/App.tsx");
const ROUTES_TS    = resolve(root, "artifacts/veroxa/src/lib/demoRoutes.ts");

// Paths intentionally in App.tsx but excluded from the demo registry
// (public/auth pages, not demo surfaces):
const APP_EXCLUSIONS = new Set([
  "/",
  "/services",
  "/pricing",
  "/login",
  "/auth-status",
  "/demo",
]);

function extractQuotedPaths(src: string, pattern: RegExp): Set<string> {
  const matches = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(src)) !== null) {
    matches.add(m[1]);
  }
  return matches;
}

const appSrc    = readFileSync(APP_TSX, "utf-8");
const routesSrc = readFileSync(ROUTES_TS, "utf-8");

// Match path="..." or path='...' in App.tsx
const appPaths = extractQuotedPaths(appSrc, /path=["']([^"']+)["']/g);

// Match path: "..." or path: '...' in demoRoutes.ts
const registryPaths = extractQuotedPaths(routesSrc, /path:\s*["']([^"']+)["']/g);

// Filter App.tsx paths to only demo + role paths
const demoPaths = new Set(
  [...appPaths].filter(
    (p) =>
      (p.startsWith("/demo/") ||
        p.startsWith("/client/") ||
        p.startsWith("/team/") ||
        p.startsWith("/operator/") ||
        p.startsWith("/owner/")) &&
      !APP_EXCLUSIONS.has(p)
  )
);

const inAppNotRegistry = [...demoPaths].filter((p) => !registryPaths.has(p)).sort();
const inRegistryNotApp = [...registryPaths]
  .filter(
    (p) =>
      !demoPaths.has(p) &&
      !APP_EXCLUSIONS.has(p) &&
      (p.startsWith("/demo/") ||
        p.startsWith("/client/") ||
        p.startsWith("/team/") ||
        p.startsWith("/operator/") ||
        p.startsWith("/owner/"))
  )
  .sort();

console.log("=== Veroxa Demo Route Parity Check ===\n");
console.log(`App.tsx demo/role paths found:   ${demoPaths.size}`);
console.log(`demoRoutes.ts paths registered:  ${registryPaths.size}`);

if (inAppNotRegistry.length === 0) {
  console.log("\n✅ No gaps — all App.tsx demo paths are tracked in demoRoutes.ts.");
} else {
  console.log(`\n⚠️  In App.tsx but NOT in demoRoutes.ts (${inAppNotRegistry.length}):`);
  inAppNotRegistry.forEach((p) => console.log(`   ${p}`));
}

if (inRegistryNotApp.length === 0) {
  console.log("\n✅ No stale entries — all demoRoutes.ts paths exist in App.tsx.");
} else {
  console.log(`\n📋 In demoRoutes.ts but NOT in App.tsx (${inRegistryNotApp.length}) — may be stale or legacy:`);
  inRegistryNotApp.forEach((p) => console.log(`   ${p}`));
}

console.log("\nDone.");
