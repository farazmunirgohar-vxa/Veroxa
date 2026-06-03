/**
 * restaurantNameMatching.ts — deterministic audit search helper.
 *
 * Local/demo only: no network, no scraping, no Google Places API, no paid API,
 * and no production writes. Hard-to-find restaurants become manual audit leads
 * so Free Audit and Team Audit Leads never dead-end.
 */

import {
  demoRestaurantSearchCandidates,
  type RestaurantMatchConfidence,
  type RestaurantSearchCandidate,
  type RestaurantSearchQuery,
} from "@/data/demo/demoRestaurantSearch";

export type { RestaurantSearchCandidate } from "@/data/demo/demoRestaurantSearch";

const MANUAL_FALLBACK_NOTE =
  "Weak discoverability / name-indexing issue — potential Veroxa opportunity.";

const BUSINESS_SUFFIXES = new Set([
  "restaurant",
  "restaurants",
  "kitchen",
  "house",
  "grill",
  "cafe",
  "café",
  "mediterranean",
  "kebab",
  "kabob",
  "kebob",
  "san",
  "antonio",
]);

export function normalizeRestaurantSearchText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function tokenize(input: string): string[] {
  return normalizeRestaurantSearchText(input)
    .split(" ")
    .filter((token) => token.length >= 2);
}

export function getRestaurantSearchVariants(input: string): string[] {
  const normalized = normalizeRestaurantSearchText(input);
  if (!normalized) return [];

  const tokens = tokenize(normalized);
  const withoutSuffixes = tokens
    .filter((token) => !BUSINESS_SUFFIXES.has(token))
    .join(" ");
  const compact = normalized.replace(/\s+/g, "");
  const kebabVariants = [
    normalized.replace(/\bkebab\b/g, "kabob"),
    normalized.replace(/\bkebab\b/g, "kebob"),
    normalized.replace(/\bkabob\b/g, "kebab"),
    normalized.replace(/\bkebob\b/g, "kebab"),
  ];

  return Array.from(
    new Set(
      [normalized, withoutSuffixes, compact, ...kebabVariants]
        .map((variant) => normalizeRestaurantSearchText(variant))
        .filter(Boolean),
    ),
  );
}

