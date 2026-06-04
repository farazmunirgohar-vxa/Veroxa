import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function requireIncludes(file: string, marker: string, label = marker) {
  if (!read(file).includes(marker))
    failures.push(`${file} missing marker: ${label}`);
}

function walk(path: string): string[] {
  const absolute = join(root, path);
  if (!existsSync(absolute)) return [];
  const stat = statSync(absolute);
  if (stat.isFile()) return [absolute];
  return readdirSync(absolute).flatMap((entry) => {
    if (["node_modules", "dist", "build", ".git"].includes(entry)) return [];
    const child = join(absolute, entry);
    const childStat = statSync(child);
    if (childStat.isDirectory()) return walk(relative(root, child));
    return /\.(ts|tsx)$/.test(entry) ? [child] : [];
  });
}

const manualDomain = "artifacts/veroxa/src/domain/manualExecution";
const manualPage = "artifacts/veroxa/src/pages/team-manual-execution.tsx";
const app = read("artifacts/veroxa/src/App.tsx");
const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
const pricing = read("artifacts/veroxa/src/data/pricing/veroxaPricing.ts");

for (const file of [
  "types.ts",
  "executionPackBuilder.ts",
  "manualPublishingTracker.ts",
  "clientConfirmationWorkflow.ts",
  "launchGateSignals.ts",
  "index.ts",
]) {
  if (!existsSync(join(root, manualDomain, file)))
    failures.push(`Manual execution domain file missing: ${file}`);
}

if (!existsSync(join(root, manualPage)))
  failures.push("Manual Execution Center page missing");

requireIncludes(
  "artifacts/veroxa/src/App.tsx",
  'path="/team/manual-execution"',
  "guarded team manual execution route",
);
if (
  !app.includes('path="/team/manual-execution"') ||
  !app.includes('<InternalDemoGuard role="team">') ||
  !app.includes('<RealPortalDataBoundary portal="team">') ||
  !app.includes("<TeamManualExecution />")
) {
  failures.push(
    "/team/manual-execution route must remain inside InternalDemoGuard and RealPortalDataBoundary",
  );
}
requireIncludes(
  "artifacts/veroxa/src/lib/teamPortalNav.ts",
  "Manual Execution",
  "team nav Manual Execution link",
);
requireIncludes(
  manualPage,
  "manual-copy-pack-panel",
  "copy/paste execution pack panel",
);
requireIncludes(
  manualPage,
  "No auto-posting",
  "no auto-posting safety language",
);
requireIncludes(
  `${manualDomain}/clientConfirmationWorkflow.ts`,
  "requiresClientConfirmation",
  "client confirmation workflow",
);
requireIncludes(
  `${manualDomain}/clientConfirmationWorkflow.ts`,
  "isClientConfirmationPending",
  "separate pending confirmation helper",
);
requireIncludes(
  `${manualDomain}/clientConfirmationWorkflow.ts`,
  "isClientConfirmationRejected",
  "separate rejected confirmation helper",
);
if (
  read(`${manualDomain}/clientConfirmationWorkflow.ts`).includes(
    "/confirm|unclear|exact/i",
  )
) {
  failures.push(
    "client confirmation workflow must not use broad /confirm/ business-truth scanning",
  );
}
requireIncludes(
  `${manualDomain}/manualPublishingTracker.ts`,
  "Manual",
  "manual tracker language",
);
requireIncludes(
  `${manualDomain}/executionPackBuilder.ts`,
  "This does not publish anything automatically",
  "manual non-publishing copy block",
);

if (!/AUTH_MODE:\s*AuthMode\s*=\s*"placeholder"/.test(authMode))
  failures.push('AUTH_MODE must remain "placeholder"');
for (const price of ["$295", "$495", "$995"]) {
  if (!pricing.includes(price))
    failures.push(`Locked pricing marker missing: ${price}`);
}

