import type {
  Client,
  ClientPlatform,
  DataConfidence,
  MediaAsset,
  MonthlyReport,
  Notification,
  OnboardingItem,
  Post,
  WeeklyReport,
} from "./types";
import {
  buildContentSupplySnapshot,
  type ContentSupplySnapshot,
} from "./contentHealth";

export interface ClientSafeMetric {
  label: string;
  value: string;
  confidence: DataConfidence;
  helperText?: string;
}

export interface ClientSafeProgressItem {
  id: string;
  title: string;
  statusLabel: string;
  needsClientInput: boolean;
  nextStep?: string;
}

export interface ClientSafePostSummary {
  id: string;
  platform: string;
  statusLabel: "Prepared by Veroxa" | "Scheduled" | "Published" | "In review";
  summary: string;
  scheduledFor?: string;
  publishedAt?: string;
}

export interface ClientSafeReportSummary {
  id: string;
  period: string;
  statusLabel: string;
  summary: string;
  metrics: ClientSafeMetric[];
}

export interface ClientSafeNotification {
  id: string;
  title: string;
  message: string;
  status: "unread" | "read" | "dismissed";
  createdAt: string;
}

export interface ClientPortalViewModel {
  clientId: string;
  businessName: string;
  onboardingProgress: {
    completed: number;
    total: number;
    percent: number;
    items: ClientSafeProgressItem[];
  };
  contentSupply: ContentSupplySnapshot;
  weeklyUpdates: ClientSafeReportSummary[];
  monthlyReports: ClientSafeReportSummary[];
  upcomingContent: ClientSafePostSummary[];
  publishedContent: ClientSafePostSummary[];
  localVisibilityProgress: ClientSafeMetric[];
  notifications: ClientSafeNotification[];
}

export interface ClientPortalViewModelInput {
  client: Client;
  onboardingItems?: OnboardingItem[];
  platforms?: ClientPlatform[];
  mediaAssets?: MediaAsset[];
  posts?: Post[];
  weeklyReports?: WeeklyReport[];
  monthlyReports?: MonthlyReport[];
  notifications?: Notification[];
  postingFrequencyWeekly?: number;
}

const platformLabels: Record<string, string> = {
  google_business_profile: "Google Business Profile",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  website: "Website",
  ordering: "Online ordering",
  other: "Other",
};

export function toClientSafePortalViewModel(
  input: ClientPortalViewModelInput,
): ClientPortalViewModel {
  const onboardingItems = input.onboardingItems ?? [];
  const mediaAssets = input.mediaAssets ?? [];
  const posts = input.posts ?? [];
  const weeklyReports = input.weeklyReports ?? [];
  const monthlyReports = input.monthlyReports ?? [];
  const completed = onboardingItems.filter(
    (item) => item.status === "complete",
  ).length;
  const total = onboardingItems.length;

  return {
    clientId: input.client.id,
    businessName: input.client.businessName,
    onboardingProgress: {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      items: onboardingItems.map(toClientSafeProgressItem),
    },
    contentSupply: buildContentSupplySnapshot({
      mediaAssets,
      posts,
      postingFrequencyWeekly: input.postingFrequencyWeekly ?? 0,
    }),
    weeklyUpdates: weeklyReports.map(toClientSafeWeeklyReport),
    monthlyReports: monthlyReports.map(toClientSafeMonthlyReport),
    upcomingContent: posts
      .filter(
        (post) =>
          post.status === "queued_for_later" ||
          post.status === "scheduled" ||
          post.status === "approved",
      )
      .map(toClientSafePostSummary),
    publishedContent: posts
      .filter((post) => post.status === "published")
      .map(toClientSafePostSummary),
    localVisibilityProgress: toClientSafeVisibilityMetrics(
      input.platforms ?? [],
    ),
    notifications: (input.notifications ?? [])
      .filter((notification) => notification.audience === "client")
      .map(toClientSafeNotification),
  };
}

export function toClientSafeProgressItem(
  item: OnboardingItem,
): ClientSafeProgressItem {
  return {
    id: item.id,
    title: item.title,
    statusLabel: onboardingStatusLabel(item.status),
    needsClientInput: item.status === "needs_client_input",
    nextStep: item.clientSafeNextStep,
  };
}

