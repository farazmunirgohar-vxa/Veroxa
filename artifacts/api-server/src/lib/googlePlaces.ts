import { logger } from "./logger";

export type GooglePlacesMode = "live" | "not_configured" | "error";

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

export interface LiveRestaurantSearchResult {
  mode: GooglePlacesMode;
  candidates: LiveRestaurantCandidate[];
  message?: string;
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

export interface LiveRestaurantDetailsResult {
  mode: GooglePlacesMode;
  profile: LiveRestaurantProfile | null;
  message?: string;
}

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.googleMapsUri",
  "places.primaryType",
  "places.types",
  "places.rating",
  "places.userRatingCount",
].join(",");

const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "internationalPhoneNumber",
  "nationalPhoneNumber",
  "rating",
  "userRatingCount",
  "websiteUri",
  "googleMapsUri",
  "businessStatus",
  "primaryType",
  "types",
].join(",");

function getApiKey(): string | null {
  const key = process.env["GOOGLE_PLACES_API_KEY"];
  if (!key || key.trim() === "") return null;
  return key;
}

function deriveMatchConfidence(
  query: string,
  candidateName: string,
): "high" | "medium" | "low" {
  const q = query.toLowerCase().trim();
  const n = candidateName.toLowerCase().trim();
  if (n === q || n.includes(q) || q.includes(n)) return "high";
  const qTokens = q.split(/\s+/).filter((t) => t.length > 2);
  if (qTokens.length === 0) return "medium";
  const overlap = qTokens.filter((t) => n.includes(t)).length;
  if (overlap / qTokens.length >= 0.6) return "medium";
  return "low";
}

export async function searchRealRestaurants(input: {
  restaurantName: string;
  city: string;
  state: string;
}): Promise<LiveRestaurantSearchResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      mode: "not_configured",
      candidates: [],
      message: "Live restaurant lookup is not configured.",
    };
  }

  const query = [input.restaurantName, input.city, input.state]
    .map((v) => (v ?? "").trim())
    .filter(Boolean)
    .join(" ");
  if (!query) {
    return {
      mode: "error",
      candidates: [],
      message: "Restaurant name is required.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": SEARCH_FIELD_MASK,
        },
        body: JSON.stringify({
          textQuery: query,
          includedType: "restaurant",
          maxResultCount: 10,
        }),
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);
    if (!res.ok) {
      logger.warn(
        { status: res.status },
        "Google Places search request failed",
      );
      return {
        mode: "error",
        candidates: [],
        message: "Live lookup is temporarily unavailable.",
      };
    }
    const data = (await res.json()) as {
      places?: {
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        googleMapsUri?: string;
        primaryType?: string;
        types?: string[];
        rating?: number;
        userRatingCount?: number;
      }[];
    };
    const places = Array.isArray(data.places) ? data.places : [];
    const candidates: LiveRestaurantCandidate[] = places
      .filter((p) => p.id && p.displayName?.text)
      .map((p) => {
        const displayName = p.displayName?.text ?? "";
        return {
          placeId: p.id!,
          displayName,
          formattedAddress: p.formattedAddress ?? "",
          googleMapsUri: p.googleMapsUri,
          primaryType: p.primaryType,
          types: p.types,
          rating: typeof p.rating === "number" ? p.rating : undefined,
          userRatingCount:
            typeof p.userRatingCount === "number"
              ? p.userRatingCount
              : undefined,
          source: "google_places",
          matchConfidence: deriveMatchConfidence(
            input.restaurantName,
            displayName,
          ),
        };
      });
    return { mode: "live", candidates };
  } catch (err) {
    clearTimeout(timeout);
    logger.warn({ err }, "Google Places search threw");
    return {
      mode: "error",
      candidates: [],
      message: "Live lookup is temporarily unavailable.",
    };
  }
}

export async function getRealRestaurantDetails(
  placeId: string,
): Promise<LiveRestaurantDetailsResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      mode: "not_configured",
      profile: null,
      message: "Live restaurant details are not configured.",
    };
  }
  const id = (placeId ?? "").trim();
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
    return {
      mode: "error",
      profile: null,
      message: "Invalid place id.",
    };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": DETAILS_FIELD_MASK,
        },
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);
    if (!res.ok) {
      logger.warn(
        { status: res.status },
        "Google Places details request failed",
      );
      return {
        mode: "error",
        profile: null,
        message: "Live details are temporarily unavailable.",
      };
    }
    const p = (await res.json()) as {
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      internationalPhoneNumber?: string;
      nationalPhoneNumber?: string;
      rating?: number;
      userRatingCount?: number;
      websiteUri?: string;
      googleMapsUri?: string;
      businessStatus?: string;
      primaryType?: string;
      types?: string[];
    };
    if (!p.id || !p.displayName?.text) {
      return {
        mode: "error",
        profile: null,
        message: "Live details were incomplete.",
      };
    }
    const ratingPresent = typeof p.rating === "number";
    const reviewsPresent = typeof p.userRatingCount === "number";
    let sourceConfidence: "high" | "medium" | "low" = "low";
    if (ratingPresent && reviewsPresent && p.websiteUri) sourceConfidence = "high";
    else if (ratingPresent || p.websiteUri) sourceConfidence = "medium";
    return {
      mode: "live",
      profile: {
        placeId: p.id,
        name: p.displayName.text,
        address: p.formattedAddress ?? "",
        phone: p.internationalPhoneNumber ?? p.nationalPhoneNumber,
        rating: ratingPresent ? p.rating : undefined,
        reviewCount: reviewsPresent ? p.userRatingCount : undefined,
        websiteUrl: p.websiteUri,
        googleMapsUrl: p.googleMapsUri,
        businessStatus: p.businessStatus,
        category: p.primaryType,
        types: p.types,
        sourceConfidence,
      },
    };
  } catch (err) {
    clearTimeout(timeout);
    logger.warn({ err }, "Google Places details threw");
    return {
      mode: "error",
      profile: null,
      message: "Live details are temporarily unavailable.",
    };
  }
}
