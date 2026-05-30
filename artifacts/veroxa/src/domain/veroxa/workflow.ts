import type {
  DraftSet,
  DraftVariant,
  MediaAsset,
  MonthlyReport,
  Post,
  WeeklyReport,
} from "./types";

export interface TeamWorkflowSummary {
  newUploads: MediaAsset[];
  aiReviewedMedia: MediaAsset[];
  teamReviewMedia: MediaAsset[];
  usableMedia: MediaAsset[];
  draftSets: DraftSet[];
  approvedDrafts: DraftVariant[];
  postReadyQueue: Post[];
  scheduledPosts: Post[];
  publishedPosts: Post[];
  weeklyReportValidation: WeeklyReport[];
  monthlyReportDrafting: MonthlyReport[];
}

export function groupTeamWorkflow(records: {
  mediaAssets?: MediaAsset[];
  draftSets?: DraftSet[];
  draftVariants?: DraftVariant[];
  posts?: Post[];
  weeklyReports?: WeeklyReport[];
  monthlyReports?: MonthlyReport[];
}): TeamWorkflowSummary {
  const mediaAssets = records.mediaAssets ?? [];
  const posts = records.posts ?? [];
  return {
    newUploads: mediaAssets.filter((asset) => asset.status === "uploaded"),
    aiReviewedMedia: mediaAssets.filter(
      (asset) => asset.status === "ai_reviewed",
    ),
    teamReviewMedia: mediaAssets.filter(
      (asset) => asset.status === "team_review",
    ),
    usableMedia: mediaAssets.filter((asset) => asset.status === "usable"),
    draftSets: (records.draftSets ?? []).filter(
      (set) => set.status === "generated" || set.status === "team_review",
    ),
    approvedDrafts: (records.draftVariants ?? []).filter(
      (variant) => variant.status === "approved",
    ),
    postReadyQueue: posts.filter(
      (post) =>
        post.status === "ready_for_review" || post.status === "approved",
    ),
    scheduledPosts: posts.filter((post) => post.status === "scheduled"),
    publishedPosts: posts.filter((post) => post.status === "published"),
    weeklyReportValidation: (records.weeklyReports ?? []).filter(
      (report) => report.status === "team_validation",
    ),
    monthlyReportDrafting: (records.monthlyReports ?? []).filter(
      (report) =>
        report.status === "drafted" || report.status === "team_drafted",
    ),
  };
}

export function markMediaUsable(
  asset: MediaAsset,
  now = new Date().toISOString(),
): MediaAsset {
  return { ...asset, status: "usable", updatedAt: now };
}

export function queueApprovedPost(
  post: Post,
  now = new Date().toISOString(),
): Post {
  return { ...post, status: "queued_for_later", updatedAt: now };
}

export function markPostPublished(
  post: Post,
  publishedAt = new Date().toISOString(),
): Post {
  return { ...post, status: "published", publishedAt, updatedAt: publishedAt };
}
