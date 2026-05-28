/**
 * demoClientTeamWork.ts — fixture data modelling the real-life
 * client ↔ Veroxa team workflow and communication layer.
 *
 * READ-ONLY DEMO FIXTURES. No backend behavior, no real client data.
 * Uses only the canonical demo client IDs: demo-a, demo-b, demo-c, demo-d.
 *
 * Future backend tables (when the contract is realized):
 *   - client_team_submissions   → ClientTeamSubmission
 *   - client_team_messages      → ClientTeamMessage
 *   - client_action_items       → ClientActionItem
 *
 * Visibility split is enforced at the repository layer:
 *   - Client pages must only see `client_and_team` messages and must
 *     never render `internalTeamNote`.
 *   - Team pages may see both message visibilities and internal notes.
 */

export type ClientTeamDemoClientId = "demo-a" | "demo-b" | "demo-c" | "demo-d";

export type ClientTeamSubmissionType =
  | "media"
  | "menu_update"
  | "promotion"
  | "correction"
  | "question"
  | "access_info"
  | "general_request";

export type ClientTeamSubmissionStatus =
  | "new"
  | "needs_review"
  | "needs_client_clarification"
  | "accepted"
  | "in_progress"
  | "blocked"
  | "completed"
  | "archived";

export type ClientTeamSubmissionPriority = "low" | "normal" | "high" | "urgent";

export type ClientTeamSubmissionAuthor = "client" | "team";

export type ClientTeamSubmissionSourceChannel =
  | "client_portal"
  | "restaurant_upload"
  | "team_created"
  | "system_seeded";

export type ClientTeamSubmissionWorkType =
  | "content"
  | "media_review"
  | "menu_update"
  | "google_update"
  | "reporting"
  | "client_support";

export type ClientTeamSubmissionTeamWorkStatus =
  | "not_started"
  | "ready_for_team"
  | "in_progress"
  | "waiting_on_client"
  | "ready_for_review"
  | "completed";

export interface ClientTeamSubmission {
  id: string;
  clientId: ClientTeamDemoClientId;
  submittedBy: ClientTeamSubmissionAuthor;
  submissionType: ClientTeamSubmissionType;
  title: string;
  description: string;
  status: ClientTeamSubmissionStatus;
  priority: ClientTeamSubmissionPriority;
  createdAt: string;
  updatedAt: string;
  /** Safe to render on the client portal. */
  clientVisibleNote: string;
  /** Team-only — must never be rendered on client pages. */
  internalTeamNote: string;
  /** The exact next action the client should take, if any. */
  requestedClientAction?: string;
  linkedMediaId?: string;
  linkedWorkItemId?: string;

  // ---------------------------------------------------------------------------
  // Optional workflow-typing fields. When omitted, derivation helpers
  // (`getSubmissionWorkType`, etc.) infer them from existing fields. This
  // keeps fixtures small while letting individual entries override.
  // ---------------------------------------------------------------------------
  sourceChannel?: ClientTeamSubmissionSourceChannel;
  workType?: ClientTeamSubmissionWorkType;
  teamWorkStatus?: ClientTeamSubmissionTeamWorkStatus;
  clientStatusLabel?: string;
  teamStatusLabel?: string;
  nextTeamAction?: string;
  nextClientAction?: string;
}

export type ClientTeamMessageVisibility = "client_and_team" | "team_only";
export type ClientTeamMessageSender = "client" | "team";

export interface ClientTeamMessage {
  id: string;
  clientId: ClientTeamDemoClientId;
  submissionId?: string;
  senderRole: ClientTeamMessageSender;
  body: string;
  createdAt: string;
  visibility: ClientTeamMessageVisibility;
  actionRequired: boolean;
}

export type ClientActionItemStatus = "open" | "waiting_on_team" | "completed";

export interface ClientActionItem {
  id: string;
  clientId: ClientTeamDemoClientId;
  title: string;
  description: string;
  status: ClientActionItemStatus;
  dueLabel: string;
  relatedSubmissionId?: string;
}

