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
 *
 * This is the canonical source for client↔team submissions, messages,
 * and action items on both client and team portals. Pages should
 * prefer the normalized work-item helpers below over reading
 * `demoClientTeamSubmissions` directly.
 */

import {
  demoClientActionItems,
  demoClientTeamMessages,
  demoClientTeamSubmissions,
  getActiveSubmissionsForClient as _getActiveSubmissionsForClient,
  getClientActionableSubmissions as _getClientActionableSubmissions,
  getClientTeamWorkSummary as _getClientTeamWorkSummary,
  getCompletedSubmissionsForClient as _getCompletedSubmissionsForClient,
  getSubmissionById as _getSubmissionById,
  getSubmissionClientStatusLabel,
  getSubmissionNextClientAction,
  getSubmissionNextTeamAction,
  getSubmissionTeamStatusLabel,
  getSubmissionTeamWorkStatus,
  getSubmissionWorkType,
  getTeamReadySubmissions as _getTeamReadySubmissions,
  getTeamWaitingOnClientSubmissions as _getTeamWaitingOnClientSubmissions,
  type ClientActionItem,
  type ClientTeamMessage,
  type ClientTeamSubmission,
  type ClientTeamSubmissionPriority,
  type ClientTeamSubmissionTeamWorkStatus,
  type ClientTeamSubmissionWorkType,
  type ClientTeamWorkSummary,
} from "@/data/demo/demoClientTeamWork";

/**
 * Client-safe submission shape — strips `internalTeamNote` (and any
 * future team-only fields). This is what client pages must consume.
 */
export type ClientVisibleSubmission = Omit<ClientTeamSubmission, "internalTeamNote">;

/**
 * Normalized "work item" shape exposed to client surfaces. Derived from
 * a submission via repository helpers. Never includes `internalTeamNote`
 * or any other team-only field.
 */
export interface ClientWorkItem {
  id: string;
  submissionId: string;
  clientId: string;
  title: string;
  clientVisibleNote: string;
  clientStatusLabel: string;
  workType: ClientTeamSubmissionWorkType;
  priority: ClientTeamSubmissionPriority;
  updatedAt: string;
  nextClientAction?: string;
  /** True when the submission needs the client to do something. */
  isActionRequired: boolean;
}

/**
 * Normalized "work item" shape exposed to team surfaces. Includes
 * `internalTeamNote` and team-only status/next-action context.
 */
export interface TeamWorkItem extends ClientWorkItem {
  internalTeamNote: string;
  teamStatusLabel: string;
  teamWorkStatus: ClientTeamSubmissionTeamWorkStatus;
  nextTeamAction: string;
  submittedBy: ClientTeamSubmission["submittedBy"];
  submissionType: ClientTeamSubmission["submissionType"];
}

function toClientVisible(s: ClientTeamSubmission): ClientVisibleSubmission {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { internalTeamNote, ...safe } = s;
  return safe;
}

function toClientWorkItem(s: ClientTeamSubmission): ClientWorkItem {
  return {
    id: `cwi-${s.id}`,
    submissionId: s.id,
    clientId: s.clientId,
    title: s.title,
    clientVisibleNote: s.clientVisibleNote,
    clientStatusLabel: getSubmissionClientStatusLabel(s),
    workType: getSubmissionWorkType(s),
    priority: s.priority,
    updatedAt: s.updatedAt,
    nextClientAction: getSubmissionNextClientAction(s),
    isActionRequired:
      s.status === "needs_client_clarification" || s.status === "blocked",
  };
}

function toTeamWorkItem(s: ClientTeamSubmission): TeamWorkItem {
  return {
    ...toClientWorkItem(s),
    id: `twi-${s.id}`,
    internalTeamNote: s.internalTeamNote,
    teamStatusLabel: getSubmissionTeamStatusLabel(s),
    teamWorkStatus: getSubmissionTeamWorkStatus(s),
    nextTeamAction: getSubmissionNextTeamAction(s),
    submittedBy: s.submittedBy,
    submissionType: s.submissionType,
  };
}

// ===========================================================================
// Raw submission access (legacy callers).
// ===========================================================================

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
  return _getTeamReadySubmissions();
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

// ===========================================================================
// Normalized client-facing work-item helpers — visibility-safe.
// Client pages should prefer these over reading raw submissions.
// ===========================================================================

/**
 * Submissions where the client needs to do something next. Drives the
 * "Action needed from you" callout and dashboard tile.
 */
export function getClientActionRequiredItems(clientId: string): ClientWorkItem[] {
  return _getClientActionableSubmissions(clientId).map(toClientWorkItem);
}

/**
 * Submissions Veroxa is actively executing for the client. Drives the
 * "Veroxa is working on" panel.
 */
export function getClientInProgressItems(clientId: string): ClientWorkItem[] {
  return _getActiveSubmissionsForClient(clientId)
    .filter((s) => s.status === "in_progress" || s.status === "accepted")
    .map(toClientWorkItem);
}

/**
 * Submissions that have been closed out. Drives the "Recently completed"
 * panel on the client portal.
 */
export function getClientCompletedItems(clientId: string): ClientWorkItem[] {
  return _getCompletedSubmissionsForClient(clientId).map(toClientWorkItem);
}

/**
 * Full client work timeline (action-required → in-progress → completed)
 * sorted by recency, useful for "Recent activity" style strips.
 */
export function getClientWorkTimeline(clientId: string): ClientWorkItem[] {
  return demoClientTeamSubmissions
    .filter((s) => s.clientId === clientId)
    .slice()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .map(toClientWorkItem);
}

// ===========================================================================
// Normalized team-facing work-item helpers — include team-only fields.
// ===========================================================================

export function getTeamReadyWorkItems(): TeamWorkItem[] {
  return _getTeamReadySubmissions().map(toTeamWorkItem);
}

export function getTeamWaitingOnClientItems(): TeamWorkItem[] {
  return _getTeamWaitingOnClientSubmissions().map(toTeamWorkItem);
}

export function getTeamInProgressWorkItems(): TeamWorkItem[] {
  return demoClientTeamSubmissions
    .filter((s) => s.status === "in_progress" || s.status === "accepted")
    .map(toTeamWorkItem);
}

export function getTeamCompletedWorkItems(): TeamWorkItem[] {
  return demoClientTeamSubmissions
    .filter((s) => s.status === "completed")
    .map(toTeamWorkItem);
}

export function getTeamBlockedWorkItems(): TeamWorkItem[] {
  return demoClientTeamSubmissions
    .filter((s) => s.status === "blocked")
    .map(toTeamWorkItem);
}

export function getSubmissionWorkSummary(): ClientTeamWorkSummary {
  return _getClientTeamWorkSummary();
}

/**
 * TEAM-ONLY: returns the full normalized work item for a single submission,
 * including `internalTeamNote` and next-team-action.
 */
export function getSubmissionWorkItemForTeam(
  submissionId: string,
): TeamWorkItem | undefined {
  const s = _getSubmissionById(submissionId);
  return s ? toTeamWorkItem(s) : undefined;
}

/**
 * CLIENT-SAFE: returns the client-visible work item for a single submission.
 * Strips `internalTeamNote` and uses client-friendly status labels.
 */
export function getSubmissionWorkItemForClient(
  submissionId: string,
): ClientWorkItem | undefined {
  const s = _getSubmissionById(submissionId);
  return s ? toClientWorkItem(s) : undefined;
}
