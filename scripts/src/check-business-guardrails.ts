import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const scanRoots = [
  "artifacts/veroxa/src",
  "AGENTS.md",
  "artifacts/veroxa/docs/PRICING_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/PUBLIC_PRICING_AND_SERVICES.md",
  "artifacts/veroxa/docs/VEROXA_OS_LOCKED_MODEL.md",
  "artifacts/veroxa/docs/FIRST_5_LAUNCH_READINESS_AND_GUARDRAILS.md",
  "artifacts/veroxa/docs/FIRST_5_QA_READINESS_CHECKLIST.md",
];
const ignoredPathParts = ["/dist/", "/node_modules/", "/.git/", "scripts/src/check-business-guardrails.ts"];
const sourceExtensions = new Set([".ts", ".tsx", ".md"]);

const failures: string[] = [];

function walk(path: string): string[] {
  const full = join(root, path);
  const stat = statSync(full);
  if (stat.isFile()) return [full];
  const out: string[] = [];
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    const child = join(full, entry.name);
    if (ignoredPathParts.some((part) => child.includes(part))) continue;
    if (entry.isDirectory()) out.push(...walk(child.slice(root.length + 1)));
    else if (sourceExtensions.has(extname(entry.name))) out.push(child);
  }
  return out;
}

function rel(fullPath: string): string {
  return fullPath.startsWith(root) ? fullPath.slice(root.length + 1) : fullPath;
}

function isExemptContext(file: string, line: string): boolean {
  if (/sql_drafts|migration|MIGRATION_|CODEX_PRICING_CLEANUP_BRIEF|BUILD_STATUS|CURRENT_REPLIT_BUILD_STATUS/i.test(file)) return true;
  return /deprecated|historical|history|legacy|retired|inactive|internal-only|compatibility alias|must not|do not|never|forbidden|guardrail|denylist|not current|not active/i.test(line);
}

const forbiddenCopy: Array<[RegExp, string]> = [
  [/\b2 posts per day\b/i, "forbidden posting volume"],
  [/\btwo posts per day\b/i, "forbidden posting volume"],
  [/up to 2 content posts/i, "forbidden posting volume"],
  [/\b2 content posts\b/i, "forbidden posting volume"],
  [/unlimited posting/i, "forbidden posting volume"],
  [/Veroxa handles DMs/i, "forbidden service-boundary claim"],
  [/Veroxa replies to comments/i, "forbidden service-boundary claim"],
  [/Veroxa handles refunds/i, "forbidden service-boundary claim"],
  [/Veroxa handles complaints/i, "forbidden service-boundary claim"],
  [/Veroxa handles order questions/i, "forbidden service-boundary claim"],
  [/Veroxa provides customer service/i, "forbidden service-boundary claim"],
  [/Veroxa manages live customer conversations/i, "forbidden service-boundary claim"],
  [/\/demo\/team/i, "inactive team demo route"],
  [/\/demo\/operator/i, "inactive operator demo route"],
  [/\/demo\/owner/i, "inactive owner demo route"],
  [/Super Admin/i, "inactive role"],
];

for (const file of scanRoots.flatMap(walk)) {
  const relative = rel(file);
  const text = readFileSync(file, "utf8");
  text.split(/\r?\n/).forEach((line, index) => {
    if (isExemptContext(relative, line)) return;
    for (const [pattern, label] of forbiddenCopy) {
      if (pattern.test(line)) failures.push(`${relative}:${index + 1} ${label}: ${line.trim()}`);
    }

    if (/Complete Online Presence|Google Optimization|Complete Plus Ads|Ads Management Only/i.test(line)) {
      const isActivePublicPricing = /price|\$497|\$697|\$997|current public|active public|plan card|publicVisible:\s*true/i.test(line);
      const isCurrentGoogleService = /Google Optimization included|Google optimization included|Google Business Profile|Google Maps/i.test(line);
      if (isActivePublicPricing && !isCurrentGoogleService && !isExemptContext(relative, line)) {
        failures.push(`${relative}:${index + 1} retired package appears active: ${line.trim()}`);
      }
    }
  });
}


const appSource = readFileSync(join(root, "artifacts/veroxa/src/App.tsx"), "utf8");

function assertRouteBoundary(prefix: "client" | "team") {
  const routePattern = new RegExp(`<Route path=["']/${prefix}/[^"']+["']>([\\s\\S]*?)</Route>`, "g");
  let match: RegExpExecArray | null;
  while ((match = routePattern.exec(appSource)) !== null) {
    const routeBlock = match[0];
    if (!routeBlock.includes(`RealPortalDataBoundary portal="${prefix}"`)) {
      failures.push(`App.tsx real /${prefix} route is missing RealPortalDataBoundary: ${routeBlock.split("\n")[0].trim()}`);
    }
  }
}

assertRouteBoundary("client");
assertRouteBoundary("team");

for (const file of walk("artifacts/veroxa/src/pages")) {
  const relative = rel(file);
  if (!/artifacts\/veroxa\/src\/pages\/(client-|team-)/.test(relative)) continue;
  const text = readFileSync(file, "utf8");
  text.split(/\r?\n/).forEach((line, index) => {
    if (/getFirstFiveClientPortalViewModels\(\)\s*\[\d+\]/.test(line)) {
      failures.push(`${relative}:${index + 1} hardcoded first-five fixture index in real portal page: ${line.trim()}`);
    }
  });
}

const pricing = readFileSync(join(root, "artifacts/veroxa/src/data/pricing/veroxaPricing.ts"), "utf8");
for (const required of [
  "All active plans are capped at max 1 post/day",
  "Premium adds ads management readiness/support",
  "AD_SPEND_DISCLAIMER",
  "SERVICE_BOUNDARY_DISCLAIMER",
]) {
  if (!pricing.includes(required)) failures.push(`veroxaPricing.ts missing business-rule marker: ${required}`);
}

if (failures.length) {
  console.error("Business guardrail check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error("\nExemptions: historical/deprecated/legacy/retired/internal-only lines are allowed; active public/client/team code is not.");
  process.exit(1);
}

console.log("Business guardrail check passed: active surfaces preserve pricing, service-boundary, and route-role rules.");
