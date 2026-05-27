/**
 * demoUploadSubmissions.ts — M013 / M014
 *
 * Local-only sample submissions that simulate what restaurants send
 * through the Upload Key flow. Used to seed the Team Upload Inbox
 * (`/demo/team/upload-inbox`) so the team can practice the review
 * actions even before any real client traffic exists.
 *
 * No database, no Supabase, no real files. The upload form may add
 * additional entries in component state, but nothing is persisted.
 */

import type {
  DemoRestaurantId,
  DemoUploadAllowedCategory,
} from "./demoRestaurantUploadKeys";

export type DemoUploadCategory = DemoUploadAllowedCategory;

export type DemoUploadPriority =
  | "use_anytime"
  | "use_next"
  | "save_for_weekend"
  | "google_post"
  | "reel_idea";

export type DemoUploadStatus =
  | "received"
  | "in_review"
  | "accepted"
  | "needs_better_photo"
  | "saved_for_later";

export interface DemoUploadSubmission {
  id: string;
  restaurantId: DemoRestaurantId;
  restaurantName: string;
  category: DemoUploadCategory;
  priority: DemoUploadPriority;
  note: string;
  fileLabel: string;
  fileKind: "image" | "video";
  submittedAtLabel: string;
  status: DemoUploadStatus;
  demoOnly: true;
}

export const demoUploadPriorityLabels: Record<DemoUploadPriority, string> = {
  use_anytime: "Use anytime",
  use_next: "Use this next",
  save_for_weekend: "Save for weekend",
  google_post: "Google post",
  reel_idea: "Reel / TikTok idea",
};

export const demoUploadStatusLabels: Record<DemoUploadStatus, string> = {
  received: "Received",
  in_review: "In review",
  accepted: "Accepted for content",
  needs_better_photo: "Needs better photo",
  saved_for_later: "Saved for later",
};

export const demoUploadSubmissions: DemoUploadSubmission[] = [
  {
    id: "UP-DEMO-001",
    restaurantId: "demo-a",
    restaurantName: "Demo Grill House",
    category: "food_photo",
    priority: "use_next",
    note: "Use this for the lunch special — fresh off the grill.",
    fileLabel: "grilled-platter-overhead.jpg",
    fileKind: "image",
    submittedAtLabel: "Today, 11:42 AM",
    status: "received",
    demoOnly: true,
  },
  {
    id: "UP-DEMO-002",
    restaurantId: "demo-a",
    restaurantName: "Demo Grill House",
    category: "short_video",
    priority: "reel_idea",
    note: "Chef preparing kabobs — could be a Reel.",
    fileLabel: "chef-prep-clip.mp4",
    fileKind: "video",
    submittedAtLabel: "Today, 10:18 AM",
    status: "in_review",
    demoOnly: true,
  },
  {
    id: "UP-DEMO-003",
    restaurantId: "demo-a",
    restaurantName: "Demo Grill House",
    category: "restaurant_atmosphere",
    priority: "google_post",
    note: "Storefront — please use on Google profile.",
    fileLabel: "storefront-evening.jpg",
    fileKind: "image",
    submittedAtLabel: "Yesterday, 6:55 PM",
    status: "accepted",
    demoOnly: true,
  },
  {
    id: "UP-DEMO-004",
    restaurantId: "demo-a",
    restaurantName: "Demo Grill House",
    category: "menu_special",
    priority: "save_for_weekend",
    note: "Weekend family platter — new item starting Friday.",
    fileLabel: "family-platter-special.jpg",
    fileKind: "image",
    submittedAtLabel: "Yesterday, 3:12 PM",
    status: "saved_for_later",
    demoOnly: true,
  },
];

export function getSubmissionsByRestaurant(
  submissions: DemoUploadSubmission[] = demoUploadSubmissions,
): Record<string, DemoUploadSubmission[]> {
  const grouped: Record<string, DemoUploadSubmission[]> = {};
  for (const s of submissions) {
    const list = grouped[s.restaurantName] ?? [];
    list.push(s);
    grouped[s.restaurantName] = list;
  }
  return grouped;
}
