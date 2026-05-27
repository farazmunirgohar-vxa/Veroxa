// demoMediaAssets.ts — future: media_assets table
// Covers uploaded media items, quality flags, and per-client media runway.

import { demoClientHealth } from "./demoClientHealth";

// ── DemoMediaItem — future: media_assets ─────────────────────────
export type MediaStatus =
  | "Approved" | "Pending Review" | "Blurry" | "Duplicate"
  | "Scheduled" | "Used" | "Reserved";
export type MediaType = "Photo" | "Video";

export interface DemoMediaItem {
  id: string;
  clientId: string;
  type: MediaType;
  title: string;
  status: MediaStatus;
  qualityNote: string;
  suggestedUse: string;
  campaign?: string;
  dateAdded: string;
}

export const demoMediaItems: DemoMediaItem[] = [
  { id: "mi1",  clientId: "demo-a", type: "Photo", title: "Mixed grill platter — overhead", status: "Approved",       qualityNote: "Good lighting, strong food close-up", suggestedUse: "Use for weekend promotion",       campaign: "Family Platter Weekend", dateAdded: "May 22" },
  { id: "mi2",  clientId: "demo-a", type: "Photo", title: "Chicken shawarma plate",         status: "Scheduled",      qualityNote: "Crisp focus, vibrant colour",         suggestedUse: "Tuesday dinner slot",             campaign: "Lunch Promo",            dateAdded: "May 21" },
  { id: "mi3",  clientId: "demo-a", type: "Video", title: "Charcoal grill — slow-mo clip",  status: "Approved",       qualityNote: "Strong action shot",                  suggestedUse: "Reels — kitchen series",                                              dateAdded: "May 20" },
  { id: "mi4",  clientId: "demo-a", type: "Photo", title: "Lamb kebab close-up",            status: "Pending Review", qualityNote: "Pending operator review",             suggestedUse: "Maybe Friday feature",                                                dateAdded: "May 23" },
  { id: "mi5",  clientId: "demo-a", type: "Photo", title: "Saffron rice — angle 2",         status: "Duplicate",      qualityNote: "Duplicate angle",                     suggestedUse: "Archive",                                                             dateAdded: "May 23" },
  { id: "mi6",  clientId: "demo-b",    type: "Photo", title: "Carnitas tacos flat-lay",        status: "Approved",       qualityNote: "Good for lunch special",              suggestedUse: "Lunch hour slot",                 campaign: "Taco Tuesday",           dateAdded: "May 18" },
  { id: "mi7",  clientId: "demo-b",    type: "Photo", title: "Salsa bar — overhead",           status: "Pending Review", qualityNote: "Bright but slight motion blur",       suggestedUse: "Story content",                                                       dateAdded: "May 22" },
  { id: "mi8",  clientId: "demo-b",    type: "Video", title: "Tortilla press — short clip",    status: "Reserved",       qualityNote: "Reserved for next month brand story", suggestedUse: "Reels",                                                               dateAdded: "May 17" },
  { id: "mi9",  clientId: "demo-b",    type: "Photo", title: "Sidewalk patio",                 status: "Used",           qualityNote: "Published 5 days ago",                suggestedUse: "—",                                                                   dateAdded: "May 10" },
  { id: "mi10", clientId: "demo-c", type: "Photo", title: "Mediterranean platter",          status: "Used",           qualityNote: "Published Yesterday",                 suggestedUse: "—",                               campaign: "Weekend Feature",        dateAdded: "May 19" },
  { id: "mi11", clientId: "demo-c", type: "Photo", title: "Grilled octopus close-up",       status: "Approved",       qualityNote: "Premium magazine-quality shot",       suggestedUse: "Hero post",                                                           dateAdded: "May 20" },
  { id: "mi12", clientId: "demo-c", type: "Video", title: "Olive oil pour",                 status: "Scheduled",      qualityNote: "Atmospheric, ideal for reels",        suggestedUse: "Thursday evening",                                                    dateAdded: "May 21" },
  { id: "mi13", clientId: "demo-d",   type: "Photo", title: "Specialty latte art",            status: "Approved",       qualityNote: "Crisp, slightly cool tone",           suggestedUse: "Morning slot",                                                        dateAdded: "May 14" },
  { id: "mi14", clientId: "demo-d",   type: "Photo", title: "Storefront — late afternoon",    status: "Approved",       qualityNote: "Warm light",                          suggestedUse: "Google profile",                                                      dateAdded: "May 12" },
  { id: "mi15", clientId: "demo-d",   type: "Photo", title: "Cookies tray — top-down",        status: "Blurry",         qualityNote: "Blurry, needs replacement",           suggestedUse: "Reshoot",                                                             dateAdded: "May 22" },
];

export function getMediaSummary() {
  const total         = demoMediaItems.length;
  const approved      = demoMediaItems.filter((m) => m.status === "Approved").length;
  const pendingReview = demoMediaItems.filter((m) => m.status === "Pending Review").length;
  const scheduledWeek = demoMediaItems.filter((m) => m.status === "Scheduled").length;
  const lowInvClients = demoClientHealth.filter((c) => c.signals.mediaInventory.value <= 10).length;
  return { total, approved, pendingReview, scheduledWeek, lowInvClients };
}

// ── DemoMediaRunway — future: computed from media_assets + client config
export interface DemoMediaRunway {
  clientId:       string;
  unusedPhotos:   number;
  unusedVideos:   number;
  postsPerWeek:   number;
  daysRemaining:  number;
  health:         "Healthy" | "Low" | "Critical";
  internalAdvice: string;
  clientFacing:   string;
}

export const demoMediaRunway: DemoMediaRunway[] = [
  { clientId: "demo-a", unusedPhotos: 24, unusedVideos: 6, postsPerWeek: 5, daysRemaining: 28, health: "Healthy",  internalAdvice: "Inventory healthy. Maintain biweekly shoots.",                            clientFacing: "Your media supply looks great this week." },
  { clientId: "demo-b",    unusedPhotos: 8,  unusedVideos: 1, postsPerWeek: 4, daysRemaining: 12, health: "Low",      internalAdvice: "Request 6 photos and 2 short videos within 5 days.",                     clientFacing: "Please upload more photos and short videos this week." },
  { clientId: "demo-c", unusedPhotos: 19, unusedVideos: 5, postsPerWeek: 4, daysRemaining: 32, health: "Healthy",  internalAdvice: "Strong runway. Continue cadence.",                                        clientFacing: "Media is in great shape — no upload needed this week." },
  { clientId: "demo-d",   unusedPhotos: 3,  unusedVideos: 0, postsPerWeek: 3, daysRemaining: 5,  health: "Critical", internalAdvice: "Critical. Request 8 photos and 3 reels immediately. Trigger reshoot.",  clientFacing: "We urgently need new photos and short videos this week." },
];
