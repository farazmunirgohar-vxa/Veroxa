import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const failures: string[] = [];
const nav = read("artifacts/veroxa/src/components/public/PublicNav.tsx");
if (!nav.includes("Veroxa")) failures.push("PublicNav must render Veroxa.");
for (const marker of ['label: "Home"', 'label: "Audit"', 'label: "Login"', 'nav-link-home', 'nav-link-audit', 'nav-link-login']) if (nav.includes(marker)) failures.push(`PublicNav may not render ${marker}.`);
if (/text-sm/.test(nav)) failures.push("PublicNav brand must not regress to text-sm.");
const auth = read("artifacts/veroxa/src/lib/auth/authMode.ts");
if (!/AUTH_MODE(?:\s*:\s*AuthMode)?\s*=\s*["']placeholder["']/.test(auth)) failures.push("AUTH_MODE must remain placeholder.");
const devCreds = read("artifacts/veroxa/src/lib/auth/devCredentials.ts");
for (const marker of ["VITE_VEROXA_DEV_CLIENT_EMAIL", "VITE_VEROXA_DEV_CLIENT_PASSWORD", "VITE_VEROXA_DEV_TEAM_EMAIL", "VITE_VEROXA_DEV_TEAM_PASSWORD", "VITE_VEROXA_ENABLE_PUBLIC_PREVIEW_LOGIN", "faraz@client.com", "faraz@team.com", "isPreviewFriendlyHostname", "hostname === \"localhost\"", "hostname === \"127.0.0.1\"", "hostname.endsWith(\".vercel.app\")", "explicitFlag === \"false\"", "explicitFlag === \"true\""]) if (!devCreds.includes(marker)) failures.push(`devCredentials missing preview login marker ${marker}.`);
if (/hostname\.includes\(["']veroxa["']\)/.test(devCreds) || /includes\(["']veroxa["']\)/.test(devCreds)) failures.push("devCredentials must not allow broad Veroxa custom-domain preview login fallback.");
const updates = read("artifacts/veroxa/src/pages/client-updates.tsx");
if (!updates.includes("updateSummaries") || !updates.includes("buildWeeklyUpdateFromClientSummary")) failures.push("client-updates.tsx must adapt loaded updateSummaries before using fallback preview data.");
if (/buildClientWeeklyUpdatePreview\(\)/.test(updates)) failures.push("client-updates.tsx must not always call buildClientWeeklyUpdatePreview() with no data.");
const reports = read("artifacts/veroxa/src/pages/client-reports.tsx");
if (!reports.includes("reportSummaries") || !reports.includes("buildMonthlyReportFromClientSummary")) failures.push("client-reports.tsx must adapt loaded reportSummaries before using fallback preview data.");
if (/buildClientMonthlyReportPreview\(\)/.test(reports)) failures.push("client-reports.tsx must not always call buildClientMonthlyReportPreview() with no data.");
if (/sr-only[^\n]*(Weekly Reports|Monthly Reports)|(Weekly Reports|Monthly Reports)[^\n]*sr-only/.test(reports)) failures.push("client-reports.tsx contains hidden report marker stuffing.");
const onboardingPage = read("artifacts/veroxa/src/pages/client-onboarding.tsx");
const onboardingDomain = read("artifacts/veroxa/src/domain/restaurantOnboarding/packageOnboardingRules.ts") + read("artifacts/veroxa/src/domain/restaurantOnboarding/onboardingSeedData.ts");
if (!onboardingDomain.includes("complete_online_presence") || !onboardingPage.includes("Complete Online Presence")) failures.push("Complete Online Presence must be active onboarding package.");
for (const marker of ["Starter", "Growth", "Premium", "Premium ads readiness"]) if (onboardingPage.includes(marker)) failures.push(`client onboarding must not expose active old tier marker ${marker}.`);
const publicClientFiles = ["artifacts/veroxa/src/pages/landing.tsx", "artifacts/veroxa/src/pages/free-audit.tsx", "artifacts/veroxa/src/pages/client-dashboard.tsx", "artifacts/veroxa/src/pages/client-onboarding.tsx", "artifacts/veroxa/src/pages/client-requests.tsx", "artifacts/veroxa/src/pages/client-updates.tsx", "artifacts/veroxa/src/pages/client-reports.tsx", "artifacts/veroxa/src/pages/client-media.tsx"];
for (const file of publicClientFiles) {
  const text = read(file);
  for (const marker of ["$9,900", "requiredDailyOrders", "net margin", "break-even", "generated sales", "profit math", "database write", "OpenAI", "Supabase", "RLS", "public demo CTA"]) if (text.includes(marker)) failures.push(`${file} contains forbidden public/client marker ${marker}.`);
}
const requests = read("artifacts/veroxa/src/pages/client-requests.tsx");
if (!requests.includes("loadedBoundaries") || /comingSoon:\s*0|addOnAvailable:\s*0/.test(requests)) failures.push("client-requests.tsx must classify loaded requests instead of hardcoding boundary counts to 0.");
if (failures.length) { console.error("Post-PR70 RR cleanup guardrail failed:\n" + failures.map((f) => `- ${f}`).join("\n")); process.exit(1); }
console.log("Post-PR70 RR cleanup guardrail passed.");
