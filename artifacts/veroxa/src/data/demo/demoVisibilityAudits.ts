/**
 * Demo Visibility Audit inputs (fixtures only).
 *
 * These are the sample online-presence snapshots the rule engine audits. They
 * are NOT live data: nothing here was crawled, fetched, or read from Google /
 * Meta / a website. They are hand-authored to be realistic and to spread
 * findings across restaurants so the engine and queue stay readable (not noisy).
 *
 * Spread by design (kept distinct from the hand-written prepared-action
 * fixtures to avoid duplicate cards in the queue):
 *  - demo-a (Demo Grill House)        → healthy, essentially no findings.
 *  - demo-b (Demo Taco Bar)           → reviews + Google freshness.
 *  - demo-c (Demo Mediterranean Grill)→ catering + holiday hours (client confirm).
 *  - demo-d (Demo Cafe)               → worst: Google, reviews, links, freshness.
 */

import type { VisibilityAuditInput } from "@/domain/visibilityAudit";

export const demoVisibilityAuditInputs: VisibilityAuditInput[] = [
  // demo-a — Demo Grill House: strong presence, nothing pressing.
  {
    clientId: "demo-a",
    cateringOffered: false,
    google: {
      profileCompleteness: 94,
      hasRecentPhotos: true,
      lastGooglePostDaysAgo: 3,
      unansweredReviews: 0,
      reviewCount: 168,
      averageRating: 4.7,
      menuLinkWorking: true,
      orderingLinkWorking: true,
      hoursConfirmed: true,
      holidayHoursMissing: false,
    },
    website: {
      hasWebsite: true,
      menuPageExists: true,
      cateringPageExists: false,
      orderingLinkVisible: true,
      brokenLinksCount: 0,
      localKeywordsPresent: true,
      bestSellersVisible: true,
      mobileFriendlyConcern: false,
    },
    social: {
      instagramBioClear: true,
      facebookLinkCorrect: true,
      recentSocialPostDaysAgo: 2,
      contentSupplyStatus: "healthy",
    },
    seo: {
      primaryFoodKeywords: ["mixed grill", "shawarma", "levantine"],
      localAreaKeywords: ["downtown", "family dinner"],
      cateringVisible: false,
      bestSellerClarity: "clear",
      reviewKeywordOpportunities: [],
    },
  },

  // demo-b — Demo Taco Bar: needs attention on reviews + Google freshness.
  {
    clientId: "demo-b",
    cateringOffered: false,
    google: {
      profileCompleteness: 82,
      hasRecentPhotos: true,
      lastGooglePostDaysAgo: 16,
      unansweredReviews: 4,
      reviewCount: 61,
      averageRating: 4.4,
      menuLinkWorking: true,
      orderingLinkWorking: true,
      hoursConfirmed: true,
      holidayHoursMissing: false,
    },
    website: {
      hasWebsite: true,
      menuPageExists: true,
      cateringPageExists: false,
      orderingLinkVisible: true,
      brokenLinksCount: 0,
      localKeywordsPresent: false,
      bestSellersVisible: true,
      mobileFriendlyConcern: false,
    },
    social: {
      instagramBioClear: true,
      facebookLinkCorrect: true,
      recentSocialPostDaysAgo: 4,
      contentSupplyStatus: "healthy",
    },
    seo: {
      primaryFoodKeywords: ["tacos", "birria", "street food"],
      localAreaKeywords: ["taco tuesday"],
      cateringVisible: false,
      bestSellerClarity: "clear",
      reviewKeywordOpportunities: [],
    },
  },

  // demo-c — Demo Mediterranean Grill: premium, catering + holiday-hours gaps
  // that need the restaurant's confirmation (sensitive business truth).
  {
    clientId: "demo-c",
    cateringOffered: true,
    google: {
      profileCompleteness: 88,
      hasRecentPhotos: true,
      lastGooglePostDaysAgo: 5,
      unansweredReviews: 0,
      reviewCount: 132,
      averageRating: 4.8,
      menuLinkWorking: true,
      orderingLinkWorking: true,
      hoursConfirmed: true,
      holidayHoursMissing: true,
    },
    website: {
      hasWebsite: true,
      menuPageExists: true,
      cateringPageExists: false,
      orderingLinkVisible: true,
      brokenLinksCount: 0,
      localKeywordsPresent: true,
      bestSellersVisible: true,
      mobileFriendlyConcern: false,
    },
    social: {
      instagramBioClear: true,
      facebookLinkCorrect: true,
      recentSocialPostDaysAgo: 3,
      contentSupplyStatus: "healthy",
    },
    seo: {
      primaryFoodKeywords: ["mediterranean", "grilled lamb", "octopus"],
      localAreaKeywords: ["fine dining", "olive oil tasting"],
      cateringVisible: false,
      bestSellerClarity: "clear",
      reviewKeywordOpportunities: [],
    },
  },

  // demo-d — Demo Cafe: at risk. Google profile, reviews, links, and content
  // freshness all need work.
  {
    clientId: "demo-d",
    cateringOffered: false,
    google: {
      profileCompleteness: 58,
      hasRecentPhotos: false,
      lastGooglePostDaysAgo: 24,
      unansweredReviews: 5,
      reviewCount: 17,
      averageRating: 4.2,
      menuLinkWorking: false,
      orderingLinkWorking: true,
      hoursConfirmed: true,
      holidayHoursMissing: false,
    },
    website: {
      hasWebsite: true,
      menuPageExists: true,
      cateringPageExists: false,
      orderingLinkVisible: false,
      brokenLinksCount: 2,
      localKeywordsPresent: false,
      bestSellersVisible: false,
      mobileFriendlyConcern: true,
    },
    social: {
      instagramBioClear: false,
      facebookLinkCorrect: true,
      recentSocialPostDaysAgo: 12,
      contentSupplyStatus: "low",
    },
    seo: {
      primaryFoodKeywords: ["coffee", "pastries"],
      localAreaKeywords: [],
      cateringVisible: false,
      bestSellerClarity: "weak",
      reviewKeywordOpportunities: ["breakfast", "cardamom latte"],
    },
  },
];
