/**
 * demoWalkthrough.ts
 *
 * Structured data for the Guided Sales Demo walkthrough.
 * Shows a restaurant owner the Veroxa story in 8 steps,
 * from media upload to evidence-based smart recommendations.
 *
 * DEMO ONLY — no real client data, no real AI, no real uploads.
 */

export type DemoWalkthroughRole = "Client" | "Team" | "Operator" | "Owner";

export type DemoWalkthroughAccessLevel = "public" | "internal";

export interface DemoWalkthroughStep {
  stepNumber: number;
  title: string;
  shortExplanation: string;
  route: string;
  role: DemoWalkthroughRole;
  /** "public" = no login required. "internal" = requires demo access code. */
  access: DemoWalkthroughAccessLevel;
  visualLabel: string;
  whatToLookFor: string[];
  demoOnly: true;
}

export interface DemoWalkthrough {
  id: string;
  title: string;
  subtitle: string;
  audience: string;
  steps: DemoWalkthroughStep[];
}

export const veroxaGuidedWalkthrough: DemoWalkthrough = {
  id: "veroxa-guided-sales-demo-v1",
  title: "See Veroxa in Action",
  subtitle:
    "Walk through the full Veroxa story — from one food photo to reviewed content, a scheduled post, a monthly report, and a smarter next recommendation.",
  audience: "Restaurant owners evaluating Veroxa",
  steps: [
    {
      stepNumber: 1,
      title: "Client uploads restaurant media",
      shortExplanation:
        "The restaurant owner uploads food photos and short videos through their Veroxa client portal. Veroxa's team then reviews each asset before it enters the content pipeline.",
      route: "/demo/client/media",
      role: "Client",
      access: "public",
      visualLabel: "Media Library",
      whatToLookFor: [
        "The media card grid showing photos with quality status badges",
        "The Restaurant Media Guidance panel — Veroxa tells owners exactly what to shoot this week",
        "The content supply snapshot showing how many assets are available and how many need review",
        "The 'Needs Better Photo' and 'Use Later' labels — nothing goes live without a quality check",
      ],
      demoOnly: true,
    },
    {
      stepNumber: 2,
      title: "Veroxa turns one food photo into 3 posts",
      shortExplanation:
        "Upload a single food photo and watch the simulated AI generate three ready-to-schedule content drafts — each with a different angle, caption, and posting time.",
      route: "/demo/client/ai-draft-preview",
      role: "Client",
      access: "public",
      visualLabel: "AI Draft Preview",
      whatToLookFor: [
        "The 3-step progress bar: Upload → AI Drafts → Schedule Preview",
        "Three draft cards — each with a different content angle (Lunch Special, Behind the Scenes, Dinner Push)",
        "Platform and time suggestions for each draft (Instagram Friday 11:30 AM, etc.)",
        "The team-review gate notice — nothing posts without human approval",
      ],
      demoOnly: true,
    },
    {
      stepNumber: 3,
      title: "Team reviews media quality and tags assets",
      shortExplanation:
        "The Veroxa team reviews every uploaded asset, tagging quality, notes, and suggested uses before any caption is written. This is the first human checkpoint.",
      route: "/demo/team/media-review",
      role: "Team",
      access: "internal",
      visualLabel: "Team Media Review",
      whatToLookFor: [
        "Media cards with quality badges: Approved, Needs Crop, Needs Reshoot",
        "The Content Review Guidance panel — how each asset maps to the client's capture plan",
        "The Evidence-Based Pick showing which asset has the best data-backed potential",
        "The Accept / Needs Better Photo / Use Later action buttons",
      ],
      demoOnly: true,
    },
    {
      stepNumber: 4,
      title: "Team selects and approves the best caption",
      shortExplanation:
        "Three caption variants are generated for each post — Safe, Engagement, and Sales angles. The team reviews and approves the best fit for the client's brand before scheduling.",
      route: "/demo/team/content-review",
      role: "Team",
      access: "internal",
      visualLabel: "Content Review Queue",
      whatToLookFor: [
        "Three caption variant cards side by side — Safe, Engagement, Sales",
        "Each variant's platform, posting time, and thumbnail",
        "The full review queue showing all items across pending, in-review, and actioned stages",
        "AI recommendation notes on each item — what the system flagged and why",
      ],
      demoOnly: true,
    },
    {
      stepNumber: 5,
      title: "Client sees upcoming content on their calendar",
      shortExplanation:
        "The restaurant owner can see exactly what is scheduled, when, and on which platform — with status badges and thumbnails for each upcoming post.",
      route: "/demo/client/calendar",
      role: "Client",
      access: "public",
      visualLabel: "Content Calendar",
      whatToLookFor: [
        "Post rows with thumbnail, caption preview, date, platform, and status badge",
        "Status badges: Scheduled, In Review, Draft — each with a distinct colour",
        "The approval gate note reminding the owner that nothing posts without team sign-off",
      ],
      demoOnly: true,
    },
    {
      stepNumber: 6,
      title: "Client receives weekly updates and reports",
      shortExplanation:
        "Every week, the restaurant owner receives a clear summary of what was posted, what performed well, and what Veroxa is working on next.",
      route: "/demo/client/updates",
      role: "Client",
      access: "public",
      visualLabel: "Updates & Reports",
      whatToLookFor: [
        "The weekly update summary — posts published, Google impressions, review highlights",
        "Action cards showing what Veroxa needs from the restaurant this week",
        "Progress indicators and next shoot date reminder",
      ],
      demoOnly: true,
    },
    {
      stepNumber: 7,
      title: "Veroxa recommends the next smart action",
      shortExplanation:
        "The Evidence Engine reviews past performance, media quality, content runway, and client goals to recommend the single best next action — for every role on the team.",
      route: "/demo/operator/evidence-engine",
      role: "Operator",
      access: "internal",
      visualLabel: "Evidence Engine",
      whatToLookFor: [
        "The engine confidence score and best media quality score",
        "Content runway indicator — how many days of content remain",
        "The top historical posts and what lessons shaped the current recommendation",
        "Role-based next actions: what the Client, Team, Operator, and Owner should each do next",
      ],
      demoOnly: true,
    },
    {
      stepNumber: 8,
      title: "Owner sees the full Veroxa OS from the top",
      shortExplanation:
        "The owner's executive dashboard shows the health of every client account, revenue signals, team workload, and system-level risks — all in one view.",
      route: "/demo/owner/executive-dashboard",
      role: "Owner",
      access: "internal",
      visualLabel: "Owner Executive Dashboard",
      whatToLookFor: [
        "Portfolio health across all demo clients — green/amber/red risk status",
        "Revenue and retention signals for the business",
        "System-level workflow status and bottleneck flags",
        "The Veroxa OS framing — how media → content → posting → reporting forms a closed loop",
      ],
      demoOnly: true,
    },
  ],
};
