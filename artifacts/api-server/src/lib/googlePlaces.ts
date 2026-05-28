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
  searchStrategy?: string;
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

const FOOD_RELATED_TYPES = new Set([
  "restaurant",
  "cafe",
  "bakery",
  "bar",
  "meal_takeaway",
  "meal_delivery",
  "food",
  "mediterranean_restaurant",
  "mexican_restaurant",
  "turkish_restaurant",
  "fast_food_restaurant",
  "pizza_restaurant",
  "sandwich_shop",
  "american_restaurant",
  "chinese_restaurant",
  "french_restaurant",
  "greek_restaurant",
  "indian_restaurant",
  "italian_restaurant",
  "japanese_restaurant",
  "korean_restaurant",
  "seafood_restaurant",
  "steak_house",
  "sushi_restaurant",
  "thai_restaurant",
  "vietnamese_restaurant",
  "barbecue_restaurant",
  "breakfast_restaurant",
  "brunch_restaurant",
  "hamburger_restaurant",
  "ice_cream_shop",
  "ramen_restaurant",
  "tapas_bar",
  "wine_bar",
  "pub",
  "food_court",
  "diner",
]);

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

function isFoodRelated(p: {
  primaryType?: string;
  types?: string[];
}): boolean {
  if (p.primaryType && FOOD_RELATED_TYPES.has(p.primaryType)) return true;
  if (Array.isArray(p.types)) {
    return p.types.some((t) => FOOD_RELATED_TYPES.has(t));
  }
  return false;
}

function rankCandidates(
  places: {
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    googleMapsUri?: string;
    primaryType?: string;
    types?: string[];
    rating?: number;
    userRatingCount?: number;
  }[],
  input: { restaurantName: string; city: string; state: string },
): typeof places {
  const cityLower = input.city.toLowerCase();
  const stateLower = input.state.toLowerCase();

  return [...places].sort((a, b) => {
    const aName = (a.displayName?.text ?? "").toLowerCase();
    const bName = (b.displayName?.text ?? "").toLowerCase();
    const aAddr = (a.formattedAddress ?? "").toLowerCase();
    const bAddr = (b.formattedAddress ?? "").toLowerCase();

    const aConf = deriveMatchConfidence(input.restaurantName, aName);
    const bConf = deriveMatchConfidence(input.restaurantName, bName);
    const confRank = { high: 0, medium: 1, low: 2 };
    if (confRank[aConf] !== confRank[bConf])
      return confRank[aConf] - confRank[bConf];

    const aCityMatch =
      cityLower && (aAddr.includes(cityLower) || aName.includes(cityLower))
        ? 0
        : 1;
    const bCityMatch =
      cityLower && (bAddr.includes(cityLower) || bName.includes(cityLower))
        ? 0
        : 1;
    if (aCityMatch !== bCityMatch) return aCityMatch - bCityMatch;

    const aStateMatch =
      stateLower && (aAddr.includes(stateLower) || aAddr.includes(", tx"))
        ? 0
        : 1;
    const bStateMatch =
      stateLower && (bAddr.includes(stateLower) || bAddr.includes(", tx"))
        ? 0
        : 1;
    if (aStateMatch !== bStateMatch) return aStateMatch - bStateMatch;

    const aFood = isFoodRelated(a) ? 0 : 1;
    const bFood = isFoodRelated(b) ? 0 : 1;
    if (aFood !== bFood) return aFood - bFood;

    const aHasRating =
      typeof a.rating === "number" && typeof a.userRatingCount === "number"
        ? 0
        : 1;
    const bHasRating =
      typeof b.rating === "number" && typeof b.userRatingCount === "number"
        ? 0
        : 1;
    return aHasRating - bHasRating;
  });
}

type RawPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  googleMapsUri?: string;
  primaryType?: string;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
};

async function runTextSearch(
  apiKey: string,
  textQuery: string,
  signal: AbortSignal,
): Promise<RawPlace[]> {
  const res = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
      },
      body: JSON.stringify({ textQuery, maxResultCount: 10 }),
      signal,
    },
  );
  if (!res.ok) {
    logger.warn(
      { status: res.status, textQuery },
      "Google Places search attempt failed",
    );
    return [];
  }
  const data = (await res.json()) as { places?: RawPlace[] };
  return Array.isArray(data.places) ? data.places : [];
}

function buildCandidates(
  places: RawPlace[],
  restaurantName: string,
): LiveRestaurantCandidate[] {
  return places
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
        source: "google_places" as const,
        matchConfidence: deriveMatchConfidence(restaurantName, displayName),
      };
    });
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

  const name = (input.restaurantName ?? "").trim();
  const city = (input.city ?? "").trim();
  const state = (input.state ?? "").trim();

  if (!name) {
    return {
      mode: "error",
      candidates: [],
      message: "Restaurant name is required.",
    };
  }

  const locationSuffix = [city, state].filter(Boolean).join(" ");

  const strategies: { query: string; label: string }[] = [
    {
      query: [name, locationSuffix].filter(Boolean).join(" "),
      label: "broad_name_city_state",
    },
    {
      query: [name, "restaurant", locationSuffix].filter(Boolean).join(" "),
      label: "name_restaurant_city_state",
    },
    {
      query: [name, "food", locationSuffix].filter(Boolean).join(" "),
      label: "name_food_city_state",
    },
    {
      query: city
        ? `${name} near ${city}${state ? ", " + state : ""}`
        : `${name} near ${state}`,
      label: "name_near_city_state",
    },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    for (const strategy of strategies) {
      let rawPlaces: RawPlace[] = [];
      try {
        rawPlaces = await runTextSearch(apiKey, strategy.query, controller.signal);
      } catch (innerErr) {
        logger.warn(
          { innerErr, label: strategy.label },
          "Search strategy threw — continuing",
        );
        continue;
      }

      if (rawPlaces.length === 0) continue;

      const ranked = rankCandidates(rawPlaces, input);
      const candidates = buildCandidates(ranked, name);

      if (candidates.length > 0) {
        clearTimeout(timeout);
        return {
          mode: "live",
          candidates,
          searchStrategy: strategy.label,
        };
      }
    }

    clearTimeout(timeout);
    return {
      mode: "live",
      candidates: [],
      message: "No matches found for this restaurant.",
      searchStrategy: "exhausted",
    };
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
    if (ratingPresent && reviewsPresent && p.websiteUri)
      sourceConfidence = "high";
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
