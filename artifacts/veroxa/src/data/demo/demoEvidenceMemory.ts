/**
 * demoEvidenceMemory.ts
 *
 * Demo fixture data for the Evidence-Based Selection Engine V1.
 * Represents Veroxa's simulated "memory" for demo clients — past
 * performance, media quality signals, and client context.
 *
 * DEMO ONLY:
 * - No real client, restaurant, or customer data.
 * - No real post, upload, or publishing event.
 * - No real AI, database, or API connection.
 * - All clients are clearly fictional demo entities.
 */

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface EvidencePastPost {
  id: string;
  clientId: string;
  postTitle: string;
  platform: "Instagram" | "Facebook" | "Google";
  contentAngle: string;
  postedAtLabel: string;
  reach: number;
  engagementRate: number;
  saves: number;
  clicks: number;
  resultLabel: "Top performer" | "Above average" | "Average" | "Below average";
  lessonLearned: string;
}

export interface EvidenceMediaSignal {
  id: string;
  clientId: string;
  mediaTitle: string;
  mediaType: "Photo" | "Reel" | "Story" | "Carousel";
  qualityScore: number;
  lighting: "Excellent" | "Good" | "Fair" | "Poor";
  foodClarity: "Sharp" | "Acceptable" | "Blurry";
  suggestedUse: string | null;
  riskFlag: string | null;
  uploadedToday: boolean;
}

export interface EvidenceClientContext {
  clientId: string;
  clientName: string;
  currentGoal: string;
  contentRunwayDays: number;
  unusedMediaCount: number;
  scheduledPostsCount: number;
  lastReportStatus: "Delivered" | "Pending validation" | "Draft" | "Overdue";
  recentRisk: "Critical" | "High" | "Medium" | "Low" | "None";
  preferredPostingWindows: string[];
  platformStrengths: string[];
}

// ─── Past Post Performance ────────────────────────────────────────────────────