export function editDistanceWithinOne(a: string, b: string): boolean {
  const left = normalizeRestaurantSearchText(a).replace(/\s+/g, "");
  const right = normalizeRestaurantSearchText(b).replace(/\s+/g, "");
  if (left === right) return true;
  if (Math.abs(left.length - right.length) > 1) return false;

  let edits = 0;
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (left.length > right.length) i += 1;
    else if (right.length > left.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return true;
}

function candidateNames(candidate: RestaurantSearchCandidate): string[] {
  return [candidate.restaurantName, ...(candidate.searchAliases ?? [])];
}

function tokenMatches(queryToken: string, candidateToken: string): boolean {
  if (queryToken === candidateToken) return true;
  if (queryToken.includes(candidateToken) || candidateToken.includes(queryToken)) {
    return true;
  }
  return (
    queryToken.length >= 5 &&
    candidateToken.length >= 5 &&
    editDistanceWithinOne(queryToken, candidateToken)
  );
}

export function isLikelySameRestaurantName(a: string, b: string): boolean {
  const leftVariants = getRestaurantSearchVariants(a);
  const rightVariants = getRestaurantSearchVariants(b);
  if (leftVariants.length === 0 || rightVariants.length === 0) return false;

  if (
    leftVariants.some((left) =>
      rightVariants.some(
        (right) => left === right || left.includes(right) || right.includes(left),
      ),
    )
  ) {
    return true;
  }

  const leftTokens = tokenize(a).filter((token) => !BUSINESS_SUFFIXES.has(token));
  const rightTokens = tokenize(b).filter((token) => !BUSINESS_SUFFIXES.has(token));
  if (leftTokens.length === 0 || rightTokens.length === 0) return false;

  const hits = leftTokens.filter((leftToken) =>
    rightTokens.some((rightToken) => tokenMatches(leftToken, rightToken)),
  ).length;
  return hits >= Math.min(leftTokens.length, rightTokens.length);
}

function nameScore(query: string, candidate: RestaurantSearchCandidate): number {
  const queryVariants = getRestaurantSearchVariants(query);
  if (queryVariants.length === 0) return 0;

  const names = candidateNames(candidate);
  const nameVariants = names.flatMap(getRestaurantSearchVariants);
  if (
    queryVariants.some((queryVariant) =>
      nameVariants.some((nameVariant) => queryVariant === nameVariant),
    )
  ) {
    return 5;
  }
  if (
    queryVariants.some((queryVariant) =>
      nameVariants.some(
        (nameVariant) =>
          nameVariant.includes(queryVariant) || queryVariant.includes(nameVariant),
      ),
    )
  ) {
    return 4;
  }
  if (names.some((name) => isLikelySameRestaurantName(query, name))) return 3;

  const qTokens = tokenize(query);
  const cTokens = names.flatMap(tokenize);
  const hits = qTokens.filter((qToken) =>
    cTokens.some((cToken) => tokenMatches(qToken, cToken)),
  ).length;
  if (hits >= Math.max(1, qTokens.length)) return 2;
  return hits >= 1 ? 1 : 0;
}

function reduceConfidence(confidence: RestaurantMatchConfidence): RestaurantMatchConfidence {
  if (confidence === "high") return "medium";
  return "low";
}

function queryFromInput(input: string | Partial<RestaurantSearchQuery>): RestaurantSearchQuery {
  if (typeof input === "string") {
    return { restaurantName: input, city: "", state: "", cuisineType: "" };
  }
  return {
    restaurantName: input.restaurantName ?? "",
    city: input.city ?? "",
    state: input.state ?? "",
    cuisineType: input.cuisineType ?? "",
  };
}

export function searchRestaurantCandidates(
  input: string | Partial<RestaurantSearchQuery>,
): RestaurantSearchCandidate[] {
  const query = queryFromInput(input);
  const restaurantName = query.restaurantName.trim();
  if (!restaurantName) return [];

  const city = normalizeRestaurantSearchText(query.city ?? "");
  const state = normalizeRestaurantSearchText(query.state ?? "");
  const cuisineTokens = new Set(tokenize(query.cuisineType ?? ""));

  const ranked = demoRestaurantSearchCandidates.flatMap((candidate) => {
    const nScore = nameScore(restaurantName, candidate);
    const candidateCity = normalizeRestaurantSearchText(candidate.city);
    const candidateState = normalizeRestaurantSearchText(candidate.state);
    const cityMatches = city.length > 0 && candidateCity === city;
    const stateMatches = state.length > 0 && candidateState === state;
    const cityProvidedButMismatch = city.length > 0 && !cityMatches;
    const stateProvidedButMismatch = state.length > 0 && !stateMatches;
    const candidateCuisineTokens = new Set(tokenize(candidate.cuisineType));
    const cuisineMatches =
      cuisineTokens.size > 0 &&
      [...cuisineTokens].some((token) => candidateCuisineTokens.has(token));

    if (nScore === 0 && !((cityMatches || stateMatches) && cuisineMatches)) return [];

    let score = nScore * 10;
    if (cityMatches) score += 5;
    if (stateMatches) score += 2;
    if (cuisineMatches) score += 3;
    if (cityProvidedButMismatch) score -= 2;
    if (stateProvidedButMismatch) score -= 1;

    const source = nScore >= 4 ? "fixture" : "fuzzy match";
    const adjusted: RestaurantSearchCandidate = {
      ...candidate,
      matchSource: source,
      matchConfidence:
        cityProvidedButMismatch || stateProvidedButMismatch || nScore <= 2
          ? reduceConfidence(candidate.matchConfidence)
          : candidate.matchConfidence,
    };
    return [{ candidate: adjusted, score }];
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked.map((entry) => entry.candidate);
}

export function buildManualAuditLeadFallback(input: {
  restaurantName: string;
  city?: string;
  state?: string;
  cuisineType?: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  notes?: string;
}): RestaurantSearchCandidate {
  const restaurantName = input.restaurantName.trim() || "Manual restaurant lead";
  const city = input.city?.trim() || "";
  const state = input.state?.trim() || "";
  const addressLine =
    city || state
      ? `${[city, state].filter(Boolean).join(", ")} — address needs manual confirmation`
      : "Address needs manual confirmation";
  const slug = normalizeRestaurantSearchText(restaurantName).replace(/\s+/g, "-") || "restaurant";
  const notes = [MANUAL_FALLBACK_NOTE, input.notes?.trim()].filter(Boolean).join(" ");

  return {
    id: `manual-audit-${slug}`,
    restaurantName,
    searchAliases: getRestaurantSearchVariants(restaurantName),
    city,
    state,
    addressLine,
    cuisineType: input.cuisineType?.trim() || "Restaurant / Food — category not verified",
    googleListingUrl: input.googleMapsUrl,
    websiteUrl: input.websiteUrl,
    instagramUrl: input.instagramUrl,
    facebookUrl: input.facebookUrl,
    tiktokUrl: input.tiktokUrl,
    matchConfidence: "low",
    matchSource: "manual",
    onlineConsistencySignal: "unknown",
    walkInOpportunitySignal: "medium",
    note: notes,
  };
}
