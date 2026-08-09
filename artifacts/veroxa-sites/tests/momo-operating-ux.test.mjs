import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const operating = await readFile(new URL("../app/momo-operating-center.tsx", import.meta.url), "utf8");

test("content preparation failures explain the real blocked state and retry boundary", () => {
  const messages = operating.match(/const MOMO_ACTION_ERROR_MESSAGES:[\s\S]*?\n};/)?.[0] || "";
  for (const code of [
    "content_ai_disabled",
    "content_ai_configuration_unavailable",
    "content_ai_budget_unavailable",
    "content_ai_budget_contract_exceeded",
    "content_ai_in_progress",
    "content_ai_previous_attempt_failed",
    "content_ai_provider_failed",
    "content_ai_provider_incomplete",
    "content_ai_token_budget_exhausted",
    "content_ai_finalization_uncertain",
    "content_ai_recovery_unavailable",
    "content_ai_unavailable",
    "source_not_ready",
  ]) {
    assert.match(messages, new RegExp(`\\b${code}:`), `${code} must have an explicit Team-facing explanation`);
  }
  assert.match(messages, /content_ai_configuration_unavailable:[^\n]*No AI call was started and nothing was marked Ready\./);
  assert.match(messages, /content_ai_budget_unavailable:[^\n]*No paid AI call was started and nothing was marked Ready\./);
  assert.match(messages, /content_ai_in_progress:[^\n]*A second paid AI call was not started; refresh shortly\./);
  assert.match(messages, /content_ai_provider_failed:[^\n]*no automatic retry was made, and nothing was marked Ready\./);
  assert.match(messages, /content_ai_finalization_uncertain:[^\n]*Do not retry yet; refresh first to avoid a duplicate paid call\./);
  assert.match(messages, /source_not_ready:[^\n]*image, rights, media review, or owner-truth evidence no longer passes/);
  assert.match(operating, /Object\.hasOwn\(MOMO_ACTION_ERROR_MESSAGES, code\)/, "Unknown server codes must not resolve through Object.prototype");
  assert.match(operating, /catch \(error\)[\s\S]{0,180}notify\(momoActionErrorMessage\(code\)\)/, "Every operating action must use the explicit error-message contract");
});

