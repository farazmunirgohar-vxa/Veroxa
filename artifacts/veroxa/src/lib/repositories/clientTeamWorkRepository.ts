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
  getClientVisibleStatusEvents as _getClientVisibleStatusEvents,
  getCompletedSubmissionsForClient as _getCompletedSubmissionsForClient,
  getStatusEventsForSubmission as _getStatusEventsForSubmission,
  getSubmissionById as _getSubmissionById,
  getSubmissionClientStatusLabel,
  getSubmissionNextClientAction,
  getSubmissionNextTeamAction,
  getSubmissionTeamStatusLabel,
  getSubmissionTeamWorkStatus,
  getSubmissionWorkType,
  getTeamReadySubmissions as _getTeamReadySubmissions,
  getTeamStatusEvents as _getTeamStatusEvents,
  getTeamWaitingOnClientSubmissions as _getTeamWaitingOnClientSubmissions,
  type ClientActionItem,
  type ClientTeamMessage,
  type ClientTeamStatusEvent,
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
  /** Alias for `submissionId` — matches the Step 7 work-item contract. */
  sourceSubmissionId: string;
  clientId: string;
  title: string;
  description: string;
  clientVisibleNote: string;
  clientStatusLabel: string;
  /** Alias for `clientStatusLabel` — matches the Step 7 work-item contract. */
  statusLabel: string;
  workType: ClientTeamSubmissionWorkType;
  priority: ClientTeamSubmissionPriority;
  updatedAt: string;
  nextClientAction?: string;
  /** Alias for `nextClientAction` — matches the Step 7 work-item contract. */
  nextAction?: string;
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
  const statusLabel = getSubmissionClientStatusLabel(s);
  const nextAction = getSubmissionNextClientAction(s);
  return {
    id: `cwi-${s.id}`,
    submissionId: s.id,
    sourceSubmissionId: s.id,
    clientId: s.clientId,
    title: s.title,
    description: s.description,
    clientVisibleNote: s.clientVisibleNote,
    clientStatusLabel: statusLabel,
    statusLabel,
    workType: getSubmissionWorkType(s),
    priority: s.priority,
    updatedAt: s.updatedAt,
    nextClientAction: nextAction,
    nextAction,
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

// ===========================================================================
// Status timeline helpers — visibility-split.
// Client surfaces only ever see events with `clientVisible: true`.
// ===========================================================================

/**
 * Client-friendly status label for one of the four headline buckets:
 *   "Received" / "In progress" / "Waiting on your input" / "Completed".
 * Used by `/demo/client/updates` to render the "Recent Veroxa progress"
 * strip without leaking internal stage names.
 */
export type ClientFriendlyStatusBucket =
  | "Received"
  | "In progress"
  | "Waiting on your input"
  | "Completed";

export interface ClientStatusUpdate {
  id: string;
  submissionId: string;
  submissionTitle: string;
  label: ClientFriendlyStatusBucket;
  note: string;
  createdAt: string;
}

function toClientFriendlyBucket(
  event: ClientTeamStatusEvent,
): ClientFriendlyStatusBucket {
  switch (event.toStatus) {
    case "new":
    case "needs_review":
    case "accepted":
      return "Received";
    case "in_progress":
      return "In progress";
    case "needs_client_clarification":
    case "blocked":
      return "Waiting on your input";
    case "completed":
    case "archived":
      return "Completed";
  }
}

/**
 * CLIENT-SAFE: most-recent client-visible status events for a client, mapped
 * to one of four friendly labels. Strips internal-only events.
 */
export function getClientLatestStatusUpdates(
  clientId: string,
  limit = 6,
): ClientStatusUpdate[] {
  return _getClientVisibleStatusEvents(clientId)
    .slice(0, limit)
    .map((event) => {
      const submission = _getSubmissionById(event.submissionId);
      return {
        id: event.id,
        submissionId: event.submissionId,
        submissionTitle: submission?.title ?? "Veroxa work",
        label: toClientFriendlyBucket(event),
        note: event.note,
        createdAt: event.createdAt,
      };
    });
}

/**
 * TEAM-ONLY: full status timeline for a client across all submissions,
 * newest-first. Includes internal-only events.
 */
export function getTeamStatusTimeline(
  clientId: string,
): ClientTeamStatusEvent[] {
  return _getTeamStatusEvents(clientId);
}

/**
 * TEAM-ONLY: full status timeline for a single submission, oldest-first.
 * Includes internal-only events.
 */
export function getTeamSubmissionStatusEvents(
  submissionId: string,
): ClientTeamStatusEvent[] {
  return _getStatusEventsForSubmission(submissionId);
}