export const demoEvidencePastPosts: EvidencePastPost[] = [
  // Demo Grill House
  { id: "ep-mg-1", clientId: "demo-a", postTitle: "Thursday dinner reel", platform: "Instagram", contentAngle: "Dinner push", postedAtLabel: "Thu May 15, 7:05 PM", reach: 4820, engagementRate: 8.4, saves: 312, clicks: 188, resultLabel: "Top performer", lessonLearned: "Dinner reels after 7 PM outperform daytime posts by 2.1× for this account." },
  { id: "ep-mg-2", clientId: "demo-a", postTitle: "Friday lunch special", platform: "Instagram", contentAngle: "Lunch special", postedAtLabel: "Fri May 16, 11:30 AM", reach: 3940, engagementRate: 7.1, saves: 241, clicks: 154, resultLabel: "Top performer", lessonLearned: "Lunch specials on Friday drive the highest weekly reach for this account." },
  { id: "ep-mg-3", clientId: "demo-a", postTitle: "Behind-the-scenes kitchen prep", platform: "Facebook", contentAngle: "Behind the scenes", postedAtLabel: "Sat May 17, 2:15 PM", reach: 2680, engagementRate: 5.8, saves: 198, clicks: 87, resultLabel: "Above average", lessonLearned: "Behind-the-scenes content earns 40% more saves than product shots." },
  { id: "ep-mg-4", clientId: "demo-a", postTitle: "Weekend family platter story", platform: "Instagram", contentAngle: "Family occasion", postedAtLabel: "Sun May 18, 11:00 AM", reach: 1920, engagementRate: 3.2, saves: 144, clicks: 42, resultLabel: "Average", lessonLearned: "Stories get lower reach but strong saves — effective for audience retention." },

  // Demo Taco Bar
  { id: "ep-tb-1", clientId: "demo-b", postTitle: "Birria cheese pull reel", platform: "Instagram", contentAngle: "Texture reel", postedAtLabel: "Tue May 13, 12:05 PM", reach: 3710, engagementRate: 9.2, saves: 288, clicks: 176, resultLabel: "Top performer", lessonLearned: "Close-up food texture reels average 22% higher saves for this account." },
  { id: "ep-tb-2", clientId: "demo-b", postTitle: "Taco Tuesday occasion post", platform: "Instagram", contentAngle: "Occasion-based", postedAtLabel: "Tue May 20, 11:45 AM", reach: 2980, engagementRate: 6.8, saves: 203, clicks: 119, resultLabel: "Above average", lessonLearned: "Occasion-based posts see 31% higher engagement on relevant theme days." },
  { id: "ep-tb-3", clientId: "demo-b", postTitle: "Monday lunch promo", platform: "Facebook", contentAngle: "Lunch promo", postedAtLabel: "Mon May 19, 12:00 PM", reach: 1120, engagementRate: 2.1, saves: 49, clicks: 28, resultLabel: "Below average", lessonLearned: "Monday lunch posts underperform — shift posting to Tuesday or Wednesday." },
  { id: "ep-tb-4", clientId: "demo-b", postTitle: "Elote street corn seasonal reveal", platform: "Instagram", contentAngle: "Seasonal item", postedAtLabel: "Sat May 17, 3:30 PM", reach: 2240, engagementRate: 4.5, saves: 131, clicks: 77, resultLabel: "Average", lessonLearned: "Seasonal reveals perform best when captions include countdown-style copy." },

  // Demo Mediterranean Grill
  { id: "ep-cm-1", clientId: "demo-c", postTitle: "Olive oil slow-pour reel", platform: "Instagram", contentAngle: "Atmospheric reel", postedAtLabel: "Sun May 18, 11:05 AM", reach: 6140, engagementRate: 11.3, saves: 491, clicks: 267, resultLabel: "Top performer", lessonLearned: "Atmospheric slow-pour reels outperform static food shots by 3× on reach." },
  { id: "ep-cm-2", clientId: "demo-c", postTitle: "Grilled octopus hero shot", platform: "Instagram", contentAngle: "Premium plating", postedAtLabel: "Thu May 15, 7:30 PM", reach: 5280, engagementRate: 9.6, saves: 418, clicks: 224, resultLabel: "Top performer", lessonLearned: "Premium plating photos drive high saves and increased reservation intent." },
  { id: "ep-cm-3", clientId: "demo-c", postTitle: "Sunday brunch menu carousel", platform: "Facebook", contentAngle: "Menu carousel", postedAtLabel: "Sun May 11, 11:00 AM", reach: 3320, engagementRate: 6.2, saves: 187, clicks: 103, resultLabel: "Above average", lessonLearned: "Sunday 11 AM is the strongest posting window for this client." },
  { id: "ep-cm-4", clientId: "demo-c", postTitle: "Google profile visibility post", platform: "Google", contentAngle: "Google visibility", postedAtLabel: "Wed May 14, 10:00 AM", reach: 1840, engagementRate: 2.8, saves: 62, clicks: 145, resultLabel: "Average", lessonLearned: "Google-focused posts have lower social engagement but measurably improve local search." },

  // Demo Cafe
  { id: "ep-ac-1", clientId: "demo-d", postTitle: "Cardamom latte morning ritual", platform: "Instagram", contentAngle: "Morning beverage", postedAtLabel: "Mon May 19, 8:30 AM", reach: 3280, engagementRate: 10.1, saves: 314, clicks: 196, resultLabel: "Top performer", lessonLearned: "Morning beverage posts (8–10 AM) have the highest engagement rate for this account." },
  { id: "ep-ac-2", clientId: "demo-d", postTitle: "Pistachio croissant texture close-up", platform: "Instagram", contentAngle: "Bakery detail", postedAtLabel: "Wed May 21, 9:15 AM", reach: 2440, engagementRate: 7.4, saves: 228, clicks: 98, resultLabel: "Above average", lessonLearned: "Bakery detail close-ups outperform full-plate shots by 1.8× for this client." },
  { id: "ep-ac-3", clientId: "demo-d", postTitle: "Evening special promo", platform: "Facebook", contentAngle: "Evening promo", postedAtLabel: "Thu May 15, 7:00 PM", reach: 820, engagementRate: 1.6, saves: 28, clicks: 19, resultLabel: "Below average", lessonLearned: "Evening posts underperform for this client — audience engagement peaks before noon." },
  { id: "ep-ac-4", clientId: "demo-d", postTitle: "Weekend brunch menu carousel", platform: "Instagram", contentAngle: "Menu feature", postedAtLabel: "Sat May 17, 10:30 AM", reach: 1860, engagementRate: 4.2, saves: 112, clicks: 67, resultLabel: "Average", lessonLearned: "Menu carousels perform better when captions include price anchors." },
];

// ─── Daily Media Signals ──────────────────────────────────────────────────────

