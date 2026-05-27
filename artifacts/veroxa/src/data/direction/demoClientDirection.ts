/**
 * demoClientDirection.ts — M015
 *
 * Demo-only model for the Client Direction Center.
 *
 * Restaurants tell Veroxa what matters this week. Veroxa/team handles
 * execution, quality, captions, schedule, ads structure, and final
 * workflow.
 *
 * "Client Direction, Veroxa Execution."
 *
 * No DB writes, no API calls, no real customer data.
 */

import type { DemoRestaurantId } from "@/data/uploadKeys/demoRestaurantUploadKeys";

export type DirectionFocus =
  | "lunch_traffic"
  | "dinner_traffic"
  | "catering"
  | "family_platters"
  | "new_item"
  | "dessert"
  | "slow_day"
  | "weekend_push"
  | "google_visibility"
  | "event_or_holiday"
  | "ads_goal"
  | "avoid_item"
  | "use_media_next"
  | "other";

export type DirectionChannel = "organic_social" | "google" | "ads" | "all";

export type DirectionUrgency = "low" | "normal" | "high" | "urgent";

export type DirectionStatus =
  | "received"
  | "interpreted"
  | "in_team_review"
  | "planned"
  | "completed";

export interface DirectionRequest {
  id: string;
  clientId: DemoRestaurantId;
  restaurantName: string;
  focus: DirectionFocus;
  channel: DirectionChannel;
  urgency: DirectionUrgency;
  title: string;
  clientNote: string;
  preferredTimingLabel: string;
  relatedMediaId?: string;
  avoidItem?: string;
  status: DirectionStatus;
  submittedAtLabel: string;
  demoOnly: true;
}

export const directionFocusLabels: Record<DirectionFocus, string> = {
  lunch_traffic: "Lunch traffic",
  dinner_traffic: "Dinner traffic",
  catering: "Catering",
  family_platters: "Family platters",
  new_item: "New item",
  dessert: "Dessert",
  slow_day: "Slow day",
  weekend_push: "Weekend push",
  google_visibility: "Google visibility",
  event_or_holiday: "Event / holiday",
  ads_goal: "Ads goal",
  avoid_item: "Avoid item",
  use_media_next: "Use this media next",
  other: "Other",
};

export const directionChannelLabels: Record<DirectionChannel, string> = {
  organic_social: "Organic social",
  google: "Google",
  ads: "Ads",
  all: "All channels",
};

export const directionUrgencyLabels: Record<DirectionUrgency, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const directionStatusClientLabels: Record<DirectionStatus, string> = {
  received: "Received",
  interpreted: "Veroxa is planning",
  in_team_review: "In team review",
  planned: "Planned for this week",
  completed: "Completed",
};

export const directionStatusTeamLabels: Record<DirectionStatus, string> = {
  received: "Received — needs interpretation",
  interpreted: "Interpreted",
  in_team_review: "In team review",
  planned: "Planned",
  completed: "Completed",
};

export const demoClientDirection: DirectionRequest[] = [
  {
    id: "dir-001",
    clientId: "demo-a",
    restaurantName: "Demo Grill House",
    focus: "family_platters",
    channel: "organic_social",
    urgency: "high",
    title: "Push family platters this weekend",
    clientNote:
      "Big family weekend coming up. Please feature the lamb family platter and weekend specials.",
    preferredTimingLabel: "Fri–Sun",
    status: "received",
    submittedAtLabel: "Today, 9:15 AM",
    demoOnly: true,
  },
  {
    id: "dir-002",
    clientId: "demo-a",
    restaurantName: "Demo Grill House",
    focus: "slow_day",
    channel: "all",
    urgency: "normal",
    title: "We are slow on Tuesdays",
    clientNote:
      "Tuesday lunch is always quiet. Anything we can do — offer, post, Google update?",
    preferredTimingLabel: "Every Tuesday",
    status: "interpreted",
    submittedAtLabel: "Yesterday, 4:02 PM",
    demoOnly: true,
  },
  {
    id: "dir-003",
    clientId: "demo-a",
    restaurantName: "Demo Grill House",
    focus: "use_media_next",
    channel: "organic_social",
    urgency: "normal",
    title: "Use the chef prep video next",
    clientNote: "The kabob prep clip we uploaded yesterday — please use it next.",
    preferredTimingLabel: "This week",
    relatedMediaId: "UP-DEMO-002",
    status: "planned",
    submittedAtLabel: "Yesterday, 10:30 AM",
    demoOnly: true,
  },
  {
    id: "dir-004",
    clientId: "demo-a",
    restaurantName: "Demo Grill House",
    focus: "avoid_item",
    channel: "all",
    urgency: "high",
    title: "Do not post the old menu photo",
    clientNote: "The old printed menu shot is out of date. Please skip it everywhere.",
    preferredTimingLabel: "Ongoing",
    avoidItem: "Old printed menu photo",
    status: "interpreted",
    submittedAtLabel: "2 days ago",
    demoOnly: true,
  },
  {
    id: "dir-005",
    clientId: "demo-a",
    restaurantName: "Demo Grill House",
    focus: "google_visibility",
    channel: "google",
    urgency: "normal",
    title: "Focus on Google visibility this week",
    clientNote:
      "We get a lot of calls from Google — please push more on the Google profile this week.",
    preferredTimingLabel: "This week",
    status: "in_team_review",
    submittedAtLabel: "3 days ago",
    demoOnly: true,
  },
  {
    id: "dir-006",
    clientId: "demo-a",
    restaurantName: "Demo Grill House",
    focus: "catering",
    channel: "all",
    urgency: "high",
    title: "We want more catering inquiries",
    clientNote:
      "Big catering season coming. Please highlight catering trays, group platters, corporate.",
    preferredTimingLabel: "Next 2 weeks",
    status: "received",
    submittedAtLabel: "Today, 11:48 AM",
    demoOnly: true,
  },
];

export function getDirectionForClient(clientId: DemoRestaurantId): DirectionRequest[] {
  return demoClientDirection.filter((d) => d.clientId === clientId);
}
