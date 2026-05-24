/**
 * Veroxa Restaurant Media Guidance Engine — rule-based, demo-only.
 *
 * This module is the single source of truth for static restaurant media
 * recommendations. It is pure data + pure helper functions:
 *  - no API calls
 *  - no Supabase access
 *  - no AI provider integration
 *  - no side effects
 *
 * Real AI-driven guidance is planned for a later phase
 * (see docs/MEDIA_GUIDANCE_ENGINE_PLAN.md and
 *  docs/AI_AGENT_ARCHITECTURE_PLAN.md).
 */

export type RestaurantType =
  | "halal_grill"
  | "bakery"
  | "donut_shop"
  | "pizza"
  | "burger"
  | "coffee_shop"
  | "fine_dining"
  | "food_truck"
  | "mexican"
  | "mediterranean"
  | "asian"
  | "dessert_shop"
  | "general_restaurant";

export type PhotoPlatform =
  | "Instagram"
  | "Facebook"
  | "TikTok"
  | "Google Business Profile"
  | "Ads";

export type Difficulty = "easy" | "medium" | "advanced";
export type Frequency = "daily" | "weekly" | "monthly" | "seasonal";

export interface PhotoIdea {
  title: string;
  description: string;
  bestFor: PhotoPlatform[];
  difficulty: Difficulty;
  frequency: Frequency;
  exampleShot: string;
}

export interface WeeklyCaptureSlot {
  day: string;
  what: string;
  why: string;
}

export interface GoogleShot {
  category: string;
  description: string;
}

export interface QuickTip {
  title: string;
  text: string;
}

export interface RestaurantGuidance {
  type: RestaurantType;
  label: string;
  bestPhotoIdeas: PhotoIdea[];
  avoid: string[];
  weeklyCapturePlan: WeeklyCaptureSlot[];
  googleSpecificShots: GoogleShot[];
  quickTips: QuickTip[];
}

const baseQuickTips: QuickTip[] = [
  { title: "Use natural light", text: "Shoot near a window mid-morning or mid-afternoon. Avoid overhead fluorescents." },
  { title: "Pick one angle and repeat it", text: "Most restaurants get more reach from a consistent 45° / overhead style than from chasing variety." },
  { title: "Shoot before service", text: "Capture plated dishes 10–15 minutes before the rush so the team is not interrupted." },
  { title: "Don't overthink it", text: "Phone cameras are enough. Clean plate edges, wipe smudges, frame tight." },
  { title: "Keep a small running list", text: "Note 2–3 dishes / moments per week to cover; do not try to capture everything." },
];

const baseAvoid: string[] = [
  "Blurry or out-of-focus photos",
  "Heavy filters that distort food color",
  "Cluttered backgrounds (napkins, receipts, hands, dirty dishes)",
  "Direct overhead flash that flattens textures",
];

function googleBaseShots(extraDish: string): GoogleShot[] {
  return [
    { category: "Storefront", description: "Front of the restaurant, signage clearly visible, shot during daylight." },
    { category: "Interior", description: "Wide seating shot, lights on, clean tables, taken before opening." },
    { category: "Menu", description: "Clear menu board or printed menu, no glare." },
    { category: "Popular dish", description: extraDish },
    { category: "Staff", description: "Team member preparing food or greeting guests (with permission)." },
  ];
}

