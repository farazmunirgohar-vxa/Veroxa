// demoClients.ts — future: clients table
// Covers client identity, profiles, menus, brand guidelines, media requirements,
// client notes, lifecycle stages, and priority board.

// ── Shared utility types ─────────────────────────────────────────
export type HealthLevel = "healthy" | "attention" | "critical";

export const healthLevelOrder: Record<HealthLevel, number> = {
  critical:  0,
  attention: 1,
  healthy:   2,
};

export function sortByHealthLevel<T extends { level: HealthLevel }>(arr: T[]): T[] {
  return [...arr].sort(
    (a, b) => healthLevelOrder[a.level] - healthLevelOrder[b.level]
  );
}

// ── DemoRestaurant — future: clients ─────────────────────────────
export interface DemoRestaurant {
  id: string;
  name: string;
  cuisine: string;
  assignedTeam: string;
  assignedOperator: string;
}

export const demoRestaurants: DemoRestaurant[] = [
  { id: "demo-a", name: "Demo Grill House",         cuisine: "Modern Levantine",    assignedTeam: "Team A", assignedOperator: "Lina"   },
  { id: "demo-b",    name: "Demo Taco Bar",             cuisine: "Mexican street food", assignedTeam: "Team B", assignedOperator: "Daniel" },
  { id: "demo-c", name: "Demo Mediterranean Grill", cuisine: "Mediterranean grill", assignedTeam: "Team A", assignedOperator: "Lina"   },
  { id: "demo-d",   name: "Demo Cafe",                cuisine: "Specialty cafe",      assignedTeam: "Team C", assignedOperator: "Daniel" },
];

export function getRestaurant(id: string): DemoRestaurant | undefined {
  return demoRestaurants.find((r) => r.id === id);
}

export function getRestaurantName(id: string): string {
  return getRestaurant(id)?.name ?? id;
}

// ── DemoRestaurantProfile — future: clients (extended fields) ────
export interface DemoRestaurantProfile {
  clientId: string;
  address: string;
  phone: string;
  website: string;
  cuisineType: string;
  hours: string;
  primaryContact:   { name: string; role: string; email: string };
  secondaryContact: { name: string; role: string; email: string };
  servicePlan:
    | "Google Optimization"
    | "Complete Online Presence"
    | "Complete Online Presence + Ads Add-on"
    | "Ads Management Only";
  accountStatus: "Active" | "Onboarding" | "Paused" | "At Risk";
}

export const demoRestaurantProfiles: DemoRestaurantProfile[] = [
  {
    clientId: "demo-a",
    address: "100 Demo Street, San Antonio, TX 78201",
    phone: "+1 (555) 100-0001",
    website: "demo-restaurant-a.veroxa.test",
    cuisineType: "Modern Levantine",
    hours: "Mon–Sun · 11:00 AM – 11:00 PM",
    primaryContact:   { name: "Alex Owner-A",   role: "Owner",          email: "owner-a@demo.veroxa.test"   },
    secondaryContact: { name: "Jordan Manager-A", role: "Marketing lead", email: "manager-a@demo.veroxa.test" },
    servicePlan: "Complete Online Presence",
    accountStatus: "Active",
  },
  {
    clientId: "demo-b",
    address: "200 Demo Avenue, San Antonio, TX 78202",
    phone: "+1 (555) 200-0002",
    website: "demo-restaurant-b.veroxa.test",
    cuisineType: "Mexican street food",
    hours: "Tue–Sun · 12:00 PM – 10:00 PM",
    primaryContact:   { name: "Marco Owner-B",  role: "Owner",           email: "owner-b@demo.veroxa.test"   },
    secondaryContact: { name: "Priya Manager-B", role: "General manager", email: "manager-b@demo.veroxa.test" },
    servicePlan: "Complete Online Presence",
    accountStatus: "Active",
  },
  {
    clientId: "demo-c",
    address: "300 Demo Road, San Antonio, TX 78203",
    phone: "+1 (555) 300-0003",
    website: "demo-restaurant-c.veroxa.test",
    cuisineType: "Mediterranean grill",
    hours: "Mon–Sat · 5:00 PM – 12:00 AM",
    primaryContact:   { name: "Sofia Owner-C",  role: "Owner / Chef", email: "owner-c@demo.veroxa.test"   },
    secondaryContact: { name: "Karim Manager-C", role: "Operations",   email: "manager-c@demo.veroxa.test" },
    servicePlan: "Complete Online Presence + Ads Add-on",
    accountStatus: "Active",
  },
  {
    clientId: "demo-d",
    address: "400 Demo Lane, San Antonio, TX 78204",
    phone: "+1 (555) 400-0004",
    website: "demo-restaurant-d.veroxa.test",
    cuisineType: "Specialty cafe",
    hours: "Mon–Sun · 7:00 AM – 9:00 PM",
    primaryContact:   { name: "Yusuf Owner-D",  role: "Owner",           email: "owner-d@demo.veroxa.test"   },
    secondaryContact: { name: "Hana Manager-D", role: "Shift supervisor", email: "manager-d@demo.veroxa.test" },
    servicePlan: "Google Optimization",
    accountStatus: "At Risk",
  },
];

