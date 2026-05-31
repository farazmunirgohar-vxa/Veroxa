import type { FirstClientScenario } from "./types";

export const firstClientBenchmarkScenarios: readonly FirstClientScenario[] = [
  {
    key: "healthy-essential",
    label: "Healthy Essential client",
    packageFit: "essential",
    riskProfile: "healthy",
    mediaState: "steady_photo_supply",
    expectedClientPortalNeeds: [
      "Clear dashboard status",
      "Simple media reminders",
      "Monthly snapshot without invented results",
    ],
    expectedTeamNeeds: [
      "Review prepared picture posts",
      "Check Google Maps visibility tasks",
      "Queue approved work for manual follow-through",
    ],
    expectedReportNeeds: [
      "Summarize completed work",
      "Note what is waiting on Veroxa team review",
      "Ask for next useful media only when needed",
    ],
    premiumReadinessNote: "Not a Premium assessment case yet.",
    readinessFocusAreas: ["client_portal", "media_workflow", "reports"],
  },
  {
    key: "essential-low-media",
    label: "Essential client with low media",
    packageFit: "essential",
    riskProfile: "media_limited",
    mediaState: "low_photo_supply",
    expectedClientPortalNeeds: [
      "Calm explanation that posting depends on usable media",
      "Specific next media request",
      "No pressure or unsupported performance claims",
    ],
    expectedTeamNeeds: [
      "Track content gaps",
      "Hold work that needs better photos",
      "Ask the client for the smallest useful next upload",
    ],
    expectedReportNeeds: [
      "Explain what was prepared",
      "Explain what slowed because media was unavailable",
      "Keep reporting focused on real work completed",
    ],
    premiumReadinessNote: "Premium should wait until media supply and readiness improve.",
    readinessFocusAreas: ["media_workflow", "client_requests", "service_boundaries"],
  },
  {
    key: "growth-reels-ready",
    label: "Growth client with Reels content",
    packageFit: "growth",
    riskProfile: "reels_ready",
    mediaState: "video_and_photo_supply",
    expectedClientPortalNeeds: [
      "Show that video support uses client-provided photos and videos",
      "Keep max posting expectations clear",
      "Surface requests for missing context before public use",
    ],
    expectedTeamNeeds: [
      "Review Reels and TikTok support readiness",
      "Confirm business-truth details before public captions",
      "Queue approved work for manual execution",
    ],
    expectedReportNeeds: [
      "Separate completed work from work still in review",
      "Avoid fake follower or reach language",
      "Note useful next video needs",
    ],
    premiumReadinessNote: "May become a future Premium candidate after consistent Growth operations.",
    readinessFocusAreas: ["approval_gates", "client_updates", "workflow_tracking"],
  },
  {
    key: "growth-inconsistent-uploads",
    label: "Growth client with inconsistent uploads",
    packageFit: "growth",
    riskProfile: "inconsistent_media",
    mediaState: "inconsistent_uploads",
    expectedClientPortalNeeds: [
      "Simple reminders for usable photos or videos",
      "Visible status when Veroxa is waiting on client input",
      "No implication that posts continue without usable media",
    ],
    expectedTeamNeeds: [
      "Hold items that need stronger media",
      "Keep the review queue clear",
      "Prepare client requests that are specific and easy to answer",
    ],
    expectedReportNeeds: [
      "Show real progress and current holds",
      "Avoid fake posting-volume language",
      "Document what client input would help next",
    ],
    premiumReadinessNote: "Premium should not be assessed until upload consistency improves.",
    readinessFocusAreas: ["media_workflow", "workflow_tracking", "reports"],
  },
  {
    key: "premium-assessment-candidate",
    label: "Client eligible for Premium assessment",
    packageFit: "premium_candidate",
    riskProfile: "premium_assessment_needed",
    mediaState: "ads_readiness_review",
    expectedClientPortalNeeds: [
      "Explain that Premium requires assessment and approval",
      "Keep ad spend separate from Veroxa service pricing",
      "Ask for business-truth confirmation before offers or claims",
    ],
    expectedTeamNeeds: [
      "Run readiness assessment before recommending Premium",
      "Confirm budget and client approval before any ad work",
      "Maintain the same max posting cap",
    ],
    expectedReportNeeds: [
      "Document assessment status",
      "Separate readiness notes from ad results",
      "Avoid implying ads are active before approval",
    ],
    premiumReadinessNote: "Candidate only after assessment, client approval, and agreed ad budget.",
    readinessFocusAreas: ["pricing_alignment", "approval_gates", "launch_guardrails"],
  },
] as const;
