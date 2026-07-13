import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const data = read("artifacts/veroxa-sites/app/momo-data.ts");
const ui = read("artifacts/veroxa-sites/app/momo-operating-center.tsx");
const combined = `${data}\n${ui}`;
const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

const forbidden = [
  '"team_verified"',
  '"restaurant_name"',
  '"street_address"',
  '"dietary_halal_claims"',
  'value="google_business_profile"',
  '"content_variants"',
  '"owner_content_approval"',
  '"team_content_approval"',
  '"manual_follow_up"',
  '"media_review"',
  'value="owner_confirmation"',
  '"content_review"',
  '"connection_check"',
  '"needs_better_version"',
  'status: "scheduled"',
  "RLS protected",
  'source: "owner", is_current: true',
  'approvalKind: item.requires_owner_confirmation ? "owner_confirmation" : "team_review"',
];
for (const literal of forbidden) {
  must(!combined.includes(literal), `Sites Momo source contains stale/unsafe literal: ${literal}`);
}

for (const marker of [
  '["identity.display_name", "identity"',
  '["address.primary", "address"',
  '["phone.primary", "phone"',
  '["hours.regular", "hours"',
  '["menu.primary", "menu"',
  '["services.active", "services"',
  '["claims.halal", "claims"',
  '["brand.voice", "brand"',
  '["goals.primary", "goals"',
  'item.status === "owner_confirmed"',
  'option value="google_business"',
  'prepareMomoAiJob(restaurantId, "platform_variants"',
  'role === "team" && approval.status === "pending"',
]) {
  must(ui.includes(marker), `Sites UI is not aligned to the operating schema: ${marker}`);
}

for (const marker of [
  "usageScope: string[]",
  "usage_scope: input.usageScope",
  'safety_flags: ["live_provider_not_connected", "human_review_required"]',
  'status: "pending"',
  "created_by: user.id",
  'rpc("veroxa_momo_client_snapshot_v1"',
  'rpc("veroxa_review_momo_media_v1"',
  'rpc("veroxa_apply_approval_v1"',
  'if (role === "client")',
  "source: String(item.source)",
  "if (item.reviewStatus)",
  "pendingContentConfirmations",
  "submitMomoContentConfirmation",
  '.select("asset_id, tag_id").single()',
]) {
  must(data.includes(marker), `Sites data adapter missing a required write contract: ${marker}`);
}

for (const marker of [
  "submitMomoContentConfirmation",
  "data.pendingContentConfirmations",
  'subjectType: "content_item", subjectId: item.id, approvalKind: "team_review"',
  'subjectType: "content_variant", subjectId: variant.id, approvalKind: "team_review"',
]) {
  must(ui.includes(marker), `Sites UI is missing an executable confirmation/approval path: ${marker}`);
}
for (const scope of ["instagram", "facebook", "google_business", "website", "internal"]) {
  must(ui.includes(`[\"${scope}\"`) || ui.includes(`\"${scope}\",`), `Media usage scope option missing: ${scope}`);
}

function functionBody(name: string, nextName: string): string {
  const start = data.indexOf(`export async function ${name}`);
  const end = data.indexOf(`export async function ${nextName}`, start + 1);
  return start >= 0 ? data.slice(start, end >= 0 ? end : data.length) : "";
}

for (const [name, nextName] of [
  ["createMomoContentStrategy", "createMomoContentDraft"],
  ["createMomoContentDraft", "createMomoPlatformVariant"],
  ["scheduleMomoVariant", "queueMomoPublication"],
  ["createMomoWorkItem", "retryMomoWorkItem"],
] as const) {
  const body = functionBody(name, nextName);
  must(Boolean(body), `Sites data adapter function is missing: ${name}`);
  must(body.includes("created_by: user.id"), `${name} must persist the authenticated creator`);
}

for (const marker of [
  'status: input.status',
  'status: "pending"',
  'status: "queued"',
]) {
  must(data.includes(marker), `Sites write status contract missing: ${marker}`);
}

if (failures.length) {
  console.error(
    "Sites Momo operating contract failed:\n" +
      failures.map((failure) => `- ${failure}`).join("\n"),
  );
  process.exit(1);
}

console.log("Sites Momo operating contract passed.");
