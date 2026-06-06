import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const failures: string[] = [];
const read = (path: string) => readFileSync(join(root, path), "utf8");

const clientDataHookPath = "artifacts/veroxa/src/hooks/useClientPortalData.ts";
const clientDataHook = read(clientDataHookPath);
const bannedDemoFixtureMarkers = [
  "demoGoogleMetrics",
  "DEMO_MONTHLY_PREVIEW",
  "DEMO_WEEKLY_UPDATE",
];

function requireMarker(marker: string) {
  if (!clientDataHook.includes(marker)) {
    failures.push(`${clientDataHookPath} missing required marker: ${marker}`);
  }
}

requireMarker("ZERO_GOOGLE_METRICS");
requireMarker("LIVE_WEEKLY_UPDATE_EMPTY");
requireMarker("LIVE_MONTHLY_PREVIEW_EMPTY");
requireMarker("isReadOnlyLive: true");

const liveBlockStart = clientDataHook.indexOf("isReadOnlyLive: true");
const liveBlockEnd = clientDataHook.indexOf("} catch (err)", liveBlockStart);
if (liveBlockStart < 0 || liveBlockEnd < liveBlockStart) {
  failures.push("Could not locate the authenticated/live client portal setState block.");
} else {
  const liveBlock = clientDataHook.slice(liveBlockStart, liveBlockEnd);
  for (const marker of bannedDemoFixtureMarkers) {
    if (liveBlock.includes(marker)) {
      failures.push(`Authenticated/live client portal data block must not reference ${marker}.`);
    }
  }
  if (!liveBlock.includes("googleMetrics: ZERO_GOOGLE_METRICS")) {
    failures.push("Authenticated/live client portal data block must use ZERO_GOOGLE_METRICS until client-safe metrics exist.");
  }
  if (!liveBlock.includes("weeklyUpdate") || !liveBlock.includes("monthlyReportPreview")) {
    failures.push("Authenticated/live client portal data block must keep weekly/monthly fields explicit.");
  }
}

const e2ePath = "artifacts/veroxa/e2e/route-auth-data-boundary.e2e.ts";
const e2e = read(e2ePath);
for (const marker of bannedDemoFixtureMarkers) {
  if (!e2e.includes(marker)) {
    failures.push(`${e2ePath} must assert against live-data ${marker} leakage.`);
  }
}

if (failures.length > 0) {
  console.error("Live-data demo fixture boundary check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Live-data demo fixture boundary check passed.");
