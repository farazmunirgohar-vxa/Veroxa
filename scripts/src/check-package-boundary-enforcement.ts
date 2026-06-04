import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const exists = (p: string) => existsSync(join(root, p));
const assert = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg);
};
const dir = "artifacts/veroxa/src/domain/packageBoundary";
for (const f of [
  "types.ts",
  "planCapabilities.ts",
  "requestClassifier.ts",
  "requestEligibilityEngine.ts",
  "upgradeMessageBuilder.ts",
  "teamPackageReviewQueue.ts",
  "packageBoundarySeedData.ts",
  "index.ts",
])
  assert(exists(`${dir}/${f}`), `Missing packageBoundary/${f}`);
const rules = read(`${dir}/planCapabilities.ts`);
const engine = read(`${dir}/requestEligibilityEngine.ts`);
assert(
  rules.includes("starterIncluded") &&
    !/starterIncluded[\s\S]*reels_request/.test(
      rules.split("growthIncluded")[0],
    ),
  "Starter must not include Reels.",
);
assert(
  !/starterIncluded[\s\S]*tiktok_request/.test(
    rules.split("growthIncluded")[0],
  ),
  "Starter must not include TikTok.",
);
assert(
  !/starterIncluded[\s\S]*ad_management_request/.test(
    rules.split("growthIncluded")[0],
  ),
  "Starter must not include ad management.",
);
assert(
  rules.includes("growthIncluded") &&
    rules.includes("reels_request") &&
    rules.includes("tiktok_request"),
  "Growth must allow Reels/TikTok.",
);
assert(
  !/growthIncluded[\s\S]*ad_management_request/.test(
    rules.split("premiumIncluded")[0],
  ),
  "Growth must block ad management.",
);
assert(
  !/growthIncluded[\s\S]*premium_daily_posting_request/.test(
    rules.split("premiumIncluded")[0],
  ),
  "Growth must block up to 1 post/day.",
);
assert(
  /premiumIncluded[\s\S]*ad_management_request/.test(rules) &&
    /premiumIncluded[\s\S]*premium_daily_posting_request/.test(rules),
  "Premium must allow ad management and daily posting boundary.",
);
assert(
  rules.includes("customer_service_request") &&
    rules.includes("dm_or_comment_reply_request"),
  "All plans must block customer-service conversations.",
);
assert(
  engine.includes("does not invent discounts or new promotions"),
  "Offer invention must be blocked with confirmation-only language.",
);
for (const file of [
  "artifacts/veroxa/src/pages/client-requests.tsx",
  "artifacts/veroxa/src/pages/team-work-queue.tsx",
  "artifacts/veroxa/src/pages/team-dashboard.tsx",
])
  assert(
    read(file).includes("package") || read(file).includes("Package"),
    `${file} must surface package boundary context.`,
  );
const pricing = read("artifacts/veroxa/src/pages/pricing.tsx");
assert(
  pricing.includes("$295") &&
    pricing.includes("$495") &&
    pricing.includes("$995"),
  "Pricing must remain $295/$495/$995.",
);
const services = read("artifacts/veroxa/src/pages/services.tsx");
for (const marker of ["$295", "$495", "$995"])
  assert(
    !services.includes(marker),
    `Services page still must not show ${marker}.`,
  );
if (failures.length) {
  console.error(
    "Package boundary guardrail failed:\n" +
      failures.map((f) => `- ${f}`).join("\n"),
  );
  process.exit(1);
}
console.log("Package boundary guardrail passed.");