export function getRestaurantProfile(clientId: string): DemoRestaurantProfile | undefined {
  return demoRestaurantProfiles.find((p) => p.clientId === clientId);
}

// ── DemoMenuItem — future: menu_items (client-specific content) ──
export type MenuItemGroup = "featured" | "popular" | "seasonal";
export type MenuItemStatus = "Available" | "Limited" | "Out of stock" | "Coming soon";

export interface DemoMenuItem {
  id: string;
  clientId: string;
  name: string;
  category: string;
  group: MenuItemGroup;
  description: string;
  status: MenuItemStatus;
  promotionAngle: string;
}

export const demoMenuItems: DemoMenuItem[] = [
  // Demo Grill House (id: demo-a)
  { id: "mn1",  clientId: "demo-a", name: "Mixed Grill Platter",      category: "Mains",      group: "featured", description: "Lamb, chicken, kofta, charred vegetables, saffron rice.", status: "Available",    promotionAngle: "Anchor weekend family-dinner promo." },
  { id: "mn2",  clientId: "demo-a", name: "Chicken Shawarma Plate",   category: "Mains",      group: "popular",  description: "Marinated chicken, garlic sauce, pickles, fresh pita.",   status: "Available",    promotionAngle: "Lunch-window reel with chef hand-shot." },
  { id: "mn3",  clientId: "demo-a", name: "Saffron Rice Pudding",     category: "Dessert",    group: "seasonal", description: "Cardamom-infused rice pudding with pistachio crumble.",   status: "Limited",      promotionAngle: "Dessert spotlight — short-form video." },
  // Demo Taco Bar (id: demo-b)
  { id: "mn4",  clientId: "demo-b",    name: "Carnitas Tacos",           category: "Tacos",      group: "popular",  description: "Slow-braised pork, salsa verde, pickled onion, lime.",    status: "Available",    promotionAngle: "Flat-lay photo, Taco Tuesday angle." },
  { id: "mn5",  clientId: "demo-b",    name: "Birria Quesatacos",        category: "Tacos",      group: "featured", description: "Cheese-crisped tortillas with rich birria broth dip.",    status: "Available",    promotionAngle: "Cheese pull close-up reel." },
  { id: "mn6",  clientId: "demo-b",    name: "Elote Street Corn",        category: "Sides",      group: "seasonal", description: "Grilled corn, cotija, chipotle aioli, fresh lime.",       status: "Limited",      promotionAngle: "Summer-season social push." },
  // Crescent
  { id: "mn7",  clientId: "demo-c", name: "Mediterranean Platter",    category: "Mains",      group: "featured", description: "Grilled lamb, halloumi, fattoush, hummus, warm pita.",    status: "Available",    promotionAngle: "Hero post — magazine-quality photo." },
  { id: "mn8",  clientId: "demo-c", name: "Grilled Octopus",          category: "Starters",   group: "popular",  description: "Charred octopus, lemon, olive oil, smoked paprika.",      status: "Available",    promotionAngle: "Premium tasting menu story." },
  { id: "mn9",  clientId: "demo-c", name: "Olive Oil Tasting Flight", category: "Experience", group: "seasonal", description: "Three single-origin olive oils with warm sourdough.",     status: "Coming soon",  promotionAngle: "Atmospheric reels series — olive oil pour." },
  // Demo Cafe (id: demo-d)
  { id: "mn10", clientId: "demo-d",   name: "Cardamom Latte",           category: "Beverages",  group: "featured", description: "Espresso, steamed milk, cardamom syrup, rose petal dust.", status: "Available",   promotionAngle: "Morning ritual content." },
  { id: "mn11", clientId: "demo-d",   name: "Pistachio Croissant",      category: "Bakery",     group: "popular",  description: "House-laminated croissant with pistachio frangipane.",    status: "Available",    promotionAngle: "Pair with morning beverage feature." },
  { id: "mn12", clientId: "demo-d",   name: "Spiced Chai Cookies",      category: "Bakery",     group: "seasonal", description: "Brown butter cookies with chai spice blend.",             status: "Out of stock", promotionAngle: "Re-launch announcement once restocked." },
];