export interface ClientTeamWorkSummary {
  totalSubmissions: number;
  newCount: number;
  needsClarificationCount: number;
  blockedCount: number;
  inProgressCount: number;
  completedCount: number;
  openClientActionsCount: number;
}

// ---------------------------------------------------------------------------
// Fixtures — demo-a Demo Grill House (most active), demo-b Demo Taco Bar,
// demo-c Demo Mediterranean Grill, demo-d Demo Cafe.
// ---------------------------------------------------------------------------

export const demoClientTeamSubmissions: ClientTeamSubmission[] = [
  // --- demo-a ---------------------------------------------------------------
  {
    id: "cts-a1",
    clientId: "demo-a",
    submittedBy: "client",
    submissionType: "media",
    title: "Weekend grill photos — 6 shots",
    description:
      "Phone photos from Saturday service. Mostly the ribs platter and the brisket plate. Use whichever look best for next week.",
    status: "in_progress",
    priority: "normal",
    createdAt: "2026-05-24T18:20:00Z",
    updatedAt: "2026-05-27T09:15:00Z",
    clientVisibleNote:
      "Veroxa is reviewing your photos and will draft captions for the strongest shots.",
    internalTeamNote:
      "3 of 6 shots are usable as-is; brisket plate needs lighting crop. Assign to Maya for caption drafts.",
    requestedClientAction: undefined,
    linkedMediaId: "media-a-weekend-grill",
  },
  {
    id: "cts-a2",
    clientId: "demo-a",
    submittedBy: "team",
    submissionType: "question",
    title: "Confirm pricing on the family platter",
    description:
      "We have two different prices on the menu and the website. Which one should we use in next week's promo post?",
    status: "needs_client_clarification",
    priority: "high",
    createdAt: "2026-05-26T14:00:00Z",
    updatedAt: "2026-05-27T10:00:00Z",
    clientVisibleNote:
      "Veroxa needs the correct family platter price before drafting the weekend promo.",
    internalTeamNote:
      "Holding promo draft until owner confirms. Default to website price if no answer by Thu.",
    requestedClientAction:
      "Reply with the correct family platter price (menu vs. website).",
  },
  {
    id: "cts-a3",
    clientId: "demo-a",
    submittedBy: "client",
    submissionType: "promotion",
    title: "Push lunch traffic next week",
    description:
      "Lunch was slow last week. Can we run a midweek lunch focus and a small offer?",
    status: "accepted",
    priority: "high",
    createdAt: "2026-05-25T08:45:00Z",
    updatedAt: "2026-05-26T11:30:00Z",
    clientVisibleNote:
      "Lunch push accepted. Veroxa is drafting 2 lunch posts and 1 Google lunch post.",
    internalTeamNote:
      "Tie to weekly capture plan. Coordinate with direction queue item dir-a-lunch.",
    linkedWorkItemId: "wf-a-lunch-push",
  },
  {
    id: "cts-a4",
    clientId: "demo-a",
    submittedBy: "client",
    submissionType: "correction",
    title: "Hours changed for the long weekend",
    description:
      "Closing at 9 PM Friday and Saturday next weekend. Please make sure Google shows the right hours.",
    status: "completed",
    priority: "normal",
    createdAt: "2026-05-20T16:10:00Z",
    updatedAt: "2026-05-22T09:00:00Z",
    clientVisibleNote:
      "Updated hours have been posted to your Google profile and noted internally.",
    internalTeamNote:
      "Google special hours pushed; revert to default after the long weekend.",
  },
  {
    id: "cts-a5",
    clientId: "demo-a",
    submittedBy: "team",
    submissionType: "media",
    title: "Need 2–3 dessert photos",
    description:
      "We are low on dessert content for the weekend evening slot. A few quick phone shots would help.",
    status: "blocked",
    priority: "normal",
    createdAt: "2026-05-23T20:00:00Z",
    updatedAt: "2026-05-27T08:00:00Z",
    clientVisibleNote:
      "Veroxa is waiting on 2–3 dessert photos before scheduling Saturday evening content.",
    internalTeamNote:
      "Blocked on client. If nothing by Fri, swap to evergreen dessert from media library.",
    requestedClientAction:
      "Send 2–3 phone photos of a dessert (any angle) when you get a moment.",
  },

  // --- demo-b ---------------------------------------------------------------
  {
    id: "cts-b1",
    clientId: "demo-b",
    submittedBy: "client",
    submissionType: "menu_update",
    title: "New taco — Birria Special",
    description:
      "Adding a Birria Special starting next week. $14, dinner only. Please feature.",
    status: "in_progress",
    priority: "high",
    createdAt: "2026-05-25T12:00:00Z",
    updatedAt: "2026-05-27T11:00:00Z",
    clientVisibleNote:
      "Veroxa is drafting a launch post, a Google post, and a Reel for the Birria Special.",
    internalTeamNote:
      "Owner sent ingredient list — pull a hero shot from upload inbox first if possible.",
    linkedWorkItemId: "wf-b-birria-launch",
  },
  {
    id: "cts-b2",
    clientId: "demo-b",
    submittedBy: "team",
    submissionType: "question",
    title: "Is the salsa bar back this week?",
    description:
      "We saw an upload tagged 'salsa bar'. Want to confirm before we feature it as available.",
    status: "needs_client_clarification",
    priority: "normal",
    createdAt: "2026-05-26T09:00:00Z",
    updatedAt: "2026-05-26T09:00:00Z",
    clientVisibleNote:
      "Quick confirm — is the salsa bar open again this week?",
    internalTeamNote: "Hold any 'salsa bar back' messaging until confirmed.",
    requestedClientAction: "Reply yes/no on salsa bar availability.",
  },
  {
    id: "cts-b3",
    clientId: "demo-b",
    submittedBy: "client",
    submissionType: "general_request",
    title: "Quiet Tuesdays — ideas?",
    description: "Tuesdays are slow. Open to ideas to drive traffic.",
    status: "new",
    priority: "normal",
    createdAt: "2026-05-27T07:30:00Z",
    updatedAt: "2026-05-27T07:30:00Z",
    clientVisibleNote:
      "Received — Veroxa will come back with 2–3 Tuesday ideas this week.",
    internalTeamNote:
      "Pair with adaptive 'slow_day' recs; consider $X taco-Tuesday angle.",
  },

  // --- demo-c ---------------------------------------------------------------
  {
    id: "cts-c1",
    clientId: "demo-c",
    submittedBy: "client",
    submissionType: "access_info",
    title: "New Instagram password",
    description:
      "We rotated the Instagram password. Sending the new one securely.",
    status: "completed",
    priority: "high",
    createdAt: "2026-05-18T10:00:00Z",
    updatedAt: "2026-05-18T15:00:00Z",
    clientVisibleNote: "New Instagram access received and confirmed working.",
    internalTeamNote: "Stored in shared vault. Old token removed.",
  },
  {
    id: "cts-c2",
    clientId: "demo-c",
    submittedBy: "team",
    submissionType: "media",
    title: "Interior photos needed for Google",
    description:
      "Google profile is missing recent interior shots. Could you send 3–4 from this week?",
    status: "needs_client_clarification",
    priority: "normal",
    createdAt: "2026-05-24T13:00:00Z",
    updatedAt: "2026-05-26T16:00:00Z",
    clientVisibleNote:
      "Veroxa is asking for 3–4 fresh interior photos to refresh your Google profile.",
    internalTeamNote:
      "Last interior shots are 4 months old. Will affect Google visibility score if not refreshed.",
    requestedClientAction:
      "Send 3–4 phone photos of the dining room when convenient.",
  },
  {
    id: "cts-c3",
    clientId: "demo-c",
    submittedBy: "client",
    submissionType: "promotion",
    title: "Mother's Day brunch — recap",
    description: "Brunch was full. Please share a thank-you post.",
    status: "in_progress",
    priority: "normal",
    createdAt: "2026-05-12T20:00:00Z",
    updatedAt: "2026-05-15T10:00:00Z",
    clientVisibleNote:
      "Thank-you post is drafted — Veroxa will share for your review shortly.",
    internalTeamNote: "Use brunch hero shot from May 11 upload batch.",
  },

  // --- demo-d ---------------------------------------------------------------
  {
    id: "cts-d1",
    clientId: "demo-d",
    submittedBy: "team",
    submissionType: "general_request",
    title: "Welcome — onboarding checklist",
    description:
      "Welcome to Veroxa. A short onboarding checklist is in your portal.",
    status: "accepted",
    priority: "normal",
    createdAt: "2026-05-19T09:00:00Z",
    updatedAt: "2026-05-21T11:00:00Z",
    clientVisibleNote:
      "Onboarding checklist is open in your portal — finish at your own pace.",
    internalTeamNote:
      "Account is paused while owner completes onboarding. Resume after media + brand basics arrive.",
  },
  {
    id: "cts-d2",
    clientId: "demo-d",
    submittedBy: "team",
    submissionType: "question",
    title: "Brand colors and logo file",
    description:
      "Could you send your logo (PNG or SVG) and 1–2 brand colors so captions and overlays match your look?",
    status: "needs_client_clarification",
    priority: "high",
    createdAt: "2026-05-21T14:00:00Z",
    updatedAt: "2026-05-25T09:00:00Z",
    clientVisibleNote:
      "Veroxa needs your logo and brand colors before drafting your first posts.",
    internalTeamNote:
      "Hard block on first content batch until brand kit arrives.",
    requestedClientAction:
      "Reply with logo file and 1–2 brand colors (HEX is fine).",
  },
];

