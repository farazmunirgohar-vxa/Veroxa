/**
 * demoAdaptiveMemory.ts — M017
 *
 * Demo-only memory snapshot. In future this will be replaced by a
 * real `performance_metrics` table + content history. For now it is a
 * fixture so the rule-based intelligence layer (`adaptiveRules.ts`)
 * has something to read.
 */

import type { DemoRestaurantId } from "@/data/uploadKeys/demoRestaurantUploadKeys";

export interface AdaptiveMemoryNote {
  topic: string;
  insight: string;
  tone: "positive" | "neutral" | "gap";
}

export interface AdaptiveMemory {
  clientId: DemoRestaurantId;
  strongContentTypes: string[];
  weakDays: string[];
  bestPlatforms: string[];
  googleVisibilityGaps: string[];
  clientConsistencyNotes: string[];
  recentLearning: AdaptiveMemoryNote[];
  demoOnly: true;
}

export const demoAdaptiveMemory: Record<DemoRestaurantId, AdaptiveMemory> = {
  "demo-a": {
    clientId: "demo-a",
    strongContentTypes: [
      "Family platter — overhead",
      "Chef prep close-ups",
      "Friday lunch specials",
    ],
    weakDays: ["Tuesday lunch", "Wednesday mid-afternoon"],
    bestPlatforms: ["Instagram Reels", "TikTok prep clips", "Facebook weekend posts"],
    googleVisibilityGaps: [
      "Not enough interior / storefront photos",
      "No recent Google posts this month",
    ],
    clientConsistencyNotes: [
      "Uploads food photos regularly",
      "Few atmosphere shots",
      "Rarely uploads short prep video",
    ],
    recentLearning: [
      {
        topic: "Family platters",
        insight: "Perform better when posted Thu evening or Fri lunch.",
        tone: "positive",
      },
      {
        topic: "Prep videos",
        insight: "TikTok / Reels reach is consistently higher than feed posts.",
        tone: "positive",
      },
      {
        topic: "Tuesday lunch",
        insight: "Slow even after standard posts; needs a different angle.",
        tone: "gap",
      },
      {
        topic: "Google profile",
        insight: "Storefront / interior photo coverage is below recommended.",
        tone: "gap",
      },
    ],
    demoOnly: true,
  },
  "demo-b": {
    clientId: "demo-b",
    strongContentTypes: ["Street taco close-ups"],
    weakDays: [],
    bestPlatforms: ["Instagram"],
    googleVisibilityGaps: ["Profile photos limited"],
    clientConsistencyNotes: ["Light uploader so far"],
    recentLearning: [],
    demoOnly: true,
  },
  "demo-c": {
    clientId: "demo-c",
    strongContentTypes: ["Mezze spreads"],
    weakDays: [],
    bestPlatforms: ["Facebook"],
    googleVisibilityGaps: [],
    clientConsistencyNotes: [],
    recentLearning: [],
    demoOnly: true,
  },
  "demo-d": {
    clientId: "demo-d",
    strongContentTypes: [],
    weakDays: [],
    bestPlatforms: [],
    googleVisibilityGaps: [],
    clientConsistencyNotes: ["Onboarding paused"],
    recentLearning: [],
    demoOnly: true,
  },
};

export function getAdaptiveMemory(clientId: DemoRestaurantId): AdaptiveMemory {
  return demoAdaptiveMemory[clientId];
}