export function getMenuItemsForClient(clientId: string): DemoMenuItem[] {
  return demoMenuItems.filter((m) => m.clientId === clientId);
}

// ── DemoBrandGuidelines — future: brand_guidelines ───────────────
export interface DemoBrandGuidelines {
  clientId: string;
  brandVoice: string;
  contentStyle: string;
  thingsToAvoid: string[];
  primaryColors: { name: string; hex: string }[];
  logoStatus: "Provided" | "Needs refresh" | "Missing";
  toneExamples: string[];
  captionStyleNotes: string;
}

export const demoBrandGuidelines: DemoBrandGuidelines[] = [
  {
    clientId: "demo-a",
    brandVoice: "Warm, family-led, confident. Speaks to community and tradition.",
    contentStyle: "Rich, warm lighting. Close-ups on charcoal grill and family-style plating.",
    thingsToAvoid: ["Discount-heavy language", "Generic stock food shots", "Trendy slang"],
    primaryColors: [
      { name: "Charcoal", hex: "#1A1A1A" },
      { name: "Saffron",  hex: "#E0A92E" },
      { name: "Ivory",    hex: "#F2EAD6" },
    ],
    logoStatus: "Provided",
    toneExamples: ["Built on family. Grilled over fire.", "Tonight, your table is ready."],
    captionStyleNotes: "Short, sensory-led. Lead with the food, end with the experience.",
  },
  {
    clientId: "demo-b",
    brandVoice: "Bold, energetic, street-smart. Speaks to a young weekday-lunch crowd.",
    contentStyle: "High-contrast, daylight shots. Bright salsa colors, hand-held action.",
    thingsToAvoid: ["Overly polished studio shots", "Long captions", "Corporate tone"],
    primaryColors: [
      { name: "Chili red", hex: "#D43A2F" },
      { name: "Lime",      hex: "#9CCB3B" },
      { name: "Off-white", hex: "#FFF5E1" },
    ],
    logoStatus: "Provided",
    toneExamples: ["Tacos that hit. Lunch that moves.", "Real fire. Real flavour."],
    captionStyleNotes: "Punchy. 1–2 lines. End with a clear hook or offer.",
  },
  {
    clientId: "demo-c",
    brandVoice: "Premium, calm, considered. Editorial restaurant tone.",
    contentStyle: "Cinematic, low-light, plated close-ups. Olive oil and char detail.",
    thingsToAvoid: ["Casual humour", "Discount messaging", "Cluttered compositions"],
    primaryColors: [
      { name: "Deep olive", hex: "#3A4A2A" },
      { name: "Bone",       hex: "#E8E1D2" },
      { name: "Ember",      hex: "#B5471B" },
    ],
    logoStatus: "Provided",
    toneExamples: ["Coastal fire. Quiet luxury.", "An evening that lingers."],
    captionStyleNotes: "Longer-form is OK. Lead with sensory detail; let the food carry the line.",
  },
  {
    clientId: "demo-d",
    brandVoice: "Friendly, neighborhood-cafe warmth. Inviting and unfussy.",
    contentStyle: "Soft natural light, latte art close-ups, hands-and-cup framing.",
    thingsToAvoid: ["Overly aspirational copy", "Heavy filters", "Trendy hashtags"],
    primaryColors: [
      { name: "Warm cream", hex: "#F4E9D5" },
      { name: "Rose",       hex: "#D2899A" },
      { name: "Espresso",   hex: "#3B2A20" },
    ],
    logoStatus: "Needs refresh",
    toneExamples: ["Mornings, sweetened.", "Your seat is waiting."],
    captionStyleNotes: "Conversational. Lead with the moment, not the menu.",
  },
];