export const demoClientTeamMessages: ClientTeamMessage[] = [
  // demo-a — family platter price thread
  {
    id: "ctm-a1-1",
    clientId: "demo-a",
    submissionId: "cts-a2",
    senderRole: "team",
    body: "Quick one — your menu shows $42 for the family platter and the site shows $39. Which should we use in the weekend post?",
    createdAt: "2026-05-26T14:00:00Z",
    visibility: "client_and_team",
    actionRequired: true,
  },
  {
    id: "ctm-a1-2",
    clientId: "demo-a",
    submissionId: "cts-a2",
    senderRole: "team",
    body: "Internal: default to website ($39) if no reply by Thu; owner usually responds in the evening.",
    createdAt: "2026-05-26T14:05:00Z",
    visibility: "team_only",
    actionRequired: false,
  },
  // demo-a — weekend grill photos thread
  {
    id: "ctm-a2-1",
    clientId: "demo-a",
    submissionId: "cts-a1",
    senderRole: "client",
    body: "Sent the weekend shots — use whatever looks best.",
    createdAt: "2026-05-24T18:22:00Z",
    visibility: "client_and_team",
    actionRequired: false,
  },
  {
    id: "ctm-a2-2",
    clientId: "demo-a",
    submissionId: "cts-a1",
    senderRole: "team",
    body: "Got them, thank you. Drafting captions for the three strongest shots — you'll see them in Updates by Wed.",
    createdAt: "2026-05-25T09:00:00Z",
    visibility: "client_and_team",
    actionRequired: false,
  },
  // demo-a — dessert photos blocked thread
  {
    id: "ctm-a3-1",
    clientId: "demo-a",
    submissionId: "cts-a5",
    senderRole: "team",
    body: "Whenever you get a minute, 2–3 dessert phone shots would unlock Saturday evening content.",
    createdAt: "2026-05-23T20:00:00Z",
    visibility: "client_and_team",
    actionRequired: true,
  },

  // demo-b — salsa bar thread
  {
    id: "ctm-b1-1",
    clientId: "demo-b",
    submissionId: "cts-b2",
    senderRole: "team",
    body: "Saw a salsa-bar upload — is it back this week so we can feature it?",
    createdAt: "2026-05-26T09:00:00Z",
    visibility: "client_and_team",
    actionRequired: true,
  },
  // demo-b — Birria launch
  {
    id: "ctm-b2-1",
    clientId: "demo-b",
    submissionId: "cts-b1",
    senderRole: "team",
    body: "Birria Special launch is being drafted — launch post, Google post, and a short Reel. We'll share for your review first.",
    createdAt: "2026-05-25T13:00:00Z",
    visibility: "client_and_team",
    actionRequired: false,
  },
  {
    id: "ctm-b2-2",
    clientId: "demo-b",
    submissionId: "cts-b1",
    senderRole: "team",
    body: "Internal: pull hero from upload inbox before drafting; coordinate with media review.",
    createdAt: "2026-05-25T13:05:00Z",
    visibility: "team_only",
    actionRequired: false,
  },

  // demo-c — interior photos
  {
    id: "ctm-c1-1",
    clientId: "demo-c",
    submissionId: "cts-c2",
    senderRole: "team",
    body: "Quick ask — 3–4 fresh interior photos would really help your Google profile.",
    createdAt: "2026-05-24T13:00:00Z",
    visibility: "client_and_team",
    actionRequired: true,
  },

  // demo-d — brand kit
  {
    id: "ctm-d1-1",
    clientId: "demo-d",
    submissionId: "cts-d2",
    senderRole: "team",
    body: "Welcome aboard. To get your first posts looking on-brand, could you send your logo and 1–2 brand colors?",
    createdAt: "2026-05-21T14:00:00Z",
    visibility: "client_and_team",
    actionRequired: true,
  },
  {
    id: "ctm-d1-2",
    clientId: "demo-d",
    submissionId: "cts-d2",
    senderRole: "team",
    body: "Internal: first content batch is hard-blocked until brand kit arrives.",
    createdAt: "2026-05-21T14:05:00Z",
    visibility: "team_only",
    actionRequired: false,
  },
];

