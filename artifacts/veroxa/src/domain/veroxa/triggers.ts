import type {
  ActivityLog,
  ActivityLogActor,
  Client,
  ContentConcept,
  DraftSet,
  DraftVariant,
  MediaAsset,
  MonthlyReport,
  Notification,
  Post,
  WeeklyReport,
} from "./types";

export type AutomationTriggerName =
  | "client_signed_onboarding_started"
  | "media_uploaded"
  | "media_marked_usable"
  | "concept_approved"
  | "draft_set_generated"
  | "draft_variant_approved"
  | "post_scheduled"
  | "post_published"
  | "post_failed"
  | "content_supply_low"
  | "weekly_report_generated"
  | "monthly_report_submitted_for_approval"
  | "monthly_report_approved";

export interface TriggerResult<TRecord> {
  trigger: AutomationTriggerName;
  record: TRecord;
  activityLog: ActivityLog;
  notifications: Notification[];
}

function stamp(now?: string): string {
  return now ?? new Date().toISOString();
}

function activity(params: {
  clientId: string;
  trigger: AutomationTriggerName;
  actor?: ActivityLogActor;
  summary: string;
  now: string;
}): ActivityLog {
  return {
    id: `act-${params.trigger}-${params.now}`,
    clientId: params.clientId,
    createdAt: params.now,
    updatedAt: params.now,
    actor: params.actor ?? "system",
    visibility: "internal",
    action: params.trigger,
    summary: params.summary,
  };
}

function notification(params: {
  clientId: string;
  audience: Notification["audience"];
  kind: Notification["kind"];
  title: string;
  message: string;
  now: string;
}): Notification {
  return {
    id: `note-${params.kind}-${params.now}`,
    clientId: params.clientId,
    audience: params.audience,
    kind: params.kind,
    status: "unread",
    title: params.title,
    message: params.message,
    createdAt: params.now,
    updatedAt: params.now,
  };
}

export function onClientSignedOnboardingStarted(
  client: Client,
  now = stamp(),
): TriggerResult<Client> {
  const record: Client = { ...client, status: "onboarding", updatedAt: now };
  return {
    trigger: "client_signed_onboarding_started",
    record,
    activityLog: activity({
      clientId: client.id,
      trigger: "client_signed_onboarding_started",
      summary: "Onboarding started.",
      now,
    }),
    notifications: [
      notification({
        clientId: client.id,
        audience: "team",
        kind: "team_review",
        title: "Onboarding started",
        message: "Review the onboarding checklist and next client input.",
        now,
      }),
    ],
  };
}

export function onMediaUploaded(
  asset: MediaAsset,
  now = stamp(),
): TriggerResult<MediaAsset> {
  const record: MediaAsset = {
    ...asset,
    status: "uploaded",
    updatedAt: now,
    uploadedAt: asset.uploadedAt || now,
  };
  return {
    trigger: "media_uploaded",
    record,
    activityLog: activity({
      clientId: asset.clientId,
      trigger: "media_uploaded",
      actor: "client",
      summary: "New media was uploaded for Veroxa review.",
      now,
    }),
    notifications: [
      notification({
        clientId: asset.clientId,
        audience: "team",
        kind: "team_review",
        title: "New upload ready",
        message: "Review the new client media upload.",
        now,
      }),
    ],
  };
}

export function onMediaMarkedUsable(
  asset: MediaAsset,
  now = stamp(),
): TriggerResult<MediaAsset> {
  const record: MediaAsset = { ...asset, status: "usable", updatedAt: now };
  return {
    trigger: "media_marked_usable",
    record,
    activityLog: activity({
      clientId: asset.clientId,
      trigger: "media_marked_usable",
      actor: "team",
      summary: "Media marked usable for future content.",
      now,
    }),
    notifications: [],
  };
}

export function onConceptApproved(
  concept: ContentConcept,
  now = stamp(),
): TriggerResult<ContentConcept> {
  const record: ContentConcept = {
    ...concept,
    status: "approved",
    updatedAt: now,
  };
  return baseTeamTrigger(
    "concept_approved",
    record,
    "Content concept approved for drafting.",
    now,
  );
}

export function onDraftSetGenerated(
  draftSet: DraftSet,
  now = stamp(),
): TriggerResult<DraftSet> {
  const record: DraftSet = {
    ...draftSet,
    status: "generated",
    generatedAt: draftSet.generatedAt ?? now,
    updatedAt: now,
  };
  return baseTeamTrigger(
    "draft_set_generated",
    record,
    "Draft set prepared for team review.",
    now,
  );
}

