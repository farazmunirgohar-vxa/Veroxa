/**
 * demoImages.ts — centralized demo image catalog.
 *
 * All entries are DEMO-ONLY. URLs are public, stable, non-branded
 * stock photos used for visual storytelling only. No real client,
 * restaurant, or customer assets. Nothing here implies a real
 * upload, real post, or real publishing event.
 *
 * Keep `demoOnly: true` on every entry as a structural reminder.
 *
 * COHERENCE METADATA (foodType / cuisineFit / bestUseCases /
 * avoidUseCases) is optional and is used by `demoContentMatching.ts`
 * to pick a believable image for a given caption / client. See
 * `docs/DEMO_CONTENT_COHERENCE_GUIDE.md`.
 */

export type DemoImageCategory =
  | "food"
  | "interior"
  | "kitchen"
  | "social_post"
  | "report_visual"
  | "role_hero";

export type DemoImageRoleUse =
  | "client"
  | "team"
  | "operator"
  | "owner"
  | "shared";

/** Coarse food family used to filter believable images per caption. */
export type DemoFoodType =
  | "grill"
  | "tacos"
  | "mediterranean"
  | "cafe"
  | "brunch"
  | "generic";

/** Which demo client cuisines an image realistically fits. */
export type DemoCuisineFit =
  | "demo-a"   // Demo Grill House
  | "demo-b"   // Demo Taco Bar
  | "demo-c"   // Demo Mediterranean Grill
  | "demo-d"   // Demo Cafe
  | "any";

export interface DemoImage {
  id: string;
  title: string;
  alt: string;
  category: DemoImageCategory;
  url: string;
  roleUse: DemoImageRoleUse;
  demoOnly: true;
  /** Optional — coarse cuisine family. Defaults to "generic". */
  foodType?: DemoFoodType;
  /** Optional — which demo clients this image believably fits. */
  cuisineFit?: DemoCuisineFit[];
  /** Optional — keywords/slots this image is a good match for. */
  bestUseCases?: string[];
  /** Optional — keywords/slots this image should NOT be used for. */
  avoidUseCases?: string[];
}

// Stable Unsplash photo IDs. The `?w=600&auto=format&fit=crop&q=70`
// query renders a small, fast-loading thumbnail. These IDs are
// well-known stock food/restaurant photography with permissive
// licensing — not branded or client-specific.
const u = (photoId: string, w = 600): string =>
  `https://images.unsplash.com/${photoId}?w=${w}&auto=format&fit=crop&q=70`;

