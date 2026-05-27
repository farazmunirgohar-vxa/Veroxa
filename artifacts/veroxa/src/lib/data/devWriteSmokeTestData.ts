/**
 * devWriteSmokeTestData.ts — M024B
 *
 * Fictional input data for dev write smoke tests.
 *
 * Rules:
 *   - No real restaurant names.
 *   - No real clients, customers, or private data.
 *   - No real upload keys.
 *   - Fictional data only.
 *   - No network calls here.
 */

import type {
  CreateDirectionRequestInput,
  CreateTeamReviewDecisionInput,
  CreateUploadSubmissionInput,
} from "./writeAdapterTypes";

export const DEV_SMOKE_TEST_CLIENT_LABEL =
  "Veroxa Smoke Test Restaurant" as const;

export function createDevSmokeTestUploadInput(
  clientId: string,
): CreateUploadSubmissionInput {
  return {
    restaurantId: clientId,
    uploadKeyId: null,
    category: "food_photo",
    priority: "use_anytime",
    note: "Smoke test note — fictional data only. Not a real submission.",
    submittedByLabel: "M024B smoke test runner",
  };
}

export function createDevSmokeTestDirectionInput(
  clientId: string,
): CreateDirectionRequestInput {
  return {
    restaurantId: clientId,
    focus: "lunch_traffic",
    channel: "organic_social",
    urgency: "low",
    title: "Smoke test direction — fictional data",
    clientNote:
      "This is a fictional smoke-test direction. Not a real client request.",
    preferredTimingLabel: "This week",
    relatedMediaId: null,
    avoidItem: null,
  };
}

export function createDevSmokeTestReviewDecisionInput(
  clientId: string,
  targetId: string,
  targetType: CreateTeamReviewDecisionInput["targetType"],
): CreateTeamReviewDecisionInput {
  return {
    restaurantId: clientId,
    targetType,
    targetId,
    decision: "accepted",
    safeClientStatus: "accepted",
    internalNote:
      "Smoke test review decision — fictional data only. M024B verification.",
  };
}