export function getBrandGuidelines(clientId: string): DemoBrandGuidelines | undefined {
  return demoBrandGuidelines.find((b) => b.clientId === clientId);
}

// ── DemoMediaRequirements — future: client config / media targets ─
export interface DemoMediaRequirements {
  clientId: string;
  photos:           { current: number; target: number };
  videos:           { current: number; target: number };
  productShots:     { current: number; target: number };
  btsClips:         { current: number; target: number };
  teamOwnerContent: { current: number; target: number };
  weeklyGuidance: string;
}

export const demoMediaRequirements: DemoMediaRequirements[] = [
  { clientId: "demo-a", photos: { current: 12, target: 20 }, videos: { current: 4, target: 10 }, productShots: { current: 8,  target: 12 }, btsClips: { current: 3, target: 8 }, teamOwnerContent: { current: 2, target: 4 }, weeklyGuidance: "Strong supply — focus on 2 new charcoal-grill reels this week." },
  { clientId: "demo-b",    photos: { current: 6,  target: 20 }, videos: { current: 2, target: 10 }, productShots: { current: 4,  target: 12 }, btsClips: { current: 1, target: 8 }, teamOwnerContent: { current: 0, target: 4 }, weeklyGuidance: "Trending low — schedule a 2-hour shoot to refresh tacos and elote." },
  { clientId: "demo-c", photos: { current: 14, target: 20 }, videos: { current: 6, target: 10 }, productShots: { current: 9,  target: 12 }, btsClips: { current: 4, target: 8 }, teamOwnerContent: { current: 3, target: 4 }, weeklyGuidance: "Healthy supply — capture chef-portrait series next." },
  { clientId: "demo-d",   photos: { current: 2,  target: 20 }, videos: { current: 0, target: 10 }, productShots: { current: 1,  target: 12 }, btsClips: { current: 0, target: 8 }, teamOwnerContent: { current: 0, target: 4 }, weeklyGuidance: "Critical — request 5 new food photos and 2 latte-art clips immediately." },
];

export function getMediaRequirements(clientId: string): DemoMediaRequirements | undefined {
  return demoMediaRequirements.find((m) => m.clientId === clientId);
}

// ── DemoClientNote — future: client_notes ────────────────────────
export interface DemoClientNote {
  clientId: string;
  preferences: string[];
  restrictions: string[];
  bestSellers: string[];
  seasonalPriorities: string[];
  importantReminders: string[];
}

export const demoClientNotes: DemoClientNote[] = [
  {
    clientId: "demo-a",
    preferences: ["Posts go live before 7 PM dinner window", "Family-style plating preferred for hero shots"],
    restrictions: ["No alcohol pairings in copy", "Avoid promoting Friday lunch (slow service day)"],
    bestSellers: ["Mixed Grill Platter", "Chicken Shawarma Plate", "Lamb Kofta"],
    seasonalPriorities: ["Ramadan family-platter campaign in March", "Summer patio reels June–Aug"],
    importantReminders: ["Owner reviews captions before publish", "Tag location landmark in every post"],
  },
  {
    clientId: "demo-b",
    preferences: ["Bright daytime photography", "Short captions, one CTA"],
    restrictions: ["Avoid corporate tone", "No long-form copy"],
    bestSellers: ["Carnitas Tacos", "Birria Quesatacos"],
    seasonalPriorities: ["Summer patio push", "College back-to-school lunch promo"],
    importantReminders: ["Coordinate with chef for shoot days", "Tuesday is best for Taco Tuesday campaigns"],
  },
  {
    clientId: "demo-c",
    preferences: ["Cinematic low-light style", "Editorial captions are welcome"],
    restrictions: ["No discount language", "Avoid casual humour"],
    bestSellers: ["Mediterranean Platter", "Grilled Octopus", "Olive Oil Flight"],
    seasonalPriorities: ["Olive harvest storytelling Oct–Nov", "Holiday tasting menu December"],
    importantReminders: ["Reservations link must appear in bio CTAs", "Tag head chef in chef-feature posts"],
  },
  {
    clientId: "demo-d",
    preferences: ["Soft, warm morning lighting", "Conversational captions"],
    restrictions: ["Avoid heavy filters", "Don't promote out-of-stock pastries"],
    bestSellers: ["Cardamom Latte", "Pistachio Croissant"],
    seasonalPriorities: ["Autumn warm-drink push", "Holiday gift card promotion in December"],
    importantReminders: ["Logo needs refresh before next campaign", "Confirm pastry stock before scheduling"],
  },
];

