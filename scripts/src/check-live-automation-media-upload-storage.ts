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
const migration = requireFile("supabase/archive/legacy_unapplied_migrations/20260615010200_media_upload_storage_foundation.sql");
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

const pathRegexMarkers = [
  "is_safe_restaurant_media_storage_path",
  "restaurant_id_from_media_storage_path",
  "^restaurants/",
  "/uploads/[0-9]{4}/(0[1-9]|1[0-2])/",
  "\\.(jpg|jpeg|png|webp|heic|heif|mp4|mov|webm)$",
  "split_part(object_name, '/', 2)::uuid",
];
for (const marker of pathRegexMarkers) if (!migration.includes(marker)) failures.push(`Storage path hardening missing marker: ${marker}`);
for (const rawPath of ["uploads/menu.jpg", "raw-file-name.png", "anything/else/file.jpg"]) if (migration.includes(rawPath)) failures.push(`Migration must not allow raw/broad path example: ${rawPath}`);
for (const policyName of ["restaurant_media_client_insert_own_restaurant", "restaurant_media_client_select_own_restaurant", "restaurant_media_team_select"]) {
  const policyIndex = migration.indexOf(`create policy ${policyName}`);
  const policyBody = policyIndex >= 0 ? migration.slice(policyIndex, migration.indexOf("create policy", policyIndex + 20) >= 0 ? migration.indexOf("create policy", policyIndex + 20) : migration.length) : "";
  if (!policyBody.includes("public.is_safe_restaurant_media_storage_path(name)")) failures.push(`${policyName} must call safe path helper.`);
}
const mediaInsertPolicy = migration.slice(migration.indexOf("create policy media_assets_client_insert_uploaded_only"));
for (const marker of [
  "status = 'uploaded'",
  "file_url is null",
  "ai_summary is null",
  "veroxa_notes is null",
  "file_type is not null",
  "mime_type is not null",
  "file_size is not null",
  "file_size > 0",
  "file_size <= 26214400",
  "file_size <= 104857600",
  "mime_type in ('image/jpeg','image/png','image/webp','image/heic','image/heif')",
  "mime_type in ('video/mp4','video/quicktime','video/webm')",
  "file_type = 'image'",
  "file_type = 'video'",
  "public.is_safe_restaurant_media_storage_path(storage_path)",
  "restaurant_id = public.restaurant_id_from_media_storage_path(storage_path)",
]) if (!mediaInsertPolicy.includes(marker)) failures.push(`media_assets insert hardening missing marker: ${marker}`);
for (const constraint of ["media_assets_storage_path_safe_shape", "media_assets_restaurant_matches_storage_path", "media_assets_file_metadata_valid"]) if (!migration.includes(constraint)) failures.push(`Missing DB constraint: ${constraint}`);
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