export const demoClientActionItems: ClientActionItem[] = [
  {
    id: "cai-a1",
    clientId: "demo-a",
    title: "Confirm family platter price",
    description: "Veroxa needs the correct price before the weekend promo.",
    status: "open",
    dueLabel: "By Thu",
    relatedSubmissionId: "cts-a2",
  },
  {
    id: "cai-a2",
    clientId: "demo-a",
    title: "Send 2–3 dessert photos",
    description:
      "Unlocks Saturday evening dessert content. Phone photos are fine.",
    status: "open",
    dueLabel: "This week",
    relatedSubmissionId: "cts-a5",
  },
  {
    id: "cai-a3",
    clientId: "demo-a",
    title: "Review weekend grill captions",
    description: "Captions will land in your Updates tab by Wed.",
    status: "waiting_on_team",
    dueLabel: "Veroxa is preparing",
    relatedSubmissionId: "cts-a1",
  },
  {
    id: "cai-b1",
    clientId: "demo-b",
    title: "Confirm salsa bar availability",
    description: "Yes/no is enough — we'll feature it accordingly.",
    status: "open",
    dueLabel: "This week",
    relatedSubmissionId: "cts-b2",
  },
  {
    id: "cai-c1",
    clientId: "demo-c",
    title: "Send 3–4 interior photos",
    description: "Will refresh your Google profile.",
    status: "open",
    dueLabel: "This week",
    relatedSubmissionId: "cts-c2",
  },
  {
    id: "cai-d1",
    clientId: "demo-d",
    title: "Send logo + 1–2 brand colors",
    description: "Required before Veroxa drafts your first posts.",
    status: "open",
    dueLabel: "ASAP",
    relatedSubmissionId: "cts-d2",
  },
];

