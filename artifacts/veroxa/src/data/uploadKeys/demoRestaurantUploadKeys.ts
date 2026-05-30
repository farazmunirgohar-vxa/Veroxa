/**
 * demoRestaurantUploadKeys.ts — M012
 *
 * Demo-only model for restaurant-specific Upload Keys.
 *
 * Concept:
 *   Each restaurant gets a single Upload Key. Any approved restaurant
 *   employee with the key can access the app-style upload flow at
 *   `/upload` to submit daily content (food photos, prep clips,
 *   atmosphere shots, menu specials). No individual email/password
 *   account is required for daily contributors during the first-client
 *   phase.
 *
 * Important — this is NOT auth:
 *   - Keys are local/demo placeholders, not secure credentials.
 *   - Match is a plain string compare in the browser.
 *   - The key only unlocks the upload flow for ONE restaurant.
 *   - It does NOT unlock Team, Operator, Owner, pricing, internal
 *     notes, or any other restaurant.
 *   - No Supabase auth, no network call, no DB write.
 *
 * All restaurants below are fictional demo accounts (demo-a … demo-d).
 */

export type DemoRestaurantId = "demo-a" | "demo-b" | "demo-c" | "demo-d";

export type DemoUploadKeyStatus = "active" | "paused";

export type DemoUploadAllowedContentType = "image" | "video";

export type DemoUploadAllowedCategory =
  | "food_photo"
  | "kitchen_prep"
  | "restaurant_atmosphere"
  | "menu_special"
  | "short_video"
  | "other";

export interface DemoRestaurantUploadKey {
  keyId: string;
  restaurantId: DemoRestaurantId;
  restaurantName: string;
  uploadKeyLabel: string;
  /**
   * Plain-text demo key. Real production keys would be hashed,
   * rotatable, and stored server-side — see
   * `docs/M012_M014_RESTAURANT_UPLOAD_KEY_AND_TEAM_INBOX.md`.
   */
  demoKey: string;
  status: DemoUploadKeyStatus;
  allowedContentTypes: DemoUploadAllowedContentType[];
  allowedCategories: DemoUploadAllowedCategory[];
  employeeAccessNote: string;
  demoOnly: true;
}

export const demoRestaurantUploadKeys: DemoRestaurantUploadKey[] = [
  {
    keyId: "uk-demo-a",
    restaurantId: "demo-a",
    restaurantName: "Demo Grill House",
    uploadKeyLabel: "Grill House — Daily Upload",
    demoKey: "DEMO-GRILL-2026",
    status: "active",
    allowedContentTypes: ["image", "video"],
    allowedCategories: [
      "food_photo",
      "kitchen_prep",
      "restaurant_atmosphere",
      "menu_special",
      "short_video",
      "other",
    ],
    employeeAccessNote:
      "Share with approved kitchen + front-of-house staff. One key per location.",
    demoOnly: true,
  },
  {
    keyId: "uk-demo-b",
    restaurantId: "demo-b",
    restaurantName: "Demo Taco Bar",
    uploadKeyLabel: "Taco Bar — Daily Upload",
    demoKey: "DEMO-TACO-2026",
    status: "active",
    allowedContentTypes: ["image", "video"],
    allowedCategories: [
      "food_photo",
      "kitchen_prep",
      "restaurant_atmosphere",
      "menu_special",
      "short_video",
      "other",
    ],
    employeeAccessNote:
      "Share with line cooks and floor leads. Revoke and reissue when staff turns over.",
    demoOnly: true,
  },
  {
    keyId: "uk-demo-c",
    restaurantId: "demo-c",
    restaurantName: "Demo Mediterranean Grill",
    uploadKeyLabel: "Mediterranean Grill — Daily Upload",
    demoKey: "DEMO-MED-2026",
    status: "active",
    allowedContentTypes: ["image", "video"],
    allowedCategories: [
      "food_photo",
      "kitchen_prep",
      "restaurant_atmosphere",
      "menu_special",
      "short_video",
      "other",
    ],
    employeeAccessNote:
      "Approved managers + chefs only. Pair with Premium weekly content needs.",
    demoOnly: true,
  },
  {
    keyId: "uk-demo-d",
    restaurantId: "demo-d",
    restaurantName: "Demo Cafe",
    uploadKeyLabel: "Demo Cafe — Daily Upload",
    demoKey: "DEMO-CAFE-2026",
    status: "paused",
    allowedContentTypes: ["image", "video"],
    allowedCategories: [
      "food_photo",
      "kitchen_prep",
      "restaurant_atmosphere",
      "menu_special",
      "short_video",
      "other",
    ],
    employeeAccessNote:
      "Paused while owner finalises Google Optimization onboarding. Reactivate after kickoff call.",
    demoOnly: true,
  },
];

/**
 * Human-readable label for a category key, used in the upload UI and
 * the Team Upload Inbox.
 */
export const demoUploadCategoryLabels: Record<DemoUploadAllowedCategory, string> = {
  food_photo: "Food photo",
  kitchen_prep: "Kitchen / prep",
  restaurant_atmosphere: "Restaurant atmosphere",
  menu_special: "Menu / special",
  short_video: "Short video / Reel",
  other: "Other",
};
