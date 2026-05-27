/**
 * adaptiveRules.ts — M017
 *
 * Rule-based adaptive intelligence layer. Deterministic. No external
 * AI provider (OpenAI / Anthropic / Gemini) is called. No network,
 * no database, no API.
 *
 * Inputs (all in-memory):
 *   - direction requests (from Client Direction Center)
 *   - upload submissions (fixture + session/local store)
 *   - workflow items (existing team workflow)
 *   - adaptive memory (demo performance snapshot)
 *
 * Output:
 *   - AdaptiveRecommendation[] — ranked, client-safe explanations,
 *     plus team-facing source signals.
 *
 * Labeled in UI as "Rule-Based Intelligence Preview".
 */

import type {
  DirectionRequest,
} from "@/data/direction/demoClientDirection";
import type { DemoUploadSubmission } from "@/data/uploadKeys/demoUploadSubmissions";
import type { WorkflowItem } from "@/data/workflows/clientTeamWorkflow";
import type { DemoRestaurantId } from "@/data/uploadKeys/demoRestaurantUploadKeys";
import { getAdaptiveMemory, type AdaptiveMemory } from "@/data/intelligence/demoAdaptiveMemory";

export type AdaptiveRecommendationType =
  | "content_focus"
  | "media_request"
  | "google_action"
  | "ads_direction"
  | "schedule_priority"
  | "avoid_action"
  | "team_priority";

export type AdaptiveConfidence = "low" | "medium" | "high";

export interface AdaptiveSignal {
  source: "direction" | "upload" | "workflow" | "memory";
  detail: string;
}

export interface AdaptiveRecommendation {
  id: string;
  clientId: DemoRestaurantId;
  type: AdaptiveRecommendationType;
  title: string;
  recommendation: string;
  reason: string;
  confidence: AdaptiveConfidence;
  sourceSignals: AdaptiveSignal[];
  suggestedOwner: "team";
  suggestedTeamAction: string;
  clientSafeSummary: string;
  demoOnly: true;
}

export interface AdaptiveInputs {
  clientId: DemoRestaurantId;
  direction: DirectionRequest[];
  uploads: DemoUploadSubmission[];
  workflow: WorkflowItem[];
  memory?: AdaptiveMemory;
}

const LOW_SUPPLY_THRESHOLD = 3;

function makeRec(
  id: string,
  clientId: DemoRestaurantId,
  type: AdaptiveRecommendationType,
  title: string,
  recommendation: string,
  reason: string,
  confidence: AdaptiveConfidence,
  sourceSignals: AdaptiveSignal[],
  suggestedTeamAction: string,
  clientSafeSummary: string,
): AdaptiveRecommendation {
  return {
    id,
    clientId,
    type,
    title,
    recommendation,
    reason,
    confidence,
    sourceSignals,
    suggestedOwner: "team",
    suggestedTeamAction,
    clientSafeSummary,
    demoOnly: true,
  };
}