// ---------------------------------------------------------------------------
// Helpers — read-only.
// ---------------------------------------------------------------------------

export function getClientTeamSubmissions(): ClientTeamSubmission[] {
  return demoClientTeamSubmissions;
}

export function getSubmissionsForClient(clientId: string): ClientTeamSubmission[] {
  return demoClientTeamSubmissions.filter((s) => s.clientId === clientId);
}

export function getOpenClientActions(clientId: string): ClientActionItem[] {
  return demoClientActionItems.filter(
    (a) => a.clientId === clientId && a.status !== "completed",
  );
}

export function getTeamInboxSubmissions(): ClientTeamSubmission[] {
  return demoClientTeamSubmissions.filter(
    (s) => s.status === "new" || s.status === "needs_review",
  );
}

export function getBlockedSubmissions(): ClientTeamSubmission[] {
  return demoClientTeamSubmissions.filter((s) => s.status === "blocked");
}

export function getClientTeamMessages(clientId: string): ClientTeamMessage[] {
  return demoClientTeamMessages.filter((m) => m.clientId === clientId);
}

export function getSubmissionMessages(submissionId: string): ClientTeamMessage[] {
  return demoClientTeamMessages.filter((m) => m.submissionId === submissionId);
}

export function getClientTeamWorkSummary(): ClientTeamWorkSummary {
  const subs = demoClientTeamSubmissions;
  return {
    totalSubmissions: subs.length,
    newCount: subs.filter((s) => s.status === "new").length,
    needsClarificationCount: subs.filter(
      (s) => s.status === "needs_client_clarification",
    ).length,
    blockedCount: subs.filter((s) => s.status === "blocked").length,
    inProgressCount: subs.filter((s) => s.status === "in_progress").length,
    completedCount: subs.filter((s) => s.status === "completed").length,
    openClientActionsCount: demoClientActionItems.filter(
      (a) => a.status === "open",
    ).length,
  };
}