export function getClientNotes(clientId: string): DemoClientNote | undefined {
  return demoClientNotes.find((n) => n.clientId === clientId);
}

// ── DemoClientLifecycle — future: client lifecycle/status fields ──
export type LifecycleStage =
  | "Lead" | "Signed" | "Onboarding" | "Active"
  | "Needs Attention" | "At Risk" | "Paused" | "Completed / Archived";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface DemoClientLifecycle {
  clientId:        string;
  lifecycleStage:  LifecycleStage;
  servicePlan:
    | "Google Optimization"
    | "Complete Online Presence"
    | "Complete Online Presence + Ads Add-on"
    | "Ads Management Only";
  startDate:       string;
  contractMonths:  number;
  monthlyFee:      number;
  healthScore:     number;
  mediaStatus:     "Healthy" | "Low" | "Critical";
  reportingStatus: "On Schedule" | "Delayed" | "Overdue";
  nextAction:      string;
  riskLevel:       RiskLevel;
}

export const demoClientLifecycle: DemoClientLifecycle[] = [
  { clientId: "demo-a", lifecycleStage: "Active",          servicePlan: "Complete Online Presence", startDate: "Feb 2026", contractMonths: 0, monthlyFee:  977, healthScore: 92, mediaStatus: "Healthy",  reportingStatus: "On Schedule", nextAction: "Approve 3 caption variants for Friday post.",     riskLevel: "Low"      },
  { clientId: "demo-b", lifecycleStage: "Needs Attention", servicePlan: "Complete Online Presence", startDate: "Mar 2026", contractMonths: 0, monthlyFee:  977, healthScore: 64, mediaStatus: "Low",      reportingStatus: "Delayed",     nextAction: "Rewrite flagged caption + chase weekly report.",   riskLevel: "Medium"   },
  { clientId: "demo-c", lifecycleStage: "Active",          servicePlan: "Complete Online Presence + Ads Add-on", startDate: "Dec 2025", contractMonths: 0, monthlyFee: 1474, healthScore: 95, mediaStatus: "Healthy",  reportingStatus: "On Schedule", nextAction: "Final sign-off on Sunday's olive-oil reel.",       riskLevel: "Low"      },
  { clientId: "demo-d", lifecycleStage: "At Risk",         servicePlan: "Google Optimization",                   startDate: "Apr 2026", contractMonths: 0, monthlyFee:  477, healthScore: 38, mediaStatus: "Critical", reportingStatus: "Overdue",     nextAction: "Rescue plan call + reshoot brief for storefront.", riskLevel: "Critical" },
];

export const lifecycleStageColor: Record<LifecycleStage, string> = {
  "Lead":                 "border-sky-500/40 text-sky-300 bg-sky-500/10",
  "Signed":               "border-violet-500/40 text-violet-300 bg-violet-500/10",
  "Onboarding":           "border-amber-500/40 text-amber-300 bg-amber-500/10",
  "Active":               "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  "Needs Attention":      "border-yellow-500/40 text-yellow-300 bg-yellow-500/10",
  "At Risk":              "border-rose-500/40 text-rose-300 bg-rose-500/10",
  "Paused":               "border-muted-foreground/40 text-muted-foreground bg-muted/30",
  "Completed / Archived": "border-muted-foreground/40 text-muted-foreground bg-muted/30",
};

export const riskLevelColor: Record<RiskLevel, string> = {
  Low:      "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  Medium:   "border-amber-500/40 text-amber-300 bg-amber-500/10",
  High:     "border-rose-500/40 text-rose-300 bg-rose-500/10",
  Critical: "border-rose-500/60 text-rose-200 bg-rose-500/20",
};