export function buildAdaptiveRecommendations(
  inputs: AdaptiveInputs,
): AdaptiveRecommendation[] {
  const { clientId, direction, uploads, workflow } = inputs;
  const memory = inputs.memory ?? getAdaptiveMemory(clientId);
  const recs: AdaptiveRecommendation[] = [];

  // --- Direction-driven rules -------------------------------------
  for (const d of direction) {
    if (d.focus === "lunch_traffic") {
      recs.push(
        makeRec(
          `rec-${d.id}-lunch`,
          clientId,
          "content_focus",
          "Lunch-focused content this week",
          "Plan 2–3 lunch-focused posts and one Google post highlighting a lunch offer.",
          "Restaurant direction asked Veroxa to focus on lunch traffic.",
          "high",
          [{ source: "direction", detail: d.title }],
          "Add lunch posts to the content plan; pair with the strongest lunch photo.",
          "Veroxa will focus on lunch promotion this week.",
        ),
      );
    }

    if (d.focus === "slow_day") {
      recs.push(
        makeRec(
          `rec-${d.id}-slow`,
          clientId,
          "content_focus",
          "Boost slow-day traffic",
          "Try a weekday-only offer post + a Google post on the slow day, and an organic post the day before.",
          `Direction "${d.title}" plus memory of weak ${memory.weakDays.join(", ") || "weekdays"}.`,
          memory.weakDays.length > 0 ? "high" : "medium",
          [
            { source: "direction", detail: d.title },
            ...(memory.weakDays.length
              ? [{ source: "memory" as const, detail: `Weak days: ${memory.weakDays.join(", ")}` }]
              : []),
          ],
          "Draft a slow-day organic post + a Google post; consider a small lunch incentive.",
          "Veroxa is planning extra content for your slower days.",
        ),
      );
    }

    if (d.focus === "catering") {
      recs.push(
        makeRec(
          `rec-${d.id}-catering`,
          clientId,
          "content_focus",
          "Catering angle + media request",
          "Plan catering-focused content and request group/platter/event photos from the restaurant.",
          "Restaurant wants more catering inquiries.",
          "high",
          [{ source: "direction", detail: d.title }],
          "Open a media request for catering platter / group / event photos; queue 2 catering-angle posts.",
          "Veroxa will push catering content and ask you for a few group/platter photos.",
        ),
      );
      recs.push(
        makeRec(
          `rec-${d.id}-catering-media`,
          clientId,
          "media_request",
          "Request catering photos",
          "Ask the restaurant for 2–3 catering / group photos this week.",
          "Catering content needs visuals that match the request.",
          "high",
          [{ source: "direction", detail: d.title }],
          "Send a 'Please upload catering trays / group platters' request to the client.",
          "Please upload 2–3 catering or group platter photos this week.",
        ),
      );
    }

    if (d.focus === "avoid_item") {
      recs.push(
        makeRec(
          `rec-${d.id}-avoid`,
          clientId,
          "avoid_action",
          `Avoid: ${d.avoidItem ?? d.title}`,
          `Block ${d.avoidItem ?? "the item noted by the restaurant"} from publishing across all channels.`,
          "Restaurant explicitly asked Veroxa not to post this.",
          "high",
          [{ source: "direction", detail: d.title }],
          "Tag the item as avoid in the workflow; remove from any pending drafts and Google posts.",
          "Veroxa will keep this off your social and Google posts.",
        ),
      );
    }

    if (d.focus === "google_visibility") {
      recs.push(
        makeRec(
          `rec-${d.id}-google`,
          clientId,
          "google_action",
          "Google visibility push",
          "Schedule a Google post and upload missing storefront / interior photos this week.",
          "Direction asked for Google focus; memory notes a Google photo gap.",
          memory.googleVisibilityGaps.length > 0 ? "high" : "medium",
          [
            { source: "direction", detail: d.title },
            ...memory.googleVisibilityGaps.map((g) => ({
              source: "memory" as const,
              detail: g,
            })),
          ],
          "Draft a Google post; open a media request for storefront/interior photos.",
          "Veroxa is prioritizing your Google profile this week.",
        ),
      );
    }

    if (d.focus === "ads_goal") {
      recs.push(
        makeRec(
          `rec-${d.id}-ads`,
          clientId,
          "ads_direction",
          "Ads planning (no launch)",
          "Plan an ads angle aligned with the goal. No campaign will launch until owner approval.",
          "Direction asks for an ads focus.",
          "medium",
          [{ source: "direction", detail: d.title }],
          "Draft the ads angle + audience hypothesis; queue for owner/operator approval (not built yet).",
          "Veroxa is shaping your ads idea — nothing will launch without your approval.",
        ),
      );
    }

    if (d.focus === "use_media_next") {
      recs.push(
        makeRec(
          `rec-${d.id}-use-next`,
          clientId,
          "schedule_priority",
          "Use restaurant's preferred media next",
          `Prioritize ${d.relatedMediaId ? d.relatedMediaId + " " : ""}in the next scheduled post.`,
          "Restaurant flagged a specific upload as the next one to use.",
          "high",
          [
            { source: "direction", detail: d.title },
            ...(d.relatedMediaId
              ? [{ source: "upload" as const, detail: `Media ref ${d.relatedMediaId}` }]
              : []),
          ],
          "Move the referenced upload to the top of the scheduling queue.",
          "Veroxa will use the photo/video you flagged next.",
        ),
      );
    }

    if (d.focus === "weekend_push" || d.focus === "family_platters") {
      recs.push(
        makeRec(
          `rec-${d.id}-weekend`,
          clientId,
          "schedule_priority",
          "Weekend push",
          "Queue 2 weekend-feature posts plus a Friday lunch teaser.",
          `Direction "${d.title}" aligns with weekend traffic.`,
          "medium",
          [{ source: "direction", detail: d.title }],
          "Schedule Fri teaser + Sat/Sun feature using the strongest family/platter photo.",
          "Veroxa is planning a strong weekend push for you.",
        ),
      );
    }
  }

  // --- Upload-driven rules ----------------------------------------
  const hasPrepVideo = uploads.some(
    (u) => u.category === "short_video" || u.category === "kitchen_prep",
  );
  if (hasPrepVideo) {
    recs.push(
      makeRec(
        "rec-uploads-prep-video",
        clientId,
        "content_focus",
        "Use prep video for Reel / TikTok",
        "Cut the prep clip to 12–20s and schedule as Reel + TikTok.",
        "Recent uploads include a prep video; short prep clips historically outperform feed posts.",
        "high",
        [
          { source: "upload", detail: "Prep / short video upload present" },
          { source: "memory", detail: "Prep videos perform better on Reels/TikTok" },
        ],
        "Trim clip and schedule on Reels + TikTok this week.",
        "Veroxa will use your prep clip on Reels and TikTok.",
      ),
    );
  }

  const hasGoogleSignal = uploads.some(
    (u) => u.category === "restaurant_atmosphere" || u.priority === "google_post",
  );
  if (hasGoogleSignal) {
    recs.push(
      makeRec(
        "rec-uploads-google",
        clientId,
        "google_action",
        "Push Google content from new uploads",
        "Use the atmosphere/storefront photos on the Google profile and as a Google post.",
        "Recent uploads include atmosphere/storefront or were tagged for Google.",
        "medium",
        [{ source: "upload", detail: "Atmosphere/storefront or Google-tagged upload" }],
        "Upload to Google profile photos and draft one Google post.",
        "Veroxa is updating your Google profile with your latest photos.",
      ),
    );
  }

  if (uploads.length < LOW_SUPPLY_THRESHOLD) {
    recs.push(
      makeRec(
        "rec-uploads-low-supply",
        clientId,
        "media_request",
        "Content supply is low",
        "Ask the restaurant for 3–5 more uploads this week.",
        `Only ${uploads.length} upload${uploads.length === 1 ? "" : "s"} on hand — below the threshold.`,
        "high",
        [{ source: "upload", detail: `Uploads on hand: ${uploads.length}` }],
        "Send an upload-request nudge with examples (food, prep, atmosphere).",
        "Please upload a few more photos or short clips so Veroxa has fresh content.",
      ),
    );
  }

  // --- Workflow-driven team-priority --------------------------------
  const urgentClientAction = workflow.filter(
    (w) => w.clientId === clientId && w.stage === "needs_client_action" && w.priority === "urgent",
  );
  if (urgentClientAction.length > 0) {
    recs.push(
      makeRec(
        "rec-workflow-client-action",
        clientId,
        "team_priority",
        "Urgent client action open",
        "Follow up with the restaurant on the open urgent request.",
        `${urgentClientAction.length} urgent workflow item${urgentClientAction.length === 1 ? "" : "s"} pending client action.`,
        "high",
        urgentClientAction.map((w) => ({ source: "workflow" as const, detail: w.title })),
        "Nudge the client through Requests; do not block other work.",
        "Veroxa is waiting on a couple of quick answers from you.",
      ),
    );
  }

  // --- Empty-state fallback -----------------------------------------
  if (recs.length === 0) {
    recs.push(
      makeRec(
        "rec-empty",
        clientId,
        "media_request",
        "Need more direction or content",
        "Ask the restaurant for direction or fresh uploads to unlock stronger recommendations.",
        "Not enough direction, uploads, or workflow signals yet.",
        "low",
        [{ source: "memory", detail: "Insufficient signals" }],
        "Send a direction nudge and a quick upload request.",
        "Share what matters this week so Veroxa can plan smarter.",
      ),
    );
  }

  return recs;
}

const confidenceRank: Record<AdaptiveConfidence, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function rankRecommendations(
  recs: AdaptiveRecommendation[],
): AdaptiveRecommendation[] {
  return [...recs].sort((a, b) => confidenceRank[a.confidence] - confidenceRank[b.confidence]);
}
