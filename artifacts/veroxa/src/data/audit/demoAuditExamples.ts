/**
 * demoAuditExamples.ts — M026A / M027A
 *
 * Fictional-only demo inputs. Never use real restaurant or prospect names.
 * Uses the simplified M027A input structure (no required currentGoal).
 */

import type { RestaurantAuditInput } from "@/lib/audit/auditTypes";

export const demoAuditExamples: {
  id: string;
  label: string;
  input: RestaurantAuditInput;
}[] = [
  {
    id: "demo_grill_house",
    label: "Demo Grill House (Mediterranean grill)",
    input: {
      restaurantName: "Demo Grill House",
      city: "Demo City",
      state: "NY",
      cuisineType: "Mediterranean grill, kebab, family platters",
      googleListingUrl: "https://maps.google.com/?q=demo+grill+house",
      websiteUrl: "https://demogrillhouse.example",
      menuOrderingUrl: "https://demogrillhouse.example/menu",
      instagramUrl: "https://instagram.com/demogrillhouse",
    },
  },
  {
    id: "demo_momo_kitchen",
    label: "Demo Momo Kitchen (Nepali momo)",
    input: {
      restaurantName: "Demo Momo Kitchen",
      city: "Demo City",
      state: "NJ",
      cuisineType: "Nepali momo, dumplings, family platters",
      instagramUrl: "https://instagram.com/demomomo",
      tiktokUrl: "https://tiktok.com/@demomomo",
    },
  },
  {
    id: "demo_med_table",
    label: "Demo Mediterranean Table (Mediterranean + bakery)",
    input: {
      restaurantName: "Demo Mediterranean Table",
      city: "Demo City",
      state: "PA",
      cuisineType: "Mediterranean, bakery, dessert",
      googleListingUrl: "https://maps.google.com/?q=demo+mediterranean+table",
      websiteUrl: "https://demomedtable.example",
      menuOrderingUrl: "https://demomedtable.example/order",
      instagramUrl: "https://instagram.com/demomedtable",
      facebookUrl: "https://facebook.com/demomedtable",
      tiktokUrl: "https://tiktok.com/@demomedtable",
    },
  },
];
