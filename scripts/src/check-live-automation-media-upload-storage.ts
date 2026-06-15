import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures: string[] = [];
const full = (p: string) => resolve(repoRoot, p);
const read = (p: string) => readFileSync(full(p), "utf8");
const requireFile = (p: string) => { if (!existsSync(full(p))) failures.push(`Missing ${p}`); return existsSync(full(p)) ? read(p) : ""; };

const authMode = requireFile("artifacts/veroxa/src/lib/auth/authMode.ts");
const clientMedia = requireFile("artifacts/veroxa/src/pages/client-media.tsx");
const uploadPanel = requireFile("artifacts/veroxa/src/components/client/MediaUploadPanel.tsx");
const validation = requireFile("artifacts/veroxa/src/lib/media/mediaValidation.ts");
const paths = requireFile("artifacts/veroxa/src/lib/media/mediaStoragePaths.ts");
const service = requireFile("artifacts/veroxa/src/lib/media/mediaUploadService.ts");
const migration = requireFile("supabase/migrations/20260615010200_media_upload_storage_foundation.sql");
const docs = [
  "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_MEDIA_UPLOAD_STORAGE.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
  "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_ARCHITECTURE.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
].map(requireFile).join("\n");
const all = [clientMedia, uploadPanel, validation, paths, service, migration, docs].join("\n");

if (!/AUTH_MODE:\s*AuthMode\s*=\s*"placeholder"/.test(authMode)) failures.push("AUTH_MODE must remain placeholder.");
if (!/pilot-access/.test(read("artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md"))) failures.push("Current build status must preserve /api/pilot-access.");
if (!/restaurant-media/.test(migration) || !/public\s*=\s*false/.test(migration)) failures.push("Private restaurant-media bucket setup must exist.");
if (/using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)/i.test(migration)) failures.push("Storage policies must not be broad using(true) policies.");
if (!/current_user_has_active_restaurant/.test(migration) || !/current_user_is_active_team/.test(migration)) failures.push("Storage policies must scope client/team access conservatively.");
if (!/VITE_VEROXA_MEDIA_UPLOAD_ENABLED/.test(all)) failures.push("Media upload must have an explicit default-safe feature flag.");
if (!/AUTH_MODE === "real"/.test(all)) failures.push("Media upload must be gated to real auth mode.");
if (!/restaurants\/\$\{restaurantId\}\/uploads\/\$\{yyyy\}\/\$\{mm\}\/\$\{id\}\./.test(paths)) failures.push("Storage path must be restaurant-scoped with generated id.");
if (/file\.name.*storagePath|storagePath.*file\.name/.test(all)) failures.push("Raw filenames must not be used as storage keys.");
for (const marker of ["image/jpeg", "video/mp4", "maxImageBytes", "maxVideoBytes", "maxBatchCount"]) if (!validation.includes(marker)) failures.push(`Validation missing ${marker}.`);
if (!/status:\s*"uploaded"/.test(service) || /status:\s*"(approved|posted|published|ready_to_use)"/.test(service)) failures.push("Uploaded media must default to uploaded only.");
for (const forbidden of ["VITE_SUPABASE_SERVICE_ROLE_KEY", "SERVICE_ROLE", "googleapis", "openai"]) if (all.includes(forbidden)) failures.push(`Forbidden PR #102 marker found: ${forbidden}`);
const runtime = [clientMedia, uploadPanel, validation, paths, service].join("\n");
for (const forbidden of ["cron", "webhook"]) if (runtime.includes(forbidden)) failures.push(`Forbidden PR #102 runtime marker found: ${forbidden}`);
if (!/return null/.test(uploadPanel)) failures.push("Placeholder/unsafe mode must not show upload controls.");
if (!/Momo owner walkthrough remains blocked/i.test(docs)) failures.push("Docs must keep Momo walkthrough blocked.");
if (!/uploaded media is not published/i.test(docs)) failures.push("Docs must state uploaded media is not published.");

if (failures.length) { console.error("Live Automation V1 media upload/storage guardrail failed:\n" + failures.map((f) => `- ${f}`).join("\n")); process.exit(1); }
console.log("Live Automation V1 media upload/storage guardrail passed.");
