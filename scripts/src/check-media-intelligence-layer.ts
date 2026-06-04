import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");
const exists = (p: string) => existsSync(join(root, p));
const dir = "artifacts/veroxa/src/domain/mediaIntelligence";
for (const f of ["types.ts", "mediaPlatformFit.ts", "mediaIntelligenceSeedData.ts", "workingNotWorkingEngine.ts", "mediaNextBestRequest.ts", "mediaReportingSummary.ts", "index.ts"]) if (!exists(`${dir}/${f}`)) failures.push(`Missing mediaIntelligence/${f}`);
const all = ["types.ts", "mediaPlatformFit.ts", "mediaIntelligenceSeedData.ts"].map(f => read(`${dir}/${f}`)).join("\n");
for (const required of ["PlatformDraftDirection", "buildImageDraftDirections", "Facebook draft", "Instagram draft", "Google Business Profile / Google update draft", "buildVideoDraftDirections", "Instagram/Reels draft", "TikTok draft", "clientIncludedAtLaunch: false", "tiktok_coming_soon", "instagram_reels_coming_soon"]) if (!all.includes(required)) failures.push(`Media draft logic missing ${required}`);
for (const forbidden of [/good for Facebook but not Instagram/i, /only good for Facebook/i, /Starter does not show/i, /Growth\/Premium can show/i]) if (forbidden.test(all)) failures.push(`Media logic contains retired/single-platform wording: ${forbidden}`);
if (failures.length) { console.error("Media intelligence guardrail failed:\n" + failures.map(f => `- ${f}`).join("\n")); process.exit(1); }
console.log("Media intelligence guardrail passed.");
