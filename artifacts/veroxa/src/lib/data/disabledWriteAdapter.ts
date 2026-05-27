/**
 * disabledWriteAdapter.ts — M023B
 *
 * The active write adapter in this build. Every function returns a
 * `WriteDisabledResult`. No Supabase calls, no fetch, no network,
 * no mutation, no file upload.
 *
 * Real submit handlers continue to use the local session stores
 * (`localUploadStore`, `localDirectionStore`). This adapter exists
 * so that future code paths can call a stable interface and the
 * disabled state is observable.
 */

import { explainWhyWritesDisabled, getWriteSafetyBanner } from "./writeReadiness";
import type {
  CreateDirectionRequestInput,
  CreateTeamReviewDecisionInput,
  CreateUploadSubmissionInput,
  UpdateDirectionStatusInput,
  UpdateUploadReviewStatusInput,
  VeroxaWriteAdapter,
  WriteDisabledResult,
} from "./writeAdapterTypes";

function disabled(): WriteDisabledResult {
  return {
    ok: false,
    status: "disabled",
    safeMessage: getWriteSafetyBanner(),
    reason: explainWhyWritesDisabled(),
  };
}

export const disabledWriteAdapter: VeroxaWriteAdapter = {
  async createUploadSubmission(_input: CreateUploadSubmissionInput) {
    return disabled();
  },
  async createDirectionRequest(_input: CreateDirectionRequestInput) {
    return disabled();
  },
  async updateUploadReviewStatus(_input: UpdateUploadReviewStatusInput) {
    return disabled();
  },
  async updateDirectionStatus(_input: UpdateDirectionStatusInput) {
    return disabled();
  },
  async createTeamReviewDecision(_input: CreateTeamReviewDecisionInput) {
    return disabled();
  },
};
