import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures: string[] = [];

function readRequired(file: string): string {
  const fullPath = join(root, file);
  if (!existsSync(fullPath)) {
    failures.push(`Missing required repository file: ${file}`);
    return "";
  }
  return readFileSync(fullPath, "utf8");
}

const contracts = readRequired("artifacts/veroxa/src/domain/saas/repositoryContracts.ts");
const adapters = readRequired("artifacts/veroxa/src/domain/saas/repositoryAdapters.ts");
const provider = readRequired("artifacts/veroxa/src/domain/saas/repositoryProvider.ts");
const docs = [
  "artifacts/veroxa/docs/CLIENT_PORTAL_FULL_SAAS_FOUNDATION_DESIGN.md",
  "artifacts/veroxa/docs/SAAS_PERSISTENCE_MODEL.md",
  "artifacts/veroxa/docs/SAAS_ROUTE_DATA_BOUNDARY_PLAN.md",
].map(readRequired).join("\n");
const combined = `${contracts}\n${adapters}\n${provider}\n${docs}`;

for (const marker of [
  "interface RestaurantRepository",
  "interface ActivityLogRepository",
  "interface ClientPortalRepository",
  "interface TeamPortalRepository",
]) {
  if (!contracts.includes(marker)) failures.push(`repositoryContracts.ts missing ${marker}`);
}

for (const marker of [
  "createPlaceholderClientPortalRepository",
  "createPlaceholderTeamPortalRepository",
  "createNoopActivityLogRepository",
  "createDemoClientPortalRepository",
  "createDemoTeamPortalRepository",
  "createDemoActivityLogRepository",
]) {
  if (!adapters.includes(marker)) failures.push(`repositoryAdapters.ts missing ${marker}`);
}

if (!provider.includes("createSaasRepositoryBundle")) {
  failures.push("repositoryProvider.ts missing createSaasRepositoryBundle.");
}

if (/create(?:Supabase|Database|Db|Prisma|Drizzle).*Repository/.test(combined) && !/future-only|unused|requires RR approval/i.test(combined)) {
  failures.push("Production DB adapter appears without future-only unused labeling.");
}

for (const phrase of [
  "production persistence",
  "future production adapter requires RR approval",
  "placeholder repository",
  "demo repository",
]) {
  if (!new RegExp(phrase, "i").test(combined)) failures.push(`Repository contracts/docs missing future-only marker: ${phrase}`);
}

if (failures.length > 0) {
  console.error("Repository contracts check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Repository contracts check passed: interfaces, placeholder/demo adapters, provider, and future-only persistence markers are present.");