export const demoEvidenceMediaSignals: EvidenceMediaSignal[] = [
  // Demo Grill House
  { id: "ms-mg-1", clientId: "demo-a", mediaTitle: "Grilled platter — overhead", mediaType: "Photo", qualityScore: 91, lighting: "Excellent", foodClarity: "Sharp", suggestedUse: "Friday lunch hero post", riskFlag: null, uploadedToday: true },
  { id: "ms-mg-2", clientId: "demo-a", mediaTitle: "Family platter BTS clip", mediaType: "Reel", qualityScore: 82, lighting: "Good", foodClarity: "Sharp", suggestedUse: "Weekend behind-the-scenes story", riskFlag: null, uploadedToday: true },
  { id: "ms-mg-3", clientId: "demo-a", mediaTitle: "Dark prep station photo", mediaType: "Photo", qualityScore: 44, lighting: "Poor", foodClarity: "Blurry", suggestedUse: null, riskFlag: "Needs reshoot — insufficient lighting", uploadedToday: false },

  // Demo Taco Bar
  { id: "ms-tb-1", clientId: "demo-b", mediaTitle: "Birria cheese pull reel", mediaType: "Reel", qualityScore: 88, lighting: "Excellent", foodClarity: "Sharp", suggestedUse: "Tuesday lunch reel", riskFlag: null, uploadedToday: true },
  { id: "ms-tb-2", clientId: "demo-b", mediaTitle: "Storefront exterior", mediaType: "Photo", qualityScore: 71, lighting: "Good", foodClarity: "Acceptable", suggestedUse: "Google Business Profile update", riskFlag: null, uploadedToday: false },
  { id: "ms-tb-3", clientId: "demo-b", mediaTitle: "Blurry prep shot", mediaType: "Photo", qualityScore: 38, lighting: "Poor", foodClarity: "Blurry", suggestedUse: null, riskFlag: "Reshoot required — motion blur detected", uploadedToday: false },

  // Demo Mediterranean Grill
  { id: "ms-cm-1", clientId: "demo-c", mediaTitle: "Olive oil pour reel", mediaType: "Reel", qualityScore: 96, lighting: "Excellent", foodClarity: "Sharp", suggestedUse: "Sunday brunch hero reel", riskFlag: null, uploadedToday: true },
  { id: "ms-cm-2", clientId: "demo-c", mediaTitle: "Grilled octopus hero", mediaType: "Photo", qualityScore: 89, lighting: "Excellent", foodClarity: "Sharp", suggestedUse: "Premium menu feature post", riskFlag: null, uploadedToday: false },
  { id: "ms-cm-3", clientId: "demo-c", mediaTitle: "Dining room ambiance", mediaType: "Photo", qualityScore: 77, lighting: "Good", foodClarity: "Acceptable", suggestedUse: "Google visibility update", riskFlag: null, uploadedToday: true },

  // Demo Cafe
  { id: "ms-ac-1", clientId: "demo-d", mediaTitle: "Cardamom latte close-up", mediaType: "Photo", qualityScore: 85, lighting: "Good", foodClarity: "Sharp", suggestedUse: "Morning ritual post", riskFlag: null, uploadedToday: false },
  { id: "ms-ac-2", clientId: "demo-d", mediaTitle: "Pistachio croissant texture", mediaType: "Photo", qualityScore: 79, lighting: "Good", foodClarity: "Sharp", suggestedUse: "Bakery feature post", riskFlag: null, uploadedToday: false },
  { id: "ms-ac-3", clientId: "demo-d", mediaTitle: "Chai spice cookies flat-lay", mediaType: "Photo", qualityScore: 62, lighting: "Fair", foodClarity: "Acceptable", suggestedUse: "Re-launch announcement", riskFlag: "Low light — minor touch-up recommended", uploadedToday: false },
];

// ─── Client Context Memory ────────────────────────────────────────────────────

export const demoEvidenceClientContexts: EvidenceClientContext[] = [
  {
    clientId: "demo-a",
    clientName: "Demo Grill House",
    currentGoal: "Grow Friday evening dinner reservations",
    contentRunwayDays: 8,
    unusedMediaCount: 6,
    scheduledPostsCount: 3,
    lastReportStatus: "Pending validation",
    recentRisk: "Low",
    preferredPostingWindows: ["Friday 11:30 AM", "Thursday 7:00 PM", "Saturday 2:00 PM"],
    platformStrengths: ["Instagram", "Facebook"],
  },
  {
    clientId: "demo-b",
    clientName: "Demo Taco Bar",
    currentGoal: "Drive foot traffic on weekday lunch hours",
    contentRunwayDays: 4,
    unusedMediaCount: 3,
    scheduledPostsCount: 2,
    lastReportStatus: "Overdue",
    recentRisk: "High",
    preferredPostingWindows: ["Tuesday 12:00 PM", "Wednesday 1:00 PM", "Friday 12:00 PM"],
    platformStrengths: ["Instagram"],
  },
  {
    clientId: "demo-c",
    clientName: "Demo Mediterranean Grill",
    currentGoal: "Build premium dining reputation on Instagram",
    contentRunwayDays: 14,
    unusedMediaCount: 9,
    scheduledPostsCount: 5,
    lastReportStatus: "Delivered",
    recentRisk: "None",
    preferredPostingWindows: ["Sunday 11:00 AM", "Thursday 7:00 PM", "Saturday 12:00 PM"],
    platformStrengths: ["Instagram", "Google"],
  },
  {
    clientId: "demo-d",
    clientName: "Demo Cafe",
    currentGoal: "Increase morning beverage traffic and café discovery",
    contentRunwayDays: 2,
    unusedMediaCount: 2,
    scheduledPostsCount: 1,
    lastReportStatus: "Draft",
    recentRisk: "Critical",
    preferredPostingWindows: ["Monday 8:30 AM", "Wednesday 9:00 AM", "Friday 8:00 AM"],
    platformStrengths: ["Instagram", "Google"],
  },
];