export function toClientSafePostSummary(post: Post): ClientSafePostSummary {
  return {
    id: post.id,
    platform: platformLabels[post.platform] ?? "Content channel",
    statusLabel: postStatusLabel(post.status),
    summary: post.clientSafeSummary || "Content update prepared by Veroxa.",
    scheduledFor: post.scheduledFor,
    publishedAt: post.publishedAt,
  };
}

export function toClientSafeWeeklyReport(
  report: WeeklyReport,
): ClientSafeReportSummary {
  return {
    id: report.id,
    period: `${report.weekStart} — ${report.weekEnd}`,
    statusLabel: weeklyStatusLabel(report.status),
    summary: `Veroxa prepared ${report.postsPlanned} planned update(s) and published ${report.postsPublished} update(s) this week.`,
    metrics: [
      {
        label: "Posts planned",
        value: String(report.postsPlanned),
        confidence: "real",
      },
      {
        label: "Posts published",
        value: String(report.postsPublished),
        confidence: "real",
      },
      {
        label: "Uploads received",
        value:
          report.uploadsReceived === null
            ? "Unavailable"
            : String(report.uploadsReceived),
        confidence: report.uploadsReceived === null ? "unavailable" : "real",
      },
      ...report.trendIndicators.map((metric) => ({
        label: metric.label,
        value: metric.value === null ? "Unavailable" : String(metric.value),
        confidence: metric.confidence,
        helperText: metric.note,
      })),
    ],
  };
}

export function toClientSafeMonthlyReport(
  report: MonthlyReport,
): ClientSafeReportSummary {
  return {
    id: report.id,
    period: report.monthKey,
    statusLabel: monthlyStatusLabel(report.status),
    summary:
      report.summary || "Your monthly report is being prepared by Veroxa.",
    metrics: report.metrics.map((metric) => ({
      label: metric.label,
      value: metric.value === null ? "Unavailable" : String(metric.value),
      confidence: metric.confidence,
      helperText: metric.note,
    })),
  };
}

export function toClientSafeNotification(
  notification: Notification,
): ClientSafeNotification {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    status: notification.status,
    createdAt: notification.createdAt,
  };
}

export function toClientSafeVisibilityMetrics(
  platforms: ClientPlatform[],
): ClientSafeMetric[] {
  const google = platforms.find(
    (platform) => platform.platform === "google_business_profile",
  );
  if (!google) {
    return [
      {
        label: "Google Maps readiness",
        value: "Not connected yet",
        confidence: "unavailable",
      },
    ];
  }
  return [
    {
      label: "Google Maps readiness",
      value: google.status === "connected" ? "In progress" : "Needs setup",
      confidence: "real",
      helperText:
        google.clientSafeNote ?? "Veroxa is checking profile readiness.",
    },
  ];
}

function onboardingStatusLabel(status: OnboardingItem["status"]): string {
  switch (status) {
    case "complete":
      return "Complete";
    case "needs_client_input":
      return "Needs your input";
    case "veroxa_review":
      return "Veroxa team review";
    case "in_progress":
      return "In progress";
    case "blocked":
      return "Needs confirmation";
    case "not_started":
      return "Not started";
  }
}

function postStatusLabel(
  status: Post["status"],
): ClientSafePostSummary["statusLabel"] {
  switch (status) {
    case "published":
      return "Published";
    case "scheduled":
      return "Scheduled";
    case "ready_for_review":
      return "In review";
    case "approved":
    case "queued_for_later":
    case "failed":
    case "held":
      return "Prepared by Veroxa";
  }
}

function weeklyStatusLabel(status: WeeklyReport["status"]): string {
  switch (status) {
    case "published":
      return "Available";
    case "client_ready":
      return "Ready";
    case "team_validated":
      return "Veroxa team review complete";
    case "team_validation":
      return "Veroxa team review";
    case "drafted":
      return "In progress";
    case "held":
      return "Hold for later";
  }
}

function monthlyStatusLabel(status: MonthlyReport["status"]): string {
  switch (status) {
    case "published":
      return "Available";
    case "client_ready":
      return "Ready";
    case "team_approved":
      return "Veroxa team approved";
    case "team_review":
      return "Veroxa team review";
    case "team_drafted":
    case "drafted":
      return "In progress";
    case "needs_revision":
      return "In review";
  }
}
