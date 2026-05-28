/**
 * clientTeamWorkRepository.ts — read-only adapter over the
 * `demoClientTeamWork` fixtures. Models the real-life client ↔ Veroxa
 * team workflow and communication layer.
 *
 * READ-ONLY. No writes. No network. No Supabase. No localStorage.
 *
 * Visibility split is enforced HERE so callers cannot accidentally
 * leak internal-only data to client surfaces:
 *
 *   - `getClientVisibleMessages` drops `team_only` messages.
 *   - Team-facing helpers expose both visibilities.
 */

import {
  demoClientActionItems,
  demoClientTeamMessages,
  demoClientTeamSubmissions,
  getClientTeamWorkSummary as _getClientTeamWorkSummary,
  type ClientActionItem,
  type ClientTeamMessage,
  type ClientTeamSubmission,
  type ClientTeamWorkSummary,
} from "@/data/demo/demoClientTeamWork";

/**
 * Client-safe submission shape — strips `internalTeamNote` (and any
 * future team-only fields). This is what client pages must consume.
 */
export type ClientVisibleSubmission = Omit<ClientTeamSubmission, "internalTeamNote">;

function toClientVisible(s: ClientTeamSubmission): ClientVisibleSubmission {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { internalTeamNote, ...safe } = s;
  return safe;
}

/**
 * TEAM-ONLY: returns full submission objects including `internalTeamNote`.
 * Do NOT call from client surfaces. Use `getClientVisibleSubmissions`.
 */
export function getClientSubmissions(clientId: string): ClientTeamSubmission[] {
  return demoClientTeamSubmissions.filter((s) => s.clientId === clientId);
}

/**
 * CLIENT-SAFE: returns submissions for a client with team-only fields
 * stripped. Use this on every client-facing page.
 */
export function getClientVisibleSubmissions(
  clientId: string,
): ClientVisibleSubmission[] {
  return demoClientTeamSubmissions
    .filter((s) => s.clientId === clientId)
    .map(toClientVisible);
}

export function getClientOpenActions(clientId: string): ClientActionItem[] {
  return demoClientActionItems.filter(
    (a) => a.clientId === clientId && a.status !== "completed",
  );
}

export function getClientVisibleMessages(clientId: string): ClientTeamMessage[] {
  return demoClientTeamMessages.filter(
    (m) => m.clientId === clientId && m.visibility === "client_and_team",
  );
}

export function getTeamInbox(): ClientTeamSubmission[] {
  return demoClientTeamSubmissions.filter(
    (s) => s.status === "new" || s.status === "needs_review",
  );
}

export function getTeamBlockedItems(): ClientTeamSubmission[] {
  return demoClientTeamSubmissions.filter((s) => s.status === "blocked");
}

export function getTeamNeedsClientClarification(): ClientTeamSubmission[] {
  return demoClientTeamSubmissions.filter(
    (s) => s.status === "needs_client_clarification",
  );
}

export function getTeamInProgress(): ClientTeamSubmission[] {
  return demoClientTeamSubmissions.filter(
    (s) => s.status === "in_progress" || s.status === "accepted",
  );
}

export function getTeamCompletedThisWeek(): ClientTeamSubmission[] {
  return demoClientTeamSubmissions.filter((s) => s.status === "completed");
}

export interface SubmissionThread {
  submission: ClientTeamSubmission | undefined;
  messages: ClientTeamMessage[];
}

/**
 * Returns the submission + ALL messages on its thread (both visibilities).
 * Team-only. Client surfaces must call `getClientVisibleMessages` instead.
 */
export function getSubmissionThread(submissionId: string): SubmissionThread {
  return {
    submission: demoClientTeamSubmissions.find((s) => s.id === submissionId),
    messages: demoClientTeamMessages.filter(
      (m) => m.submissionId === submissionId,
    ),
  };
}

export function getTeamWorkCommunicationSummary(): ClientTeamWorkSummary {
  return _getClientTeamWorkSummary();
}
