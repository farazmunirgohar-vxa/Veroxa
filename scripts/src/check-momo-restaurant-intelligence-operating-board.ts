import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");
const failures: string[] = [];
const must = (condition: boolean, message: string) => { if (!condition) failures.push(message); };

const app = read("artifacts/veroxa/src/App.tsx");
const page = read("artifacts/veroxa/src/pages/team-momo-intelligence.tsx");
const model = read("artifacts/veroxa/src/lib/momoWorkspace/momoRestaurantIntelligenceBoard.ts");
const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
const roles = read("artifacts/veroxa/src/domain/users/permissions.ts") + read("artifacts/veroxa/src/lib/auth/authContract.ts");
const docs = [
  "artifacts/veroxa/docs/MOMO_RESTAURANT_INTELLIGENCE_OPERATING_BOARD.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/ROUTE_PAGE_INVENTORY.md",
  "artifacts/veroxa/docs/VEROXA_ROUTE_SURFACE_MAP.md",
].map(read).join("\n");

const routeIndex = app.indexOf('<Route path="/team/momo/intelligence">');
must(routeIndex >= 0, "/team/momo/intelligence route exists.");
const routeBlock = routeIndex >= 0 ? app.slice(routeIndex, app.indexOf("</Route>", routeIndex) + "</Route>".length) : "";
must(routeBlock.includes('<InternalDemoGuard role="team">'), "Restaurant Intelligence remains Team-only through InternalDemoGuard.");
must(routeBlock.includes('<RealPortalDataBoundary portal="team">'), "Restaurant Intelligence remains inside RealPortalDataBoundary.");
must(!app.includes('path="/client/momo/intelligence"') && !app.includes('path="/client/momo'), "No client Momo route exists.");

for (const copy of [
  "Restaurant Intelligence is internal only.",
  "No activation.",
  "No publishing.",
  "No AI generation.",
  "Business truth requires owner confirmation.",
  "Media requires usage rights.",
  "Sensitive claims remain blocked.",
  "Owner walkthrough remains blocked.",
  "Future activation requires explicit Faraz approval.",
]) must(page.includes(copy) || model.includes(copy), `Missing required safety copy: ${copy}`);

for (const href of ["/team/momo-business-truth", "/team/momo-media-content", "/team/momo-brand-ai-rules", "/team/momo-pilot-prep", "/team/momo/readiness", "/team/momo"]) {
  must(page.includes(href) || model.includes(href), `Missing allowed Restaurant Intelligence link: ${href}`);
}

for (const section of ["Restaurant Identity", "Business Truth", "Media Inventory", "Brand Voice", "Operational Readiness", "Current Risks", "Safe Next Actions"]) {
  must(page.includes(section) || model.includes(section), `Missing board section: ${section}`);
}
for (const blocked of ["Contact owner", "Publish", "Generate AI", "Activate pilot", "Connect platforms"]) {
  must(model.includes(blocked), `Missing blocked safe-next-action: ${blocked}`);
}

must(/AUTH_MODE\s*:\s*AuthMode\s*=\s*["']placeholder["']/.test(authMode), "AUTH_MODE remains placeholder.");
must(/AppRole\s*=\s*["']client["']\s*\|\s*["']team["']/.test(roles) && /VeroxaRole\s*=\s*["']client["']\s*\|\s*["']team["']/.test(roles), "Roles remain client/team only.");
must(!/(insert\(|update\(|delete\(|upsert\(|from\(|supabase|openai|generate[A-Z][A-Za-z]*\(|aiProvider|fetch\(|axios|prisma|drizzle)/i.test(model), "Model contains no DB writes, external calls, or AI generation hooks.");
must(!/(activatePilot|AUTH_MODE\s*=\s*["']real|createCredential|publishExternally|connectPlatform)/i.test(page + model), "Page/model contains no activation/auth/credential/publish/platform behavior.");

for (const marker of ["MOMO_RESTAURANT_INTELLIGENCE_OPERATING_BOARD.md", "PR #132", "no AI generation", "no fake data", "No database reads or writes", "Future activation requires explicit Faraz approval"]) {
  must(docs.includes(marker), `Docs missing Restaurant Intelligence marker: ${marker}`);
}

if (failures.length) {
  console.error("Momo Restaurant Intelligence operating board guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Momo Restaurant Intelligence operating board guardrail passed.");