export const clientTeamSubmissionStatusLabels: Record<
  ClientTeamSubmissionStatus,
  string
> = {
  new: "New",
  needs_review: "Needs review",
  needs_client_clarification: "Needs your input",
  accepted: "Accepted",
  in_progress: "In progress",
  blocked: "Blocked",
  completed: "Completed",
  archived: "Archived",
};

export const clientTeamSubmissionPriorityLabels: Record<
  ClientTeamSubmissionPriority,
  string
> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const clientTeamSubmissionTypeLabels: Record<
  ClientTeamSubmissionType,
  string
> = {
  media: "Media",
  menu_update: "Menu update",
  promotion: "Promotion",
  correction: "Correction",
  question: "Question",
  access_info: "Access info",
  general_request: "General request",
};

// ---------------------------------------------------------------------------
// Derivation helpers — preferred over bloating every fixture.
// These map existing `submissionType` + `status` + `submittedBy` to the new
// workflow-typing fields so client/team pages can read normalized work-item
// shapes without each fixture having to spell them out.
// ---------------------------------------------------------------------------

export function getSubmissionWorkType(
  submission: ClientTeamSubmission,
): ClientTeamSubmissionWorkType {
  if (submission.workType) return submission.workType;
  switch (submission.submissionType) {
    case "media":
      return "media_review";
    case "menu_update":
      return "menu_update";
    case "promotion":
      return "content";
    case "correction":
      return "google_update";
    case "access_info":
      return "client_support";
    case "question":
      return "client_support";
    case "general_request":
      return "client_support";
  }
}

export function getSubmissionTeamWorkStatus(
  submission: ClientTeamSubmission,
): ClientTeamSubmissionTeamWorkStatus {
  if (submission.teamWorkStatus) return submission.teamWorkStatus;
  switch (submission.status) {
    case "new":
      return "ready_for_team";
    case "needs_review":
      return "ready_for_team";
    case "needs_client_clarification":
      return "waiting_on_client";
    case "blocked":
      return "waiting_on_client";
    case "accepted":
      return "in_progress";
    case "in_progress":
      return "in_progress";
    case "completed":
      return "completed";
    case "archived":
      return "completed";
  }
}

export function getSubmissionClientStatusLabel(
  submission: ClientTeamSubmission,
): string {
  if (submission.clientStatusLabel) return submission.clientStatusLabel;
  switch (submission.status) {
    case "new":
    case "needs_review":
      return "Received by Veroxa";
    case "needs_client_clarification":
      return "Veroxa needs your input";
    case "blocked":
      return "Waiting on you";
    case "accepted":
      return "Accepted — in progress";
    case "in_progress":
      return "Veroxa is working on it";
    case "completed":
      return "Completed";
    case "archived":
      return "Closed";
  }
}

export function getSubmissionTeamStatusLabel(
  submission: ClientTeamSubmission,
): string {
  if (submission.teamStatusLabel) return submission.teamStatusLabel;
  return clientTeamSubmissionStatusLabels[submission.status];
}