export const demoImages: DemoImage[] = [
  // ── Food: grill (demo-a / demo-c) ─────────────────────────────
  {
    id: "food-grilled-platter",
    title: "Grilled platter — overhead",
    alt: "Demo photo of a grilled meat platter on a wooden board.",
    category: "food",
    url: u("photo-1565299624946-b28f40a0ae38"),
    roleUse: "shared",
    demoOnly: true,
    foodType: "grill",
    cuisineFit: ["demo-a", "demo-c"],
    bestUseCases: ["grill", "platter", "lamb", "kebab", "shawarma", "lunch", "dinner"],
    avoidUseCases: ["latte", "coffee", "croissant", "pastry", "taco"],
  },
  {
    id: "food-bowl-hero",
    title: "Signature bowl — hero shot",
    alt: "Demo photo of a colorful grain bowl with vegetables.",
    category: "food",
    url: u("photo-1546069901-ba9599a7e63c"),
    roleUse: "shared",
    demoOnly: true,
    foodType: "mediterranean",
    cuisineFit: ["demo-c", "demo-a"],
    bestUseCases: ["bowl", "rice", "mediterranean", "lunch", "healthy"],
    avoidUseCases: ["latte", "coffee", "croissant", "taco"],
  },
  {
    id: "food-spread-table",
    title: "Family-style table spread",
    alt: "Demo photo of a family-style meal spread across a table.",
    category: "food",
    url: u("photo-1504674900247-0877df9cc836"),
    roleUse: "shared",
    demoOnly: true,
    foodType: "generic",
    cuisineFit: ["any"],
    bestUseCases: ["family", "feast", "spread", "weekend", "group"],
  },
  {
    id: "food-plated-dinner",
    title: "Plated dinner — close up",
    alt: "Demo photo of a plated dinner with garnish.",
    category: "food",
    url: u("photo-1559339352-11d035aa65de"),
    roleUse: "shared",
    demoOnly: true,
    foodType: "mediterranean",
    cuisineFit: ["demo-c", "demo-a"],
    bestUseCases: ["dinner", "plated", "octopus", "premium", "evening"],
    avoidUseCases: ["latte", "coffee", "taco"],
  },
  {
    id: "food-pancakes",
    title: "Brunch stack",
    alt: "Demo photo of stacked pancakes with syrup.",
    category: "food",
    url: u("photo-1567620905732-2d1ec7ab7445"),
    roleUse: "shared",
    demoOnly: true,
    foodType: "brunch",
    cuisineFit: ["demo-d"],
    bestUseCases: ["brunch", "pancake", "morning", "weekend"],
    avoidUseCases: ["grill", "taco", "dinner"],
  },

  // ── Food: tacos (demo-b) ──────────────────────────────────────
  {
    id: "food-tacos-flatlay",
    title: "Tacos flat-lay",
    alt: "Demo photo of a flat-lay of tacos with garnishes.",
    category: "food",
    url: u("photo-1565299585323-38d6b0865b47"),
    roleUse: "shared",
    demoOnly: true,
    foodType: "tacos",
    cuisineFit: ["demo-b"],
    bestUseCases: ["taco", "carnitas", "birria", "lunch", "tuesday"],
    avoidUseCases: ["coffee", "latte", "grill", "shawarma"],
  },
  {
    id: "food-birria-closeup",
    title: "Birria cheese-pull close-up",
    alt: "Demo photo of a birria taco cheese pull close-up.",
    category: "food",
    url: u("photo-1599974579688-8dbdd335c77f"),
    roleUse: "shared",
    demoOnly: true,
    foodType: "tacos",
    cuisineFit: ["demo-b"],
    bestUseCases: ["birria", "cheese", "texture", "reel", "close-up"],
    avoidUseCases: ["coffee", "latte", "pastry"],
  },

  // ── Food: cafe (demo-d) ───────────────────────────────────────
  {
    id: "food-latte-art",
    title: "Specialty latte art",
    alt: "Demo photo of a latte with leaf-pattern art.",
    category: "food",
    url: u("photo-1541167760496-1628856ab772"),
    roleUse: "shared",
    demoOnly: true,
    foodType: "cafe",
    cuisineFit: ["demo-d"],
    bestUseCases: ["latte", "coffee", "morning", "cardamom", "beverage"],
    avoidUseCases: ["grill", "taco", "dinner", "shawarma"],
  },
  {
    id: "food-croissant-pastry",
    title: "Pistachio croissant — bakery detail",
    alt: "Demo photo of a flaky pistachio croissant close-up.",
    category: "food",
    url: u("photo-1555507036-ab1f4038808a"),
    roleUse: "shared",
    demoOnly: true,
    foodType: "cafe",
    cuisineFit: ["demo-d"],
    bestUseCases: ["croissant", "pastry", "bakery", "morning", "pistachio"],
    avoidUseCases: ["grill", "taco", "dinner"],
  },

  // ── Interior ──────────────────────────────────────────────────
  {
    id: "interior-warm-dining",
    title: "Warm dining room",
    alt: "Demo photo of a warmly lit restaurant dining room.",
    category: "interior",
    url: u("photo-1414235077428-338989a2e8c0"),
    roleUse: "shared",
    demoOnly: true,
    cuisineFit: ["any"],
  },
  {
    id: "interior-modern-bar",
    title: "Modern bar counter",
    alt: "Demo photo of a modern restaurant bar counter.",
    category: "interior",
    url: u("photo-1517248135467-4c7edcad34c4"),
    roleUse: "shared",
    demoOnly: true,
    cuisineFit: ["any"],
  },

  // ── Kitchen / prep ────────────────────────────────────────────
  {
    id: "kitchen-prep-line",
    title: "Kitchen prep line",
    alt: "Demo photo of a kitchen prep line in service.",
    category: "kitchen",
    url: u("photo-1514933651103-005eec06c04b"),
    roleUse: "shared",
    demoOnly: true,
    cuisineFit: ["any"],
    bestUseCases: ["bts", "behind-the-scenes", "prep", "kitchen"],
  },
  {
    id: "kitchen-chef-plate",
    title: "Chef plating a dish",
    alt: "Demo photo of a chef plating a finished dish.",
    category: "kitchen",
    url: u("photo-1556909114-f6e7ad7d3136"),
    roleUse: "shared",
    demoOnly: true,
    cuisineFit: ["any"],
    bestUseCases: ["bts", "behind-the-scenes", "plating", "chef", "reel"],
  },

  // ── Social post mockups (reuse food shots as preview tiles) ──
  {
    id: "social-instagram-tile",
    title: "Instagram tile mock",
    alt: "Demo photo treated as an Instagram tile preview.",
    category: "social_post",
    url: u("photo-1565299624946-b28f40a0ae38", 400),
    roleUse: "shared",
    demoOnly: true,
  },
  {
    id: "social-facebook-tile",
    title: "Facebook tile mock",
    alt: "Demo photo treated as a Facebook tile preview.",
    category: "social_post",
    url: u("photo-1559339352-11d035aa65de", 400),
    roleUse: "shared",
    demoOnly: true,
  },

  // ── Report visuals ────────────────────────────────────────────
  {
    id: "report-monthly-cover",
    title: "Monthly report cover",
    alt: "Demo cover visual for a monthly performance report.",
    category: "report_visual",
    url: u("photo-1551288049-bebda4e38f71"),
    roleUse: "shared",
    demoOnly: true,
  },
  {
    id: "report-weekly-cover",
    title: "Weekly report cover",
    alt: "Demo cover visual for a weekly performance report.",
    category: "report_visual",
    url: u("photo-1460925895917-afdab827c52f"),
    roleUse: "shared",
    demoOnly: true,
  },

  // ── Role hero placeholders (per-client restaurant covers) ────
  {
    id: "hero-restaurant-1",
    title: "Demo restaurant — front-of-house",
    alt: "Demo restaurant front-of-house cover image.",
    category: "role_hero",
    url: u("photo-1552566626-52f8b828add9"),
    roleUse: "shared",
    demoOnly: true,
  },
  {
    id: "hero-restaurant-2",
    title: "Demo restaurant — bistro patio",
    alt: "Demo bistro patio cover image.",
    category: "role_hero",
    url: u("photo-1466978913421-dad2ebd01d17"),
    roleUse: "shared",
    demoOnly: true,
  },
];

/** Lookup by id. Returns undefined if missing. */
export function getDemoImage(id: string): DemoImage | undefined {
  return demoImages.find((img) => img.id === id);
}

/** All images in a given category, in catalog order. */
export function getDemoImagesByCategory(
  category: DemoImageCategory,
): DemoImage[] {
  return demoImages.filter((img) => img.category === category);
}

/**
 * Deterministically pick a hero image for a given key (e.g. clientId).
 * Returns one of the `role_hero` images. Pure hash — same key always
 * returns the same image.
 */
export function pickHeroImageFor(key: string): DemoImage {
  const heroes = getDemoImagesByCategory("role_hero");
  if (heroes.length === 0) return demoImages[0];
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return heroes[hash % heroes.length];
}