export function onDraftVariantApproved(
  variant: DraftVariant,
  now = stamp(),
): TriggerResult<DraftVariant> {
  const record: DraftVariant = {
    ...variant,
    status: "approved",
    updatedAt: now,
  };
  return baseTeamTrigger(
    "draft_variant_approved",
    record,
    "Draft variant approved for post preparation.",
    now,
  );
}

export function onPostScheduled(
  post: Post,
  scheduledFor: string,
  now = stamp(),
): TriggerResult<Post> {
  const record: Post = {
    ...post,
    status: "scheduled",
    scheduledFor,
    updatedAt: now,
  };
  return baseTeamTrigger(
    "post_scheduled",
    record,
    "Post scheduled. No external publishing is triggered by this skeleton.",
    now,
  );
}

export function onPostPublished(
  post: Post,
  now = stamp(),
): TriggerResult<Post> {
  const record: Post = {
    ...post,
    status: "published",
    publishedAt: now,
    updatedAt: now,
  };
  return {
    trigger: "post_published",
    record,
    activityLog: activity({
      clientId: post.clientId,
      trigger: "post_published",
      actor: "team",
      summary: "Post marked published after Veroxa team review.",
      now,
    }),
    notifications: [
      notification({
        clientId: post.clientId,
        audience: "client",
        kind: "post_published",
        title: "Update published",
        message: "A Veroxa-prepared update has been published.",
        now,
      }),
    ],
  };
}

export function onPostFailed(
  post: Post,
  reason: string,
  now = stamp(),
): TriggerResult<Post> {
  const record: Post = {
    ...post,
    status: "failed",
    internalFailureReason: reason,
    updatedAt: now,
  };
  return {
    trigger: "post_failed",
    record,
    activityLog: activity({
      clientId: post.clientId,
      trigger: "post_failed",
      actor: "team",
      summary: "Post needs Veroxa team attention before it can move forward.",
      now,
    }),
    notifications: [
      notification({
        clientId: post.clientId,
        audience: "team",
        kind: "team_review",
        title: "Post needs review",
        message: "Review the queued post and decide the next safe step.",
        now,
      }),
    ],
  };
}

export function onContentSupplyLow(
  clientId: string,
  now = stamp(),
): TriggerResult<{ clientId: string }> {
  return {
    trigger: "content_supply_low",
    record: { clientId },
    activityLog: activity({
      clientId,
      trigger: "content_supply_low",
      summary: "Content supply is running low.",
      now,
    }),
    notifications: [
      notification({
        clientId,
        audience: "client",
        kind: "upload_reminder",
        title: "Fresh content needed",
        message: "Please send a few fresh photos or videos when you can.",
        now,
      }),
      notification({
        clientId,
        audience: "team",
        kind: "content_supply_low",
        title: "Content supply low",
        message: "Review content supply and next upload reminder.",
        now,
      }),
    ],
  };
}

export function onWeeklyReportGenerated(
  report: WeeklyReport,
  now = stamp(),
): TriggerResult<WeeklyReport> {
  const record: WeeklyReport = {
    ...report,
    status: "team_validation",
    updatedAt: now,
  };
  return baseTeamTrigger(
    "weekly_report_generated",
    record,
    "Weekly report prepared for Veroxa team validation.",
    now,
  );
}

export function onMonthlyReportSubmittedForApproval(
  report: MonthlyReport,
  now = stamp(),
): TriggerResult<MonthlyReport> {
  const record: MonthlyReport = {
    ...report,
    status: "submitted_for_operator_approval",
    updatedAt: now,
  };
  return {
    trigger: "monthly_report_submitted_for_approval",
    record,
    activityLog: activity({
      clientId: report.clientId,
      trigger: "monthly_report_submitted_for_approval",
      actor: "team",
      summary: "Monthly report submitted for operator approval.",
      now,
    }),
    notifications: [
      notification({
        clientId: report.clientId,
        audience: "operator",
        kind: "monthly_report",
        title: "Monthly report ready",
        message: "Review and approve the monthly report when ready.",
        now,
      }),
    ],
  };
}

export function onMonthlyReportApproved(
  report: MonthlyReport,
  now = stamp(),
): TriggerResult<MonthlyReport> {
  const record: MonthlyReport = {
    ...report,
    status: "operator_approved",
    operatorApprovedAt: now,
    updatedAt: now,
  };
  return baseTeamTrigger(
    "monthly_report_approved",
    record,
    "Monthly report approved for client-ready preparation.",
    now,
  );
}

function baseTeamTrigger<TRecord extends { clientId: string }>(
  trigger: AutomationTriggerName,
  record: TRecord,
  summary: string,
  now: string,
): TriggerResult<TRecord> {
  return {
    trigger,
    record,
    activityLog: activity({
      clientId: record.clientId,
      trigger,
      actor: "team",
      summary,
      now,
    }),
    notifications: [],
  };
}