export function getSubmissionNextTeamAction(
  submission: ClientTeamSubmission,
): string {
  if (submission.nextTeamAction) return submission.nextTeamAction;
  switch (submission.status) {
    case "new":
      return "Triage and accept or send a clarification.";
    case "needs_review":
      return "Review the submission and decide on next steps.";
    case "needs_client_clarification":
      return "Wait for client reply, then resume.";
    case "blocked":
      return "Follow up with the client; swap to evergreen if no reply.";
    case "accepted":
      return "Start execution per the accepted scope.";
    case "in_progress":
      return "Continue execution; share draft for client review when ready.";
    case "completed":
      return "Confirm with client and close out.";
    case "archived":
      return "No action — archived.";
  }
}

export function getSubmissionNextClientAction(
  submission: ClientTeamSubmission,
): string | undefined {
  if (submission.nextClientAction) return submission.nextClientAction;
  if (submission.requestedClientAction) return submission.requestedClientAction;
  if (submission.status === "blocked" || submission.status === "needs_client_clarification") {
    return "Reply to Veroxa with the requested info when you can.";
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Query helpers — read-only filters over the fixture arrays.
// ---------------------------------------------------------------------------

export function getActiveSubmissionsForClient(
  clientId: string,
): ClientTeamSubmission[] {
  return demoClientTeamSubmissions.filter(
    (s) =>
      s.clientId === clientId &&
      s.status !== "completed" &&
      s.status !== "archived",
  );
}

export function getClientActionableSubmissions(
  clientId: string,
): ClientTeamSubmission[] {
  return demoClientTeamSubmissions.filter(
    (s) =>
      s.clientId === clientId &&
      (s.status === "needs_client_clarification" || s.status === "blocked"),
  );
}

export function getTeamReadySubmissions(): ClientTeamSubmission[] {
  return demoClientTeamSubmissions.filter(
    (s) => s.status === "new" || s.status === "needs_review",
  );
}

export function getTeamWaitingOnClientSubmissions(): ClientTeamSubmission[] {
  return demoClientTeamSubmissions.filter(
    (s) => s.status === "needs_client_clarification" || s.status === "blocked",
  );
}

export function getCompletedSubmissionsForClient(
  clientId: string,
): ClientTeamSubmission[] {
  return demoClientTeamSubmissions.filter(
    (s) => s.clientId === clientId && s.status === "completed",
  );
}

export function getSubmissionById(
  submissionId: string,
): ClientTeamSubmission | undefined {
  return demoClientTeamSubmissions.find((s) => s.id === submissionId);
}

// ---------------------------------------------------------------------------
// Status history — `client_team_status_events` (future Supabase table).
// Captures the audit trail of how a submission moved through statuses.
// `clientVisible` is the hard switch that decides whether a client portal is
// allowed to render the event. Internal-only events (e.g. assignments,
// internal triage notes) stay `clientVisible: false`.
// ---------------------------------------------------------------------------

export type ClientTeamStatusActorRole = "client" | "team" | "system";

export interface ClientTeamStatusEvent {
  id: string;
  clientId: ClientTeamDemoClientId;
  submissionId: string;
  fromStatus?: ClientTeamSubmissionStatus;
  toStatus: ClientTeamSubmissionStatus;
  actorRole: ClientTeamStatusActorRole;
  note: string;
  clientVisible: boolean;
  createdAt: string;
}

export const demoClientTeamStatusEvents: ClientTeamStatusEvent[] = [
  // cts-a1 — weekend grill photos
  {
    id: "cte-a1-1",
    clientId: "demo-a",
    submissionId: "cts-a1",
    toStatus: "new",
    actorRole: "client",
    note: "Weekend grill photos received from owner.",
    clientVisible: true,
    createdAt: "2026-05-24T18:20:00Z",
  },
  {
    id: "cte-a1-2",
    clientId: "demo-a",
    submissionId: "cts-a1",
    fromStatus: "new",
    toStatus: "in_progress",
    actorRole: "team",
    note: "Veroxa is drafting captions for the strongest shots.",
    clientVisible: true,
    createdAt: "2026-05-25T09:15:00Z",
  },
  {
    id: "cte-a1-3",
    clientId: "demo-a",
    submissionId: "cts-a1",
    fromStatus: "in_progress",
    toStatus: "in_progress",
    actorRole: "team",
    note: "Assigned to Maya for caption drafts; brisket plate flagged for lighting crop.",
    clientVisible: false,
    createdAt: "2026-05-25T09:30:00Z",
  },
  // cts-a2 — family platter price
  {
    id: "cte-a2-1",
    clientId: "demo-a",
    submissionId: "cts-a2",
    toStatus: "needs_client_clarification",
    actorRole: "team",
    note: "Veroxa needs the correct family platter price before drafting the weekend promo.",
    clientVisible: true,
    createdAt: "2026-05-26T14:00:00Z",
  },
  // cts-a5 — dessert photos blocked
  {
    id: "cte-a5-1",
    clientId: "demo-a",
    submissionId: "cts-a5",
    fromStatus: "new",
    toStatus: "blocked",
    actorRole: "team",
    note: "Waiting on 2–3 dessert photos to unlock Saturday evening content.",
    clientVisible: true,
    createdAt: "2026-05-23T20:00:00Z",
  },
  {
    id: "cte-a5-2",
    clientId: "demo-a",
    submissionId: "cts-a5",
    toStatus: "blocked",
    actorRole: "system",
    note: "Fallback plan: swap to evergreen dessert if no reply by Friday.",
    clientVisible: false,
    createdAt: "2026-05-25T08:00:00Z",
  },
  // cts-b1 — Birria launch
  {
    id: "cte-b1-1",
    clientId: "demo-b",
    submissionId: "cts-b1",
    toStatus: "in_progress",
    actorRole: "team",
    note: "Drafting launch post, Google post, and Reel for the Birria Special.",
    clientVisible: true,
    createdAt: "2026-05-25T13:00:00Z",
  },
  // cts-c2 — interior photos
  {
    id: "cte-c2-1",
    clientId: "demo-c",
    submissionId: "cts-c2",
    toStatus: "needs_client_clarification",
    actorRole: "team",
    note: "Asked for 3–4 fresh interior photos for Google profile refresh.",
    clientVisible: true,
    createdAt: "2026-05-24T13:00:00Z",
  },
  {
    id: "cte-c2-2",
    clientId: "demo-c",
    submissionId: "cts-c2",
    toStatus: "needs_client_clarification",
    actorRole: "system",
    note: "Last interior shots are 4 months old — will affect Google visibility score.",
    clientVisible: false,
    createdAt: "2026-05-24T13:05:00Z",
  },
  // cts-a4 — hours change (completed)
  {
    id: "cte-a4-1",
    clientId: "demo-a",
    submissionId: "cts-a4",
    fromStatus: "accepted",
    toStatus: "completed",
    actorRole: "team",
    note: "Updated long-weekend hours posted to your Google profile.",
    clientVisible: true,
    createdAt: "2026-05-22T09:00:00Z",
  },
  // cts-d2 — brand kit
  {
    id: "cte-d2-1",
    clientId: "demo-d",
    submissionId: "cts-d2",
    toStatus: "needs_client_clarification",
    actorRole: "team",
    note: "Veroxa needs your logo and brand colors before drafting your first posts.",
    clientVisible: true,
    createdAt: "2026-05-21T14:00:00Z",
  },
];

export function getStatusEventsForSubmission(
  submissionId: string,
): ClientTeamStatusEvent[] {
  return demoClientTeamStatusEvents
    .filter((e) => e.submissionId === submissionId)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

export function getClientVisibleStatusEvents(
  clientId: string,
): ClientTeamStatusEvent[] {
  return demoClientTeamStatusEvents
    .filter((e) => e.clientId === clientId && e.clientVisible)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getTeamStatusEvents(
  clientId: string,
): ClientTeamStatusEvent[] {
  return demoClientTeamStatusEvents
    .filter((e) => e.clientId === clientId)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getLatestStatusEventForSubmission(
  submissionId: string,
): ClientTeamStatusEvent | undefined {
  const events = getStatusEventsForSubmission(submissionId);
  return events.length > 0 ? events[events.length - 1] : undefined;
}