export const GUIDANCE: Record<RestaurantType, RestaurantGuidance> = {
  halal_grill: {
    type: "halal_grill",
    label: "Halal Grill / Kebab Restaurant",
    bestPhotoIdeas: [
      { title: "Grill flame moment", description: "Capture the open flame as skewers hit the grill — smoke and char tell the story.", bestFor: ["Instagram", "TikTok", "Ads"], difficulty: "medium", frequency: "weekly", exampleShot: "Side-angle 1m from grill, slight underexposure, fast shutter to freeze flame." },
      { title: "Platter close-up", description: "Overhead shot of a full mixed grill platter with rice, salads, and sauces.", bestFor: ["Instagram", "Google Business Profile", "Facebook"], difficulty: "easy", frequency: "weekly", exampleShot: "Overhead from ~50cm, natural light, edges in frame." },
      { title: "Family / catering tray", description: "Large shared tray showing portion generosity — strong for weekend promo.", bestFor: ["Facebook", "Ads", "Google Business Profile"], difficulty: "easy", frequency: "weekly", exampleShot: "45° angle, hands optional, tray edges crop into frame." },
      { title: "Storefront daylight", description: "Front of restaurant with signage clearly visible.", bestFor: ["Google Business Profile"], difficulty: "easy", frequency: "monthly", exampleShot: "Eye-level, mid-morning, no cars blocking entrance." },
      { title: "Prep / butcher detail", description: "Hands shaping kofta, marinating chicken, or trimming lamb — authenticity shot.", bestFor: ["Instagram", "TikTok"], difficulty: "medium", frequency: "weekly", exampleShot: "Close on hands, shallow depth, side light from a window." },
      { title: "Saffron rice / bread detail", description: "Macro of steamed saffron rice or fresh bread coming out of the oven.", bestFor: ["Instagram"], difficulty: "easy", frequency: "weekly", exampleShot: "Macro 30cm, soft window light, focus on steam." },
    ],
    avoid: [
      ...baseAvoid,
      "Photos that show empty grills or empty trays (looks low-supply)",
      "Plates with broken garnish or sauce streaks on the rim",
    ],
    weeklyCapturePlan: [
      { day: "Mon",        what: "Storefront + 1 hero platter",        why: "Refresh Google profile photo and main feed post." },
      { day: "Tue / Wed",  what: "Two prep / grill action shots",      why: "Authenticity content for Reels / TikTok." },
      { day: "Thu",        what: "Family tray + side dishes",          why: "Weekend promo material." },
      { day: "Fri",        what: "Service-time customer / table shot", why: "Social proof — busy dining room." },
      { day: "Sun",        what: "1 leftover / behind-the-scenes",     why: "Buffer for low-content weeks." },
    ],
    googleSpecificShots: googleBaseShots("Mixed grill platter overhead, clear rice + meat separation."),
    quickTips: baseQuickTips,
  },

  bakery: {
    type: "bakery",
    label: "Bakery",
    bestPhotoIdeas: [
      { title: "Fresh-out-of-oven tray", description: "Bread, croissants, or pastries straight from the oven — steam visible.", bestFor: ["Instagram", "Google Business Profile"], difficulty: "easy", frequency: "daily", exampleShot: "Tray on counter, side light, steam captured." },
      { title: "Display case wide shot", description: "Full display case, well-lit, products front-facing.", bestFor: ["Google Business Profile", "Facebook"], difficulty: "easy", frequency: "weekly", exampleShot: "Eye-level, glass clean, lights on inside case." },
      { title: "Hands shaping dough", description: "Baker laminating, rolling, or scoring loaves.", bestFor: ["Instagram", "TikTok"], difficulty: "medium", frequency: "weekly", exampleShot: "Top-down or 45°, flour visible, slow-motion video works well." },
      { title: "Cross-section of a pastry", description: "Cut a croissant or loaf in half to show layers / crumb.", bestFor: ["Instagram"], difficulty: "medium", frequency: "weekly", exampleShot: "Macro 20cm, soft side light, contrasting board." },
      { title: "Custom cake or special order", description: "Finished celebration cake or specialty product.", bestFor: ["Facebook", "Instagram", "Ads"], difficulty: "easy", frequency: "monthly", exampleShot: "Plain background, 45° angle, no clutter." },
    ],
    avoid: [
      ...baseAvoid,
      "Half-empty display cases (signals end-of-day)",
      "Products under harsh yellow tungsten light",
    ],
    weeklyCapturePlan: [
      { day: "Mon",  what: "Display case wide + 1 hero pastry",  why: "Refresh Google + main feed." },
      { day: "Wed",  what: "Hands-shaping reel",                 why: "Process video for Reels / TikTok." },
      { day: "Fri",  what: "Cross-section / cut shot",           why: "Texture appeal for Instagram." },
      { day: "Sat",  what: "Custom order / specials",            why: "Show range, drive custom orders." },
      { day: "Sun",  what: "Storefront refresh shot",            why: "Google profile freshness." },
    ],
    googleSpecificShots: googleBaseShots("Most-popular pastry / signature loaf, well-lit."),
    quickTips: baseQuickTips,
  },

  donut_shop: {
    type: "donut_shop",
    label: "Donut Shop",
    bestPhotoIdeas: [
      { title: "Donut wall / full rack", description: "Full rack of donuts showing variety and color.", bestFor: ["Instagram", "Google Business Profile"], difficulty: "easy", frequency: "daily", exampleShot: "Straight-on, eye level, fill the frame." },
      { title: "Single hero donut", description: "One signature donut, clean background.", bestFor: ["Instagram", "Ads"], difficulty: "easy", frequency: "weekly", exampleShot: "45° on a plain plate, natural light." },
      { title: "Glaze / filling pour", description: "Action shot of glazing or filling being added.", bestFor: ["Instagram", "TikTok"], difficulty: "medium", frequency: "weekly", exampleShot: "Slow-mo, side-lit, contrasting background." },
      { title: "Coffee + donut pairing", description: "Donut next to your coffee — pairs well with morning posts.", bestFor: ["Instagram", "Facebook"], difficulty: "easy", frequency: "weekly", exampleShot: "Overhead, 2 props max." },
      { title: "Box of variety donuts", description: "Open dozen-box showing variety — strong for catering.", bestFor: ["Facebook", "Ads"], difficulty: "easy", frequency: "monthly", exampleShot: "Overhead, clean box, all donuts visible." },
    ],
    avoid: [
      ...baseAvoid,
      "Stale-looking glaze (shoot early)",
      "Half-empty boxes",
    ],
    weeklyCapturePlan: [
      { day: "Mon",  what: "Full rack hero shot",        why: "Refresh feed + Google." },
      { day: "Tue",  what: "Coffee + donut pairing",     why: "Morning audience." },
      { day: "Thu",  what: "Glazing / filling reel",     why: "Reels / TikTok process video." },
      { day: "Sat",  what: "Catering / dozen box",       why: "Drive bulk / event orders." },
      { day: "Sun",  what: "Storefront / signage shot",  why: "Google freshness." },
    ],
    googleSpecificShots: googleBaseShots("Signature donut close-up, clean plate."),
    quickTips: baseQuickTips,
  },

  pizza: {
    type: "pizza",
    label: "Pizza Restaurant",
    bestPhotoIdeas: [
      { title: "Cheese pull mid-slice", description: "Lift a slice with strong cheese pull — short video works best.", bestFor: ["Instagram", "TikTok", "Ads"], difficulty: "medium", frequency: "weekly", exampleShot: "Side view, lift slowly, fast shutter, contrasting background." },
      { title: "Whole pie overhead", description: "Full pizza on board or peel.", bestFor: ["Instagram", "Google Business Profile"], difficulty: "easy", frequency: "weekly", exampleShot: "Overhead, fill frame, wooden board or stone." },
      { title: "Oven flame / fire shot", description: "Pizza going into a wood-fired or stone oven.", bestFor: ["Instagram", "TikTok"], difficulty: "medium", frequency: "weekly", exampleShot: "Front-on to oven mouth, slight underexposure." },
      { title: "Dough toss / spin", description: "Pizzaiolo tossing dough — short video.", bestFor: ["TikTok", "Instagram"], difficulty: "medium", frequency: "weekly", exampleShot: "Phone vertical, slow-mo, busy kitchen behind." },
      { title: "Specialty / topping detail", description: "Macro on a specialty topping or charred crust edge.", bestFor: ["Instagram"], difficulty: "medium", frequency: "monthly", exampleShot: "Macro 20cm, soft side light." },
    ],
    avoid: [
      ...baseAvoid,
      "Cold-looking, hardened cheese",
      "Greasy box-only shots (low quality signal)",
    ],
    weeklyCapturePlan: [
      { day: "Mon",  what: "Whole-pie hero overhead",        why: "Feed + Google refresh." },
      { day: "Wed",  what: "Cheese pull video",              why: "Reels / TikTok engagement." },
      { day: "Fri",  what: "Oven flame / dough toss reel",   why: "Behind-the-scenes content." },
      { day: "Sat",  what: "Family-sized / group order",     why: "Weekend promo." },
      { day: "Sun",  what: "Storefront / outdoor sign",      why: "Google freshness." },
    ],
    googleSpecificShots: googleBaseShots("Signature pizza overhead, no glare on cheese."),
    quickTips: baseQuickTips,
  },

  burger: {
    type: "burger",
    label: "Burger Restaurant",
    bestPhotoIdeas: [
      { title: "Stacked burger 45°", description: "Tall burger, side-on, all layers visible.", bestFor: ["Instagram", "Ads", "Google Business Profile"], difficulty: "easy", frequency: "weekly", exampleShot: "45° eye level, plain wooden board, fries cropped in." },
      { title: "Burger cross-section", description: "Cut burger in half, sauce / cheese visible inside.", bestFor: ["Instagram"], difficulty: "medium", frequency: "monthly", exampleShot: "Side-on, contrasting board, shallow depth." },
      { title: "Sauce drip / smash action", description: "Cheese melting on a smash patty or sauce being added.", bestFor: ["TikTok", "Instagram"], difficulty: "medium", frequency: "weekly", exampleShot: "Slow-mo overhead or 45°." },
      { title: "Fries + burger combo", description: "Plate or basket combo shot.", bestFor: ["Facebook", "Instagram"], difficulty: "easy", frequency: "weekly", exampleShot: "Overhead, no clutter, two-tone background." },
      { title: "Shake / drink pairing", description: "Burger + milkshake/drink pairing.", bestFor: ["Instagram"], difficulty: "easy", frequency: "monthly", exampleShot: "45°, two props max." },
    ],
    avoid: [
      ...baseAvoid,
      "Burgers that look squished or leaking unappetizing sauce",
      "Wilted lettuce / sad-looking pickles",
    ],
    weeklyCapturePlan: [
      { day: "Mon",  what: "Hero stacked burger + fries",  why: "Feed + Google refresh." },
      { day: "Wed",  what: "Smash / sauce action reel",    why: "Short-form video." },
      { day: "Fri",  what: "Combo / meal-deal shot",       why: "Weekend promo." },
      { day: "Sat",  what: "Customer / table shot",        why: "Social proof." },
      { day: "Sun",  what: "Storefront + signage",         why: "Google freshness." },
    ],
    googleSpecificShots: googleBaseShots("Signature burger 45°, plain wooden board."),
    quickTips: baseQuickTips,
  },

  coffee_shop: {
    type: "coffee_shop",
    label: "Coffee Shop / Café",
    bestPhotoIdeas: [
      { title: "Latte art overhead", description: "Fresh latte art shot from above.", bestFor: ["Instagram", "Google Business Profile"], difficulty: "easy", frequency: "daily", exampleShot: "Overhead, cup centered, plain saucer." },
      { title: "Barista pour", description: "Barista pouring milk or espresso pulling.", bestFor: ["Instagram", "TikTok"], difficulty: "medium", frequency: "weekly", exampleShot: "45° from bar level, fast shutter." },
      { title: "Pastry + coffee pairing", description: "Coffee with a baked-good pairing.", bestFor: ["Instagram", "Facebook"], difficulty: "easy", frequency: "weekly", exampleShot: "Overhead, wooden table, soft window light." },
      { title: "Café interior corner", description: "Cozy corner of the café, customer in soft focus.", bestFor: ["Instagram", "Google Business Profile"], difficulty: "easy", frequency: "monthly", exampleShot: "Wide, eye level, mid-morning natural light." },
      { title: "Bean / brew detail", description: "Macro of beans, grinder, or pour-over setup.", bestFor: ["Instagram"], difficulty: "medium", frequency: "monthly", exampleShot: "Macro 20cm, soft side light." },
    ],
    avoid: [
      ...baseAvoid,
      "Empty café shots at peak hours (implies low demand)",
      "Latte art that has collapsed / been carried too far",
    ],
    weeklyCapturePlan: [
      { day: "Mon",  what: "Hero latte art overhead",     why: "Daily feed staple." },
      { day: "Wed",  what: "Barista pour reel",           why: "Short-form video." },
      { day: "Fri",  what: "Pastry + coffee pairing",     why: "Cross-promote bakery items." },
      { day: "Sat",  what: "Interior cozy shot",          why: "Atmosphere + Google freshness." },
      { day: "Sun",  what: "Bean / brew detail",          why: "Craft credibility." },
    ],
    googleSpecificShots: googleBaseShots("Signature drink overhead with clean latte art."),
    quickTips: baseQuickTips,
  },

  fine_dining: {
    type: "fine_dining",
    label: "Fine Dining",
    bestPhotoIdeas: [
      { title: "Plated course overhead", description: "Single course, minimal plate, intentional negative space.", bestFor: ["Instagram", "Ads"], difficulty: "advanced", frequency: "weekly", exampleShot: "Overhead, dark plate, single soft side light." },
      { title: "Tasting menu progression", description: "Series of courses laid out — strong carousel post.", bestFor: ["Instagram", "Facebook"], difficulty: "advanced", frequency: "monthly", exampleShot: "Consistent angle and lighting across courses." },
      { title: "Chef plating moment", description: "Chef using tweezers / brush at pass.", bestFor: ["Instagram", "TikTok"], difficulty: "advanced", frequency: "monthly", exampleShot: "Side-on at pass, shallow depth." },
      { title: "Dining room mood", description: "Evening interior with candles / ambient light.", bestFor: ["Google Business Profile", "Instagram"], difficulty: "medium", frequency: "monthly", exampleShot: "Wide, low ISO, tripod if possible." },
      { title: "Wine / pairing detail", description: "Glass being poured, bottle label visible.", bestFor: ["Instagram"], difficulty: "medium", frequency: "monthly", exampleShot: "Side-on, glass against soft light." },
    ],
    avoid: [
      ...baseAvoid,
      "Phone-flash plate shots (kills the mood)",
      "Cluttered backgrounds with service items visible",
    ],
    weeklyCapturePlan: [
      { day: "Tue",  what: "1 hero course overhead",      why: "Feed staple." },
      { day: "Thu",  what: "Chef plating reel",           why: "Behind-the-scenes." },
      { day: "Sat",  what: "Dining room evening mood",    why: "Atmosphere content." },
      { day: "Sun",  what: "Wine / pairing detail",       why: "Beverage program." },
    ],
    googleSpecificShots: googleBaseShots("Signature dish overhead, controlled lighting."),
    quickTips: baseQuickTips,
  },

  food_truck: {
    type: "food_truck",
    label: "Food Truck",
    bestPhotoIdeas: [
      { title: "Truck exterior in location", description: "Full truck shot at the day's location.", bestFor: ["Instagram", "Google Business Profile", "Facebook"], difficulty: "easy", frequency: "daily", exampleShot: "Eye level, full truck in frame, branding visible." },
      { title: "Window service moment", description: "Customer being handed an order through the window.", bestFor: ["Instagram"], difficulty: "easy", frequency: "weekly", exampleShot: "Side-on, hands + food visible, candid." },
      { title: "Hero menu item", description: "Signature dish on a tray or in a basket.", bestFor: ["Instagram", "Ads"], difficulty: "easy", frequency: "weekly", exampleShot: "45° on truck counter, natural light." },
      { title: "Line / busy moment", description: "Queue forming — proves demand.", bestFor: ["Instagram", "Facebook"], difficulty: "easy", frequency: "weekly", exampleShot: "Wide, candid, no faces required." },
      { title: "Location map / 'Find us today'", description: "Today's location card or quick on-the-go reel.", bestFor: ["Instagram", "Facebook"], difficulty: "easy", frequency: "daily", exampleShot: "Photo of truck + chalkboard map, or quick vertical video." },
    ],
    avoid: [
      ...baseAvoid,
      "Static menu-only posts (low engagement)",
      "Forgetting to update today's location",
    ],
    weeklyCapturePlan: [
      { day: "Daily",  what: "Truck exterior + 'find us'",   why: "Audience needs to know where you are." },
      { day: "Wed",    what: "Window-service candid",        why: "Authenticity content." },
      { day: "Fri",    what: "Hero menu item",               why: "Weekend appetite content." },
      { day: "Sat",    what: "Line / busy moment",           why: "Social proof." },
      { day: "Sun",    what: "Weekly recap reel",            why: "Tease next week's locations." },
    ],
    googleSpecificShots: googleBaseShots("Hero menu item on truck counter, branding visible."),
    quickTips: baseQuickTips,
  },

  mexican: {
    type: "mexican",
    label: "Mexican Restaurant",
    bestPhotoIdeas: [
      { title: "Taco platter overhead", description: "Variety of tacos with garnishes and sauces.", bestFor: ["Instagram", "Google Business Profile"], difficulty: "easy", frequency: "weekly", exampleShot: "Overhead, lime + cilantro visible, contrasting board." },
      { title: "Salsa / guacamole bar", description: "Fresh salsas in small bowls — color story.", bestFor: ["Instagram", "Facebook"], difficulty: "easy", frequency: "weekly", exampleShot: "Overhead, multiple small bowls arranged." },
      { title: "Tortilla press / griddle", description: "Hands pressing or flipping fresh tortillas.", bestFor: ["Instagram", "TikTok"], difficulty: "medium", frequency: "weekly", exampleShot: "Top-down, hands in frame, slow-mo video works." },
      { title: "Margarita / drink pour", description: "Fresh margarita or agua fresca being poured.", bestFor: ["Instagram"], difficulty: "easy", frequency: "weekly", exampleShot: "45°, glass against contrasting backdrop." },
      { title: "Family / shared platter", description: "Large shared platter — for weekend promo.", bestFor: ["Facebook", "Ads"], difficulty: "easy", frequency: "monthly", exampleShot: "45° angle, hands optional." },
    ],
    avoid: [
      ...baseAvoid,
      "Watery or pale guac (color is everything here)",
      "Tortillas plated too long ago (they shrink)",
    ],
    weeklyCapturePlan: [
      { day: "Mon",  what: "Taco platter overhead",        why: "Feed + Google refresh." },
      { day: "Wed",  what: "Tortilla press reel",          why: "Process video." },
      { day: "Fri",  what: "Margarita / drink shot",       why: "Weekend lead-in." },
      { day: "Sat",  what: "Family platter",               why: "Weekend promo." },
      { day: "Sun",  what: "Storefront refresh",           why: "Google freshness." },
    ],
    googleSpecificShots: googleBaseShots("Signature taco or platter overhead with garnishes."),
    quickTips: baseQuickTips,
  },

  mediterranean: {
    type: "mediterranean",
    label: "Mediterranean Restaurant",
    bestPhotoIdeas: [
      { title: "Mezze spread overhead", description: "Variety of small dips and bites in small bowls.", bestFor: ["Instagram", "Google Business Profile", "Facebook"], difficulty: "easy", frequency: "weekly", exampleShot: "Overhead, fill frame, soft natural light." },
      { title: "Grilled main + sides", description: "Hero protein with rice / salad / dips.", bestFor: ["Instagram", "Ads"], difficulty: "easy", frequency: "weekly", exampleShot: "45° on a wooden board." },
      { title: "Fresh ingredient detail", description: "Olives, herbs, lemons — color and texture.", bestFor: ["Instagram"], difficulty: "easy", frequency: "weekly", exampleShot: "Macro 20cm, soft side light." },
      { title: "Bread / pita oven shot", description: "Fresh bread out of the oven.", bestFor: ["Instagram", "TikTok"], difficulty: "medium", frequency: "weekly", exampleShot: "Action shot at oven, steam visible." },
      { title: "Family platter / shared meal", description: "Shared meal showing variety + portion.", bestFor: ["Facebook", "Ads"], difficulty: "easy", frequency: "monthly", exampleShot: "Overhead, hands optional." },
    ],
    avoid: [
      ...baseAvoid,
      "Oil pools on the plate that look messy",
      "Dim Mediterranean photos with no color contrast",
    ],
    weeklyCapturePlan: [
      { day: "Mon",  what: "Mezze spread overhead",       why: "Feed + Google refresh." },
      { day: "Wed",  what: "Grilled main + sides",        why: "Lunch / dinner promo." },
      { day: "Fri",  what: "Bread / pita oven reel",      why: "Process video." },
      { day: "Sat",  what: "Family platter",              why: "Weekend promo." },
      { day: "Sun",  what: "Ingredient detail",           why: "Craft / quality story." },
    ],
    googleSpecificShots: googleBaseShots("Mezze spread overhead with strong color variety."),
    quickTips: baseQuickTips,
  },

  asian: {
    type: "asian",
    label: "Asian Restaurant",
    bestPhotoIdeas: [
      { title: "Noodle / ramen overhead", description: "Bowl with full toppings visible.", bestFor: ["Instagram", "Google Business Profile"], difficulty: "easy", frequency: "weekly", exampleShot: "Overhead, dark table, chopsticks lifting noodles." },
      { title: "Steam / wok action", description: "Wok fire or steaming bamboo basket.", bestFor: ["Instagram", "TikTok"], difficulty: "medium", frequency: "weekly", exampleShot: "Side-on at wok, fast shutter for flame." },
      { title: "Dumpling / sushi detail", description: "Macro on a single dumpling or piece of sushi.", bestFor: ["Instagram"], difficulty: "medium", frequency: "weekly", exampleShot: "Macro 20cm, plain background." },
      { title: "Family / sharing set", description: "Multi-dish shared meal.", bestFor: ["Facebook", "Ads"], difficulty: "easy", frequency: "monthly", exampleShot: "Overhead, hands optional." },
      { title: "Beverage / bubble tea", description: "Cold drink with ice / pearls visible.", bestFor: ["Instagram"], difficulty: "easy", frequency: "weekly", exampleShot: "45°, plain background, contrasting cup color." },
    ],
    avoid: [
      ...baseAvoid,
      "Cold broth on top — shoot quickly",
      "Sushi shots with rice falling apart",
    ],
    weeklyCapturePlan: [
      { day: "Mon",  what: "Noodle overhead",              why: "Feed + Google refresh." },
      { day: "Wed",  what: "Wok / steam reel",             why: "Process video." },
      { day: "Fri",  what: "Beverage / drink shot",        why: "Weekend lead-in." },
      { day: "Sat",  what: "Family sharing set",           why: "Weekend promo." },
      { day: "Sun",  what: "Sushi / dumpling detail",      why: "Craft content." },
    ],
    googleSpecificShots: googleBaseShots("Signature bowl overhead with full toppings."),
    quickTips: baseQuickTips,
  },

  dessert_shop: {
    type: "dessert_shop",
    label: "Dessert Shop",
    bestPhotoIdeas: [
      { title: "Display case wide", description: "Full case of desserts, all front-facing.", bestFor: ["Instagram", "Google Business Profile"], difficulty: "easy", frequency: "weekly", exampleShot: "Eye level, clean glass, lights on." },
      { title: "Single hero dessert", description: "One signature dessert on a clean plate.", bestFor: ["Instagram", "Ads"], difficulty: "easy", frequency: "weekly", exampleShot: "45°, plain plate, soft light." },
      { title: "Sauce / topping action", description: "Drizzle or topping being added.", bestFor: ["Instagram", "TikTok"], difficulty: "medium", frequency: "weekly", exampleShot: "Slow-mo overhead." },
      { title: "Cross-section / cut", description: "Cut dessert showing layers / filling.", bestFor: ["Instagram"], difficulty: "medium", frequency: "monthly", exampleShot: "Side-on, contrasting board." },
      { title: "Custom / occasion dessert", description: "Birthday cake or celebration dessert.", bestFor: ["Facebook", "Instagram"], difficulty: "easy", frequency: "monthly", exampleShot: "Plain background, 45°." },
    ],
    avoid: [
      ...baseAvoid,
      "Melted / collapsed plating",
      "Cluttered glass case backgrounds",
    ],
    weeklyCapturePlan: [
      { day: "Mon",  what: "Display case wide",            why: "Feed + Google refresh." },
      { day: "Wed",  what: "Sauce / topping reel",         why: "Short-form video." },
      { day: "Fri",  what: "Hero single dessert",          why: "Weekend promo." },
      { day: "Sat",  what: "Custom / occasion dessert",    why: "Drive custom orders." },
      { day: "Sun",  what: "Storefront refresh",           why: "Google freshness." },
    ],
    googleSpecificShots: googleBaseShots("Signature dessert 45°, clean plate."),
    quickTips: baseQuickTips,
  },

  general_restaurant: {
    type: "general_restaurant",
    label: "General Restaurant",
    bestPhotoIdeas: [
      { title: "Hero dish overhead", description: "Most-popular dish, plated cleanly.", bestFor: ["Instagram", "Google Business Profile"], difficulty: "easy", frequency: "weekly", exampleShot: "Overhead, natural light, plain board." },
      { title: "Storefront daytime", description: "Front of restaurant with signage visible.", bestFor: ["Google Business Profile"], difficulty: "easy", frequency: "monthly", exampleShot: "Eye level, mid-morning." },
      { title: "Interior wide shot", description: "Wide seating area, clean tables, lights on.", bestFor: ["Google Business Profile", "Facebook"], difficulty: "easy", frequency: "monthly", exampleShot: "Wide, no people required if shot before opening." },
      { title: "Behind-the-scenes prep", description: "Team prepping or plating.", bestFor: ["Instagram", "TikTok"], difficulty: "medium", frequency: "weekly", exampleShot: "Side-on, hands in frame." },
      { title: "Customer / table moment", description: "Full table being enjoyed (with permission).", bestFor: ["Instagram", "Facebook"], difficulty: "easy", frequency: "monthly", exampleShot: "Candid 45°, focus on food not faces." },
    ],
    avoid: baseAvoid,
    weeklyCapturePlan: [
      { day: "Mon",  what: "Hero dish overhead",           why: "Feed + Google refresh." },
      { day: "Wed",  what: "Behind-the-scenes prep",       why: "Process content." },
      { day: "Fri",  what: "Customer / table moment",      why: "Social proof for weekend." },
      { day: "Sat",  what: "Specials / weekly dish",       why: "Drive weekend traffic." },
      { day: "Sun",  what: "Storefront / interior",        why: "Google freshness." },
    ],
    googleSpecificShots: googleBaseShots("Signature dish overhead, clean composition."),
    quickTips: baseQuickTips,
  },
};

export function getRestaurantTypeOptions(): Array<{ value: RestaurantType; label: string }> {
  return (Object.keys(GUIDANCE) as RestaurantType[]).map((type) => ({
    value: type,
    label: GUIDANCE[type].label,
  }));
}

export function getGuidanceForRestaurantType(type: RestaurantType): RestaurantGuidance {
  return GUIDANCE[type] ?? GUIDANCE.general_restaurant;
}

export function getDefaultGuidance(): RestaurantGuidance {
  return GUIDANCE.halal_grill;
}
