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
  /** Non-sensitive: which discovery strategy surfaced this candidate. */
  discoveredBy?: string;
}

export interface LiveRestaurantSearchResult {
  mode: GooglePlacesMode;
  candidates: LiveRestaurantCandidate[];
  message?: string;
  /** Ordered list of strategies that were attempted. */
  strategiesTried?: string[];
  /** Total candidates returned (after dedup). */
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

export interface LiveRestaurantDetailsResult {
  mode: GooglePlacesMode;
  profile: LiveRestaurantProfile | null;
  message?: string;
}

// ---------------------------------------------------------------------------
// Field masks
// ---------------------------------------------------------------------------

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

const AUTOCOMPLETE_FIELD_MASK = [
  "suggestions.placePrediction.placeId",
  "suggestions.placePrediction.text",
  "suggestions.placePrediction.structuredFormat",
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

// ---------------------------------------------------------------------------
// Food-related type allowlist
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Location bias
// ---------------------------------------------------------------------------

interface LatLng {
  latitude: number;
  longitude: number;
}

interface CityBias {
  center: LatLng;
  radiusMeters: number;
}

/**
 * Returns a location bias for well-known cities, extensible for future cities.
 * Returns null when the city is unknown — callers skip the bias in that case.
 */
function getCityBias(city: string, state: string): CityBias | null {
  const c = city.toLowerCase().replace(/[^a-z ]/g, "").trim();
  const s = state.toLowerCase().replace(/[^a-z]/g, "").trim();

  // Normalise state abbreviations
  const stateNorm =
    s === "tx" || s === "texas"
      ? "tx"
      : s === "ca" || s === "california"
        ? "ca"
        : s === "ny" || s === "new york"
          ? "ny"
          : s === "fl" || s === "florida"
            ? "fl"
            : s === "il" || s === "illinois"
              ? "il"
              : s;

  const key = `${c}|${stateNorm}`;

  const biases: Record<string, CityBias> = {
    "san antonio|tx": {
      center: { latitude: 29.4241, longitude: -98.4936 },
      radiusMeters: 50_000,
    },
    "austin|tx": {
      center: { latitude: 30.2672, longitude: -97.7431 },
      radiusMeters: 40_000,
    },
    "houston|tx": {
      center: { latitude: 29.7604, longitude: -95.3698 },
      radiusMeters: 60_000,
    },
    "dallas|tx": {
      center: { latitude: 32.7767, longitude: -96.797 },
      radiusMeters: 50_000,
    },
    "los angeles|ca": {
      center: { latitude: 34.0522, longitude: -118.2437 },
      radiusMeters: 55_000,
    },
    "chicago|il": {
      center: { latitude: 41.8781, longitude: -87.6298 },
      radiusMeters: 45_000,
    },
    "new york|ny": {
      center: { latitude: 40.7128, longitude: -74.006 },
      radiusMeters: 35_000,
    },
    "miami|fl": {
      center: { latitude: 25.7617, longitude: -80.1918 },
      radiusMeters: 40_000,
    },
  };

  return biases[key] ?? null;
}

function buildLocationBiasBody(bias: CityBias): object {
  return {
    locationBias: {
      circle: {
        center: {
          latitude: bias.center.latitude,
          longitude: bias.center.longitude,
        },
        radius: bias.radiusMeters,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  candidates: LiveRestaurantCandidate[],
  input: { restaurantName: string; city: string; state: string },
): LiveRestaurantCandidate[] {
  const cityLower = input.city.toLowerCase();
  const stateLower = input.state.toLowerCase();
  const stateAbbr = stateLower.length <= 2 ? stateLower : "";

  return [...candidates].sort((a, b) => {
    const aName = a.displayName.toLowerCase();
    const bName = b.displayName.toLowerCase();
    const aAddr = a.formattedAddress.toLowerCase();
    const bAddr = b.formattedAddress.toLowerCase();

    const confRank = { high: 0, medium: 1, low: 2 };
    if (confRank[a.matchConfidence] !== confRank[b.matchConfidence])
      return confRank[a.matchConfidence] - confRank[b.matchConfidence];

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
      (stateLower && aAddr.includes(stateLower)) ||
      (stateAbbr && aAddr.includes(`, ${stateAbbr}`))
        ? 0
        : 1;
    const bStateMatch =
      (stateLower && bAddr.includes(stateLower)) ||
      (stateAbbr && bAddr.includes(`, ${stateAbbr}`))
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

// ---------------------------------------------------------------------------
// Raw-place type shared by text search and detail normalisation
// ---------------------------------------------------------------------------

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

function buildCandidates(
  places: RawPlace[],
  restaurantName: string,
  discoveredBy: string,
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
        discoveredBy,
      };
    });
}

// ---------------------------------------------------------------------------
// Text Search
// ---------------------------------------------------------------------------

async function runTextSearch(
  apiKey: string,
  textQuery: string,
  extraBody: object,
  signal: AbortSignal,
): Promise<RawPlace[]> {
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
          textQuery,
          maxResultCount: 10,
          ...extraBody,
        }),
        signal,
      },
    );
    if (!res.ok) {
      logger.warn(
        { status: res.status, textQuery },
        "Google Places text search attempt failed",
      );
      return [];
    }
    const data = (await res.json()) as { places?: RawPlace[] };
    return Array.isArray(data.places) ? data.places : [];
  } catch (err) {
    logger.warn({ err, textQuery }, "Text search threw — continuing");
    return [];
  }
}