const domainFiles = walk(manualDomain);
const forbiddenDomainImports = [
  /from\s+["'][^"']*supabase/i,
  /from\s+["'][^"']*openai/i,
  /from\s+["'][^"']*(googleapis|@google|facebook|instagram|tiktok|stripe)/i,
];
const forbiddenLiveLanguage = [
  /publish(?:es|ed|ing)?\s+(?:to\s+)?(?:Google|Instagram|Facebook|TikTok)/i,
  /connected to (?:Instagram|Google Business Profile|Facebook|TikTok)/i,
  /platform API/i,
  /webhook/i,
  /cron/i,
];
for (const file of domainFiles) {
  const rel = relative(root, file);
  const text = readFileSync(file, "utf8");
  for (const pattern of forbiddenDomainImports) {
    if (pattern.test(text))
      failures.push(
        `${rel} contains forbidden live integration import/reference: ${pattern}`,
      );
  }
  for (const pattern of forbiddenLiveLanguage) {
    if (
      pattern.test(text) &&
      !/not |No |without |blocked|manual|does not/i.test(text)
    ) {
      failures.push(
        `${rel} contains unsafe live connector wording: ${pattern}`,
      );
    }
  }
}

const workflowPath = join(
  root,
  "artifacts/veroxa/src/domain/manualExecution/clientConfirmationWorkflow.ts",
);
const builderPath = join(
  root,
  "artifacts/veroxa/src/domain/manualExecution/executionPackBuilder.ts",
);
const trackerPath = join(
  root,
  "artifacts/veroxa/src/domain/manualExecution/manualPublishingTracker.ts",
);

const workflow = await import(workflowPath);
const builder = await import(builderPath);
const tracker = await import(trackerPath);

function makePack(overrides: Record<string, unknown> = {}) {
  return {
    id: "guardrail-pack",
    sourceWorkItemId: "guardrail-work",
    clientId: "guardrail-client",
    restaurantName: "Guardrail Restaurant",
    planFit: "growth",
    platform: "instagram",
    executionType: "social_post",
    title: "Guardrail pack",
    clientSafeSummary: "Prepared by Veroxa for team review.",
    teamInstructions: "Review manually before anything goes live.",
    copyPasteCaption: "Simple neighborhood update.",
    copyPasteGoogleUpdate: "",
    copyPasteHashtags: [],
    suggestedMediaUse: "Use reviewed media only.",
    suggestedPublishWindow: "After team review",
    businessTruthItemsToConfirm: [],
    riskFlags: [],
    approvalStatus: "ready_to_copy",
    confirmationStatus: "not_required",
    manualPublishStatus: "ready_for_manual_execution",
    createdAt: "2026-06-03T00:00:00.000Z",
    updatedAt: "2026-06-03T00:00:00.000Z",
    nextAction: "Ready for team review.",
    ...overrides,
  };
}

const confirmedBusinessTruthPack = makePack({
  businessTruthItemsToConfirm: ["Exact offer/menu detail"],
  riskFlags: ["needs_business_truth_confirmation"],
  approvalStatus: "needs_client_confirmation",
  confirmationStatus: "confirmed",
  blockedReason: "Business detail needs confirmation before manual execution.",
  nextAction: "Hold until client confirms the exact business detail.",
});
assert(
  !workflow.isClientConfirmationPending(confirmedBusinessTruthPack),
  "confirmed packs must not be pending confirmation",
);
assert(
  !tracker
    .getManualPublishingBlockers(confirmedBusinessTruthPack)
    .some((blocker: string) =>
      /client confirmation needed|hold until client confirms/i.test(blocker),
    ),
  "confirmed packs must not keep client-confirmation blockers",
);
assert(
  !/Hold until client confirms/i.test(
    builder.getExecutionPackNextAction(confirmedBusinessTruthPack),
  ),
  "confirmed packs must not show hold-until-client-confirms next action",
);

const genericSafetyCopyPack = makePack({
  confirmationStatus: "not_required",
  clientSafeSummary: "Nothing goes live without Veroxa team confirmation.",
  teamInstructions:
    "Use the client confirmation workflow note as a safety reminder only.",
  copyPasteCaption:
    "Prepared work only; confirmation language here is instructional and not a business claim.",
});
assert(
  !workflow.requiresClientConfirmation(genericSafetyCopyPack),
  "generic confirmation wording must not create a confirmation requirement",
);
assert(
  workflow.getBusinessTruthItemsToConfirm(genericSafetyCopyPack).length === 0,
  "generic confirmation wording must not create business-truth items",
);

const requiredOfferPack = makePack({
  title: "Menu price offer",
  confirmationStatus: "required",
  businessTruthItemsToConfirm: ["Exact menu price offer"],
  riskFlags: ["sensitive_offer_or_discount"],
});
assert(
  workflow.requiresClientConfirmation(requiredOfferPack),
  "offer/menu/price details with required status must require confirmation",
);
assert(
  workflow.isClientConfirmationPending(requiredOfferPack),
  "required confirmation status must be pending",
);

const pendingRiskFlagPack = makePack({
  confirmationStatus: "requested",
  riskFlags: ["needs_business_truth_confirmation"],
});
assert(
  workflow.requiresClientConfirmation(pendingRiskFlagPack),
  "business-truth risk flags with pending status must require confirmation",
);
assert(
  tracker
    .getManualPublishingBlockers(pendingRiskFlagPack)
    .some((blocker: string) => /Client confirmation needed/i.test(blocker)),
  "business-truth risk flags with pending status must block manual execution",
);

const rejectedPack = makePack({
  approvalStatus: "needs_client_confirmation",
  confirmationStatus: "rejected",
  businessTruthItemsToConfirm: ["Exact discount detail"],
  riskFlags: ["needs_business_truth_confirmation"],
});
assert(
  !workflow.isClientConfirmationPending(rejectedPack),
  "rejected confirmation status must not be pending",
);
assert(
  builder.getExecutionPackReadinessLabel(rejectedPack) === "Needs revision",
  "rejected packs must show needs revision",
);
assert(
  tracker
    .getManualPublishingBlockers(rejectedPack)
    .some((blocker: string) => /revise/i.test(blocker)),
  "rejected packs must block for revision",
);

if (failures.length > 0) {
  console.error("Manual execution guardrails failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Manual execution guardrails passed.");
