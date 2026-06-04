import { decidePackageBoundary } from "./requestEligibilityEngine";
import type { PackageBoundaryRequestInput } from "./types";
export const packageBoundarySeedRequests: PackageBoundaryRequestInput[] = [
  { requestId: "req-google", clientId: "demo-a", currentPlan: "complete_online_presence", title: "Google profile update", message: "Please update our Google Business Profile hours after confirmation." },
  { requestId: "req-yelp", clientId: "demo-a", currentPlan: "complete_online_presence", title: "Yelp profile alignment", message: "Our Yelp link and menu link need alignment." },
  { requestId: "req-website", clientId: "demo-a", currentPlan: "complete_online_presence", title: "Website alignment", message: "Please refine the restaurant description and menu/order links if access is available." },
  { requestId: "req-reel", clientId: "demo-b", currentPlan: "starter", title: "Can Veroxa make this a Reel?", message: "We have a short food video and want a Reel for Instagram." },
  { requestId: "req-tiktok", clientId: "demo-c", currentPlan: "growth", title: "TikTok food prep", message: "Can we use this prep video for TikTok this week?" },
  { requestId: "req-ad", clientId: "demo-c", currentPlan: "growth", title: "Manage ads", message: "Can Veroxa manage paid ads for this campaign?" },
  { requestId: "req-daily", clientId: "demo-e", currentPlan: "premium", title: "Daily posting", message: "Can we post every day if we send usable media?" },
  { requestId: "req-basic-website", clientId: "demo-a", currentPlan: "complete_online_presence", title: "New basic website", message: "Can Veroxa prepare a simple basic website?" },
  { requestId: "req-social", clientId: "demo-a", currentPlan: "complete_online_presence", title: "Missing social profile", message: "Can Veroxa set up our missing Instagram profile?" },
  { requestId: "req-comment", clientId: "demo-b", currentPlan: "complete_online_presence", title: "Reply to a complaint", message: "Please reply to this customer complaint in our inbox." },
  { requestId: "req-offer", clientId: "demo-d", currentPlan: "complete_online_presence", title: "Offer copy", message: "We already have an offer and need copy after we confirm details." },
];
export const packageBoundarySeedDecisions = packageBoundarySeedRequests.map(decidePackageBoundary);