// ---------------------------------------------------------------------------
// Autocomplete (New)
// ---------------------------------------------------------------------------

interface AutocompletePrediction {
  placeId?: string;
  text?: { text?: string };
  structuredFormat?: {
    mainText?: { text?: string };
    secondaryText?: { text?: string };
  };
}

async function runAutocomplete(
  apiKey: string,
  input: string,
  extraBody: object,
  signal: AbortSignal,
): Promise<AutocompletePrediction[]> {
  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": AUTOCOMPLETE_FIELD_MASK,
        },
        body: JSON.stringify({
          input,
          includedRegionCodes: ["us"],
          ...extraBody,
        }),
        signal,
      },
    );
    if (!res.ok) {
      logger.warn(
        { status: res.status, input },
        "Google Places autocomplete attempt failed",
      );
      return [];
    }
    const data = (await res.json()) as {
      suggestions?: { placePrediction?: AutocompletePrediction }[];
    };
    if (!Array.isArray(data.suggestions)) return [];
    return data.suggestions
      .map((s) => s.placePrediction)
      .filter((p): p is AutocompletePrediction => p != null);
  } catch (err) {
    logger.warn({ err, input }, "Autocomplete threw — continuing");
    return [];
  }
}

function autocompletePredictionToCandidate(
  p: AutocompletePrediction,
  restaurantName: string,
): LiveRestaurantCandidate | null {
  const placeId = p.placeId;
  if (!placeId) return null;

  const mainText =
    p.structuredFormat?.mainText?.text ?? p.text?.text ?? "";
  const secondaryText = p.structuredFormat?.secondaryText?.text ?? "";

  if (!mainText) return null;

  return {
    placeId,
    displayName: mainText,
    formattedAddress: secondaryText,
    source: "google_places" as const,
    matchConfidence: deriveMatchConfidence(restaurantName, mainText),
    discoveredBy: "autocomplete",
  };
}

// ---------------------------------------------------------------------------
// Dedupe + merge
// ---------------------------------------------------------------------------

