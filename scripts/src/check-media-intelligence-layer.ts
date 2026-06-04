import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const exists = (p: string) => existsSync(join(root, p));
const assert = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg);
};
const dir = "artifacts/veroxa/src/domain/mediaIntelligence";
for (const f of [
  "types.ts",
  "mediaClassification.ts",
  "mediaQualityScoring.ts",
  "mediaPlatformFit.ts",
  "mediaPerformancePreview.ts",
  "workingNotWorkingEngine.ts",
  "mediaNextBestRequest.ts",
  "mediaReportingSummary.ts",
  "mediaIntelligenceSeedData.ts",
  "index.ts",
])
  assert(exists(`${dir}/${f}`), `Missing mediaIntelligence/${f}`);
assert(
  read(`${dir}/workingNotWorkingEngine.ts`).includes("working") &&
    read(`${dir}/mediaPerformancePreview.ts`).includes("promising"),
  "Media intelligence must include working/not-working logic.",
);
assert(
  read(`${dir}/mediaPlatformFit.ts`).includes('plan === "starter"') &&
    read(`${dir}/mediaPlatformFit.ts`).includes("reels") &&
    read(`${dir}/mediaPlatformFit.ts`).includes("tiktok"),
  "Media platform fit must respect Starter video boundaries.",
);
for (const f of [
  "artifacts/veroxa/src/pages/client-media.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
]) {
  const t = read(f);
  for (const rx of [
    /raw score/i,
    /internal risk/i,
    /backend/i,
    /\bAPI\b/,
    /OpenAI/i,
    /Supabase/i,
    /connector/i,
  ])
    assert(!rx.test(t), `${f} leaks client-unsafe term ${rx}`);
}
const scanDirs = [
  "artifacts/veroxa/src/domain/packageBoundary",
  "artifacts/veroxa/src/domain/requestSla",
  "artifacts/veroxa/src/domain/valueProof",
  "artifacts/veroxa/src/domain/mediaIntelligence",
];
for (const d of scanDirs)
  for (const file of readdirSync(join(root, d))) {
    const t = read(`${d}/${file}`);
    for (const rx of [
      /from ["']openai/i,
      /createClient\(/i,
      /stripe/i,
      /googleapis/i,
      /storage\.from/i,
    ])
      assert(
        !rx.test(t),
        `${d}/${file} appears to import live AI/API/storage/payment.`,
      );
  }
assert(
  /AUTH_MODE:\s*AuthMode\s*=\s*"placeholder"/.test(
    read("artifacts/veroxa/src/lib/auth/authMode.ts"),
  ),
  "AUTH_MODE must remain placeholder.",
);
const creds = read("artifacts/veroxa/src/lib/auth/devCredentials.ts");
for (const m of [
  "faraz@client.com",
  "farazclient",
  "faraz@team.com",
  "farazteam",
])
  assert(creds.includes(m), `Missing preview credential ${m}`);
const dashboard = read("artifacts/veroxa/src/pages/client-dashboard.tsx");
const onboarding = read("artifacts/veroxa/src/pages/client-onboarding.tsx");
assert(
  dashboard.includes(
    "mode.isPublicDemoRoute ? getClientOnboardingPreviewProfile() : null",
  ),
  "Client dashboard must guard onboarding preview profile by public demo route.",
);
assert(
  onboarding.includes(
    "mode.isPublicDemoRoute ? getClientOnboardingPreviewProfile() : null",
  ),
  "Client onboarding must guard onboarding preview profile by public demo route.",
);
if (failures.length) {
  console.error(
    "Media intelligence guardrail failed:\n" +
      failures.map((f) => `- ${f}`).join("\n"),
  );
  process.exit(1);
}
console.log("Media intelligence guardrail passed.");
