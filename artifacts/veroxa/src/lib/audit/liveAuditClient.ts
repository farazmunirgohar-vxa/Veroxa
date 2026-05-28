/**
 * liveAuditClient.ts — Live Audit Lookup V1
 *
 * Talks to the server-side /api/audit/search-restaurants and
 * /api/audit/restaurant-details endpoints. The server reads
 * GOOGLE_PLACES_API_KEY only; this file never sees it.
 *
 * All functions return structured fallbacks — they never throw into the UI.
 */

export type LiveAuditMode = "live" | "not_configured" | "error";

export interface LiveRestaurantCandidate {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  googleMapsUri?: string;
  primaryType?: string;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  source: "google_places";
  matchConfidence: "high" | "medium" | "low";
}

export interface LiveSearchResponse {
  mode: LiveAuditMode;
  candidates: LiveRestaurantCandidate[];
  message?: string;
  /** Non-sensitive: ordered list of search strategies that were attempted. */
  strategiesTried?: string[];
  /** Total deduplicated candidates returned. */
  candidateCount?: number;
}

export interface LiveRestaurantProfile {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  websiteUrl?: string;
  googleMapsUrl?: string;
  businessStatus?: string;
  category?: string;
  types?: string[];
  sourceConfidence: "high" | "medium" | "low";
}

export interface LiveWebPresenceScan {
  websiteFound: boolean;
  menuLinkFound: boolean;
  orderLinkFound: boolean;
  reservationLinkFound: boolean;
  contactPathFound: boolean;
  instagramLinkFound: boolean;
  facebookLinkFound: boolean;
  tiktokLinkFound: boolean;
  yelpLinkFound: boolean;
  googleMapsLinkFound: boolean;
  pageTitle?: string;
  metaDescription?: string;
  discoveredSocialLinks: string[];
  discoveredMenuLinks: string[];
  scanConfidence: "high" | "medium" | "low" | "none";
  scanNotes: string[];
}

export interface LiveDetailsResponse {
  mode: LiveAuditMode;
  profile: LiveRestaurantProfile | null;
  webPresence: LiveWebPresenceScan | null;
  message?: string;
}

export async function searchLiveRestaurantCandidates(input: {
  restaurantName: string;
  city: string;
  state: string;
}): Promise<LiveSearchResponse> {
  try {
    const res = await fetch("/api/audit/search-restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      return {
        mode: "error",
        candidates: [],
        message: "Live lookup is temporarily unavailable.",
      };
    }
    const data = (await res.json()) as Partial<LiveSearchResponse>;
    return {
      mode:
        data.mode === "live" ||
        data.mode === "not_configured" ||
        data.mode === "error"
          ? data.mode
          : "error",
      candidates: Array.isArray(data.candidates) ? data.candidates : [],
      message: data.message,
      strategiesTried: Array.isArray(data.strategiesTried)
        ? data.strategiesTried
        : undefined,
      candidateCount:
        typeof data.candidateCount === "number"
          ? data.candidateCount
          : undefined,
    };
  } catch {
    return {
      mode: "error",
      candidates: [],
      message: "Could not reach the live lookup service.",
    };
  }
}

export async function getLiveRestaurantDetails(
  placeId: string,
): Promise<LiveDetailsResponse> {
  try {
    const res = await fetch("/api/audit/restaurant-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId }),
    });
    if (!res.ok) {
      return {
        mode: "error",
        profile: null,
        webPresence: null,
        message: "Live details are temporarily unavailable.",
      };
    }
    const data = (await res.json()) as Partial<LiveDetailsResponse>;
    return {
      mode:
        data.mode === "live" ||
        data.mode === "not_configured" ||
        data.mode === "error"
          ? data.mode
          : "error",
      profile: data.profile ?? null,
      webPresence: data.webPresence ?? null,
      message: data.message,
    };
  } catch {
    return {
      mode: "error",
      profile: null,
      webPresence: null,
      message: "Could not reach the live details service.",
    };
  }
}
