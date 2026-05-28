/**
 * demoAuditExamples.ts — M026A
 *
 * Fictional-only demo inputs. Never use real restaurant or prospect names.
 */

import type { RestaurantAuditInput } from "@/lib/audit/auditTypes";

export const demoAuditExamples: { id: string; label: string; input: RestaurantAuditInput }[] = [
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
      instagramUrl: "https://instagram.com/demogrillhouse",
      facebookUrl: "",
      tiktokUrl: "",
      currentGoal: "more dinner traffic and catering inquiries",
      biggestProblem: "social posts are inconsistent week to week",
      notes: "Strong lamb platter and family platter sales on weekends.",
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
      googleListingUrl: "",
      websiteUrl: "",
      instagramUrl: "https://instagram.com/demomomo",
      facebookUrl: "",
      tiktokUrl: "https://tiktok.com/@demomomo",
      currentGoal: "better Google visibility and lunch traffic",
      biggestProblem: "people cannot find us on Google",
      notes: "Want to look professional online before pushing ads.",
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
      instagramUrl: "https://instagram.com/demomedtable",
      facebookUrl: "https://facebook.com/demomedtable",
      tiktokUrl: "https://tiktok.com/@demomedtable",
      currentGoal: "consistent social reminders and review trust",
      biggestProblem: "reviews are not being responded to",
      notes: "Foundation is decent, want to add ads later in the year.",
    },
  },
];