test("Team approval stays disabled for past Chicago plans and rechecks immediately before submission", () => {
  assert.match(operating, /const MOMO_CHICAGO_SCHEDULE_PATTERN = \/\^\\d\{4\}-\\d\{2\}-\\d\{2\}T\\d\{2\}:\\d\{2\}\$\/u/);
  assert.match(operating, /timeZone: "America\/Chicago"[\s\S]{0,220}hourCycle: "h23"/);
  assert.match(operating, /const momoChicagoScheduleIsFuture[\s\S]{0,180}value > momoChicagoLocalMinute\(new Date\(now\)\)/);
  assert.match(operating, /invalidSchedulePlatforms = output\.variants\.filter[\s\S]{0,180}!momoChicagoScheduleIsFuture/);
  assert.match(operating, /const scheduleReady = invalidSchedulePlatforms\.length === 0/);
  assert.match(operating, /type="datetime-local" min=\{earliestChicagoSchedule\} aria-invalid=\{!momoChicagoScheduleIsFuture/);
  assert.match(operating, /Choose a future America\/Chicago time for \{invalidSchedulePlatforms/);
  const submitGuard = operating.match(/const submissionTime = Date\.now\(\);[\s\S]*?await approveMomoContentPackage/)?.[0] || "";
  assert.match(submitGuard, /if \(!output\.variants\.every\(\(variant\) => momoChicagoScheduleIsFuture/);
  assert.match(submitGuard, /throw new Error\("content_schedule_must_be_future"\)/);
  assert.ok(submitGuard.indexOf("content_schedule_must_be_future") < submitGuard.indexOf("await approveMomoContentPackage"), "The local future-time gate must execute before the database approval request");
});

test("a one-step upload saves the instruction, clears the form, and leaves recovery with Team", () => {
  assert.match(operating, /const fileInputRef = useRef<HTMLInputElement>\(null\)/);
  assert.match(operating, /<input ref=\{fileInputRef\} type="file"/);
  const uploadAction = operating.match(/await uploadMomoClientMedia\([\s\S]*?Veroxa and Team Faraz own the remaining processing; nothing was posted or connected\./)?.[0] || "";
  for (const reset of [
    /setFile\(null\)/,
    /setRights\(false\)/,
    /setScope\(\[\.\.\.MOMO_MEDIA_DEFAULT_SCOPE\]\)/,
    /setExpiresAt\(""\)/,
    /setRestaurantAssociation\("not_for_restaurant"\)/,
    /setPrivateAssessmentRequested\(false\)/,
    /fileInputRef\.current\.value = ""/,
  ]) assert.match(uploadAction, reset);
  assert.ok(uploadAction.indexOf("await uploadMomoClientMedia") < uploadAction.indexOf("setFile(null)"), "The form must reset only after the upload and immutable instruction are saved");
  assert.match(operating, /Upload once and let Veroxa handle it/);
  assert.match(operating, /role === "team" && !intake[\s\S]{0,500}Retry secure verification/, "Only Team may recover a saved upload's verification");
  assert.doesNotMatch(operating, /role === "client" && !intake[\s\S]{0,500}Retry secure verification/);
});

test("background AI preparation is card-local, enqueue-only, and duplicate-call safe", () => {
  assert.match(operating, /const shared = \{[\s\S]{0,220}reloadWorkspace: reload,[\s\S]{0,40}notify,/);
  assert.match(operating, /type MomoContentPreparationState = "idle" \| "saving_review" \| "queueing" \| "refreshing" \| "needs_refresh"/);
  assert.match(operating, /contentPreparationRequestActive = useRef\(false\)/, "A synchronous double click must be blocked before React rerenders");
  const queuePackage = operating.match(/const queueContentPackage = async \(reviewId: string\) => \{[\s\S]*?\n  \};\n  const prepareContentPackage/)?.[0] || "";
  const preparation = operating.match(/const prepareContentPackage = async \(\) => \{[\s\S]*?\n  \};\n  const refreshContentPreparationStatus/)?.[0] || "";
  assert.match(preparation, /contentPreparationRequestActive\.current \|\| contentPreparationState !== "idle" \|\| activeContentRun/, "Local and authoritative in-flight states must block another request");
  assert.match(preparation, /setContentPreparationState\("saving_review"\)[\s\S]*?await persistCurrentMediaReview\(\)[\s\S]*?await queueContentPackage\(reviewId\)/);
  assert.doesNotMatch(preparation, /\bsetBusy\(|\bvoid run\(|\bawait run\(/, "A short enqueue request must not acquire the portal-wide busy lock");
  assert.match(preparation, /momoActionErrorMessage\(code\)[\s\S]*?setContentPreparationState\("needs_refresh"\)/, "Enqueue uncertainty must preserve the truthful error contract and require readback");
  assert.match(queuePackage, /setContentPreparationState\("queueing"\)[\s\S]*?await generateMomoContentPackage[\s\S]*?contentPreparationMounted\.current[\s\S]*?await reloadWorkspace\(\)/, "A completed enqueue must not reload a stale workspace after navigation");

  assert.match(operating, /Queueing this exact Momo package[\s\S]{0,360}duplicate paid calls are blocked[\s\S]{0,120}external posting remains off/);
  assert.match(operating, /\["reserved", "provider_running", "result_staged"\]\.includes\(run\.status\)/);
  assert.match(operating, /AI content is being prepared/);
  assert.match(operating, /Content preparation is queued/);
  assert.match(operating, /Quality checks are finishing/);
  assert.match(operating, /Refresh status/);
  assert.match(operating, /taking longer than normal[\s\S]{0,260}Signed background recovery[\s\S]{0,260}not start a second AI call/);
  assert.match(operating, /contentPreparationError[\s\S]{0,500}Preparation needs a status refresh[\s\S]{0,500}Refresh package status/);
  const refresh = operating.match(/const refreshContentPreparationStatus = async \(\) => \{[\s\S]*?\n  \};/)?.[0] || "";
  assert.match(refresh, /await reloadWorkspace\(\)/);
  assert.doesNotMatch(refresh, /generateMomoContentPackage|persistCurrentMediaReview/, "Status refresh must remain read-only and cannot resume by starting work");
  assert.doesNotMatch(operating, /resumeExistingContentPreparation|requestOrResumeContentPackage/);
});
