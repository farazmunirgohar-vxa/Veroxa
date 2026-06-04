import { decidePackageBoundary } from "./requestEligibilityEngine";
import type { PackageBoundaryRequestInput } from "./types";
export const packageBoundarySeedRequests: PackageBoundaryRequestInput[] = [
  {
    requestId: "req-starter-reel",
    clientId: "demo-a",
    currentPlan: "starter",
    title: "Can Veroxa make this a Reel?",
    message: "We have a short food video and want a Reel for Instagram.",
  },
  {
    requestId: "req-growth-tiktok",
    clientId: "demo-c",
    currentPlan: "growth",
    title: "TikTok food prep",
    message: "Can we use this prep video for TikTok this week?",
  },
  {
    requestId: "req-growth-ad",
    clientId: "demo-c",
    currentPlan: "growth",
    title: "Manage ads",
    message: "Can Veroxa manage paid ads for this campaign?",
  },
  {
    requestId: "req-premium-daily",
    clientId: "demo-e",
    currentPlan: "premium",
    title: "Daily posting",
    message: "Can we post every day if we send usable media?",
  },
  {
    requestId: "req-comment",
    clientId: "demo-b",
    currentPlan: "starter",
    title: "Reply to a complaint",
    message: "Please reply to this customer complaint in our inbox.",
  },
  {
    requestId: "req-offer",
    clientId: "demo-d",
    currentPlan: "growth",
    title: "Offer copy",
    message: "We already have an offer and need copy after we confirm details.",
  },
];
export const packageBoundarySeedDecisions = packageBoundarySeedRequests.map(
  decidePackageBoundary,
);