function dedupeAndMerge(
  primary: LiveRestaurantCandidate[],
  secondary: LiveRestaurantCandidate[],
): LiveRestaurantCandidate[] {
  const seen = new Map<string, LiveRestaurantCandidate>();
  for (const c of [...primary, ...secondary]) {
    const existing = seen.get(c.placeId);
    if (!existing) {
      seen.set(c.placeId, c);
    } else {
      // Keep the richer version: prefer the one with more fields set
      const existingScore =
        (existing.rating !== undefined ? 1 : 0) +
        (existing.googleMapsUri ? 1 : 0) +
        (existing.formattedAddress ? 1 : 0) +
        (existing.primaryType ? 1 : 0);
      const cScore =
        (c.rating !== undefined ? 1 : 0) +
        (c.googleMapsUri ? 1 : 0) +
        (c.formattedAddress ? 1 : 0) +
        (c.primaryType ? 1 : 0);
      if (cScore > existingScore) seen.set(c.placeId, c);
    }
  }
  return Array.from(seen.values());
}

// ---------------------------------------------------------------------------
// Main export: searchRealRestaurants
// ---------------------------------------------------------------------------

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
  const bias = getCityBias(city, state);
  const biasBody = bias ? buildLocationBiasBody(bias) : {};

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  const strategiesTried: string[] = [];
  const allCandidates: LiveRestaurantCandidate[] = [];

  try {
    // ---- Strategy 1: Autocomplete -----------------------------------------
    strategiesTried.push("autocomplete");
    const autocompleteInput = [name, city, state].filter(Boolean).join(" ");
    const acPredictions = await runAutocomplete(
      apiKey,
      autocompleteInput,
      biasBody,
      controller.signal,
    );
    const acCandidates = acPredictions
      .slice(0, 5)
      .map((p) => autocompletePredictionToCandidate(p, name))
      .filter((c): c is LiveRestaurantCandidate => c !== null);
    allCandidates.push(...acCandidates);

    // ---- Text search strategies -------------------------------------------
    const textStrategies: { query: string; label: string; extra?: object }[] =
      [
        {
          query: [name, locationSuffix].filter(Boolean).join(" "),
          label: "broad_name_city_state",
          extra: biasBody,
        },
        {
          query: [name, "restaurant", locationSuffix].filter(Boolean).join(" "),
          label: "name_restaurant_city_state",
          extra: biasBody,
        },
        {
          query: [name, "food", locationSuffix].filter(Boolean).join(" "),
          label: "name_food_city_state",
          extra: biasBody,
        },
        {
          query: city
            ? `${name} near ${city}${state ? ", " + state : ""}`
            : `${name} near ${state}`,
          label: "name_near_city_state",
        },
        // name only + location bias (helps when query noise hurts matching)
        {
          query: name,
          label: "name_location_biased",
          extra: bias ? biasBody : { locationBias: undefined },
        },
      ].filter((s) => bias || s.label !== "name_location_biased" || !bias); // only include location biased if bias available

    for (const strategy of textStrategies) {
      // Stop early if we already have plenty of high-confidence candidates
      if (allCandidates.length >= 12) break;

      strategiesTried.push(strategy.label);
      const extra = strategy.extra ?? {};
      const rawPlaces = await runTextSearch(
        apiKey,
        strategy.query,
        extra,
        controller.signal,
      );

      if (rawPlaces.length > 0) {
        const candidates = buildCandidates(rawPlaces, name, strategy.label);
        allCandidates.push(...candidates);
      }
    }

    clearTimeout(timeout);

    // ---- Dedupe, rank, cap ------------------------------------------------
    const deduped = dedupeAndMerge(allCandidates, []);
    const ranked = rankCandidates(deduped, input);
    const final = ranked.slice(0, 12);

    if (final.length === 0) {
      return {
        mode: "live",
        candidates: [],
        message: "No matches found for this restaurant.",
        strategiesTried,
        candidateCount: 0,
      };
    }

    return {
      mode: "live",
      candidates: final,
      strategiesTried,
      candidateCount: final.length,
    };
  } catch (err) {
    clearTimeout(timeout);
    logger.warn({ err }, "Google Places search threw");
    return {
      mode: "error",
      candidates: [],
      message: "Live lookup is temporarily unavailable.",
      strategiesTried,
    };
  }
}

// ---------------------------------------------------------------------------
// Place Details
// ---------------------------------------------------------------------------

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
