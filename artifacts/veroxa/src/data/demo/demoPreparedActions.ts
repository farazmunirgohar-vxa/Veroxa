/**
 * demoPreparedActions — realistic fixture prepared actions for the Approval
 * Queue foundation.
 *
 * Demo-only. Nothing here executes, posts, or publishes — these are prepared
 * actions waiting for team approval / client confirmation, used to exercise the
 * Approval-to-Execution UI. Risk level and approval requirement are derived at
 * read time from the rules engine, so the fixtures only carry intent + content.
 */

import { getRestaurantName } from "@/data/demo/demoClients";
import type { PreparedAction } from "@/domain/preparedActions";

type PreparedActionSeed = Omit<
  PreparedAction,
  "restaurantName" | "riskLevel" | "approvalRequirement" | "demoOnly" | "executionStatus"
> & {
  executionStatus?: PreparedAction["executionStatus"];
};

/**
 * Seeds carry the realistic intent + prepared content. `riskLevel` and
 * `approvalRequirement` are filled in by the repository from the rules engine so
 * there is a single source of truth for the safety gate.
 */
export const demoPreparedActionSeeds: PreparedActionSeed[] = [
  {
    id: "PA-DEMO-001",
    clientId: "demo-a",
    channel: "google_business_profile",
    type: "google_post",
    source: "daily_opportunity_engine",
    title: "Weekend dinner update ready",
    reason:
      "Friday/weekend dinner window is open and a fresh platter photo is available — a timely Google update helps capture nearby diners deciding where to eat.",
    payload: {
      preparedText:
        "This weekend, gather the family around our flame-grilled mixed platter — fresh off the grill and made to share. Dine in or order ahead.",
      mediaReference: "Recent platter photo (approved)",
    },
    priority: "high",
    status: "needs_review",
    executionMode: "connector_later",
    suggestedNext: "Approve to queue the weekend update.",
    preparedAtLabel: "Today, 9:10 AM",
  },
  {
    id: "PA-DEMO-002",
    clientId: "demo-a",
    channel: "reviews",
    type: "review_reply",
    source: "review_monitor",
    title: "Reply ready for a recent 5-star review",
    reason:
      "A happy guest left a warm review. A quick, professional reply shows future customers the restaurant is attentive and lifts local trust.",
    payload: {
      preparedText:
        "Thank you so much for the kind words! We're thrilled you enjoyed your visit and can't wait to welcome you back soon.",
    },
    priority: "medium",
    status: "needs_review",
    executionMode: "connector_later",
    suggestedNext: "Approve to send the reply once review replies are connected.",
    preparedAtLabel: "Today, 9:05 AM",
  },
  {
    id: "PA-DEMO-003",
    clientId: "demo-b",
    channel: "website",
    type: "website_copy_update",
    source: "automation_audit",
    title: "Catering section copy prepared — needs confirmation",
    reason:
      "A catering opportunity was detected, but catering details (minimums, lead time, pricing) are business facts only the restaurant can confirm before anything goes on the website.",
    payload: {
      preparedText:
        "Now offering catering for parties and events — fresh tacos and sides made to order. Ask us about weekend trays and group options.",
      notes: "Confirm catering availability, lead time, and any minimums before publishing.",
    },
    priority: "medium",
    status: "needs_client_confirmation",
    executionMode: "connector_later",
    suggestedNext: "Ask the client to confirm catering details before publishing.",
    preparedAtLabel: "Today, 8:50 AM",
  },
  {
    id: "PA-DEMO-004",
    clientId: "demo-c",
    channel: "client_communication",
    type: "content_request",
    source: "content_pipeline",
    title: "Photo request ready to send",
    reason:
      "Content supply is running low. A single fresh best-seller photo keeps the posting schedule moving without overloading the restaurant.",
    payload: {
      preparedText:
        "Could you send us one quick photo of your most popular dish this week? A clear, well-lit shot is all we need to keep your content fresh.",
    },
    priority: "medium",
    status: "needs_review",
    executionMode: "manual_now",
    suggestedNext: "Approve to send this simple request to the client.",
    preparedAtLabel: "Today, 8:40 AM",
  },
  {
    id: "PA-DEMO-005",
    clientId: "demo-a",
    channel: "seo",
    type: "seo_keyword_update",
    source: "automation_audit",
    title: "Search keyword angle prepared",
    reason:
      "Local search demand suggests leaning into a clearer 'halal family dinner & catering near the neighborhood' angle to reach more nearby customers.",
    payload: {
      keywordAngle: "halal family dinner · catering · lunch near neighborhood",
      notes: "Internal refinement — no public change until reviewed.",
    },
    priority: "low",
    status: "prepared",
    executionMode: "internal_only",
    suggestedNext: "Review and fold into the next content plan.",
    preparedAtLabel: "Today, 8:30 AM",
  },
  {
    id: "PA-DEMO-006",
    clientId: "demo-a",
    channel: "internal_task",
    type: "daily_customer_push",
    source: "daily_opportunity_engine",
    title: "Lunch push prepared",
    reason:
      "Midday is the lunch decision window. Featuring the best seller now helps win nearby lunch traffic.",
    payload: {
      preparedText: "Quick, appetising shot of the best seller framed as a lunch-ready feature.",
    },
    priority: "medium",
    status: "needs_review",
    executionMode: "manual_now",
    suggestedNext: "Approve to prepare the lunch feature for posting.",
    preparedAtLabel: "Today, 8:20 AM",
  },
];

/** Seeds with the restaurant name resolved. Safety fields are added by the store. */
export function getDemoPreparedActionSeeds(): (PreparedActionSeed & {
  restaurantName: string;
  demoOnly: true;
})[] {
  return demoPreparedActionSeeds.map((seed) => ({
    ...seed,
    restaurantName: getRestaurantName(seed.clientId),
    demoOnly: true as const,
  }));
}
