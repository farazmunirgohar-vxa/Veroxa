/**
 * demoRestaurantSearch.ts
 *
 * Fixture-backed restaurant candidate search for the public /free-audit flow.
 *
 * Hard guardrails:
 *  - No network. No Google Places API. No scraping. No live business lookup.
 *  - This is sample/demo data only. The public UI must clearly say
 *    "Demo search only — live Google/Maps lookup is not connected yet."
 *  - All ids use the `sample-prospect-*` prefix so they are obviously fake
 *    and never collide with the demo client ids (`demo-a` … `demo-d`).
 */

export type RestaurantMatchConfidence = "high" | "medium" | "low";

export type RestaurantOnlineConsistencySignal =
  | "strong"
  | "inconsistent"
  | "underused"
  | "unknown";

export type RestaurantWalkInOpportunitySignal = "high" | "medium" | "low";

export interface RestaurantSearchCandidate {
  id: string;
  restaurantName: string;
  searchAliases?: string[];
  city: string;
  state: string;
  addressLine: string;
  cuisineType: string;
  googleRating?: number;
  reviewCount?: number;
  websiteUrl?: string;
  googleListingUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  menuOrderingUrl?: string;
  matchConfidence: RestaurantMatchConfidence;
  onlineConsistencySignal: RestaurantOnlineConsistencySignal;
  walkInOpportunitySignal: RestaurantWalkInOpportunitySignal;
  note: string;
}

export const demoRestaurantSearchCandidates: RestaurantSearchCandidate[] = [
  // ── San Antonio tacos (near-duplicate names) ─────────────────────────────
  {
    id: "sample-prospect-tacos-1",
    restaurantName: "El Sol Tacos & Grill",
    city: "San Antonio",
    state: "TX",
    addressLine: "1420 S Flores St",
    cuisineType: "Tacos / Tex-Mex",
    googleRating: 4.6,
    reviewCount: 412,
    googleListingUrl: "https://maps.google.com/?cid=sample-el-sol-tacos",
    websiteUrl: "https://elsoltacos.example.com",
    instagramUrl: "https://instagram.com/elsoltacos.sample",
    matchConfidence: "high",
    onlineConsistencySignal: "inconsistent",
    walkInOpportunitySignal: "high",
    note: "Strong reviews and steady walk-in foot traffic, but social posting has gone quiet for several weeks.",
  },
  {
    id: "sample-prospect-tacos-2",
    restaurantName: "El Sol Taqueria",
    city: "San Antonio",
    state: "TX",
    addressLine: "9802 Wurzbach Rd",
    cuisineType: "Tacos / Mexican",
    googleRating: 4.4,
    reviewCount: 188,
    googleListingUrl: "https://maps.google.com/?cid=sample-el-sol-taqueria",
    facebookUrl: "https://facebook.com/elsoltaqueria.sample",
    matchConfidence: "high",
    onlineConsistencySignal: "underused",
    walkInOpportunitySignal: "medium",
    note: "Similar name on the north side. Google listing is present but photos and posts have not been refreshed recently.",
  },
  {
    id: "sample-prospect-tacos-3",
    restaurantName: "Sol Brothers Tacos",
    city: "San Antonio",
    state: "TX",
    addressLine: "327 Broadway",
    cuisineType: "Tacos / Breakfast",
    googleRating: 4.7,
    reviewCount: 95,
    instagramUrl: "https://instagram.com/solbrothers.sample",
    facebookUrl: "https://facebook.com/solbrothers.sample",
    matchConfidence: "medium",
    onlineConsistencySignal: "strong",
    walkInOpportunitySignal: "medium",
    note: "Active on Instagram and Facebook but no Google Business Profile link — the search/Maps decision moment is missing.",
  },

  // ── Known warm targets / fuzzy-name regression fixtures ─────────────────
  {
    id: "warm-target-mamadali-kebab-house",
    restaurantName: "Mamadali Kebab House",
    searchAliases: [
      "Mamadali",
      "Mamdali",
      "Mamadali Kebab",
      "Mamadali Kebab House",
    ],
    city: "San Antonio",
    state: "TX",
    addressLine: "San Antonio, TX — address needs manual confirmation",
    cuisineType: "Halal / Uzbek / Kebab",
    matchConfidence: "medium",
    onlineConsistencySignal: "unknown",
    walkInOpportunitySignal: "high",
    note: "Known warm target. If the exact listing is hard to discover, treat it as weak discoverability and create a manual audit lead for Veroxa review.",
  },
  {
    id: "warm-target-selda-mediterranean",
    restaurantName: "Selda Mediterranean",
    searchAliases: [
      "Selda",
      "Selda Mediterranean",
      "Selda Restaurant",
      "Selda San Antonio",
    ],
    city: "San Antonio",
    state: "TX",
    addressLine: "San Antonio, TX — address needs manual confirmation",
    cuisineType: "Mediterranean / Turkish",
    matchConfidence: "medium",
    onlineConsistencySignal: "unknown",
    walkInOpportunitySignal: "high",
    note: "Known warm target. Missing or inconsistent preview discovery should become a Veroxa opportunity, not a dead end.",
  },

  // ── San Antonio kebab / halal (near-duplicate names) ─────────────────────
  {
    id: "sample-prospect-kebab-1",
    restaurantName: "Anatolia Kebab House",
    city: "San Antonio",
    state: "TX",
    addressLine: "5610 Bandera Rd",
    cuisineType: "Halal / Turkish / Kebab",
    googleRating: 4.5,
    reviewCount: 233,
    googleListingUrl: "https://maps.google.com/?cid=sample-anatolia",
    websiteUrl: "https://anatoliakebab.example.com",
    menuOrderingUrl: "https://anatoliakebab.example.com/order",
    matchConfidence: "high",
    onlineConsistencySignal: "inconsistent",
    walkInOpportunitySignal: "high",
    note: "Foundation is in place across Google, website, and menu. Weekly reminder rhythm is the open opportunity.",
  },
  {
    id: "sample-prospect-kebab-2",
    restaurantName: "Anatolia Grill",
    city: "San Antonio",
    state: "TX",
    addressLine: "12110 Nacogdoches Rd",
    cuisineType: "Halal / Mediterranean",
    googleRating: 4.3,
    reviewCount: 141,
    googleListingUrl: "https://maps.google.com/?cid=sample-anatolia-grill",
    matchConfidence: "high",
    onlineConsistencySignal: "underused",
    walkInOpportunitySignal: "medium",
    note: "Different location, similar name. Google listing exists but no social presence — reminder moments are not reaching customers.",
  },
  {
    id: "sample-prospect-kebab-3",
    restaurantName: "Shawarma Sultan",
    city: "San Antonio",
    state: "TX",
    addressLine: "8045 Callaghan Rd",
    cuisineType: "Halal / Shawarma / Mediterranean",
    googleRating: 4.8,
    reviewCount: 67,
    instagramUrl: "https://instagram.com/shawarmasultan.sample",
    matchConfidence: "medium",
    onlineConsistencySignal: "strong",
    walkInOpportunitySignal: "medium",
    note: "High Google rating but limited review count and no Google profile link in this sample — Maps walk-in readiness is the gap.",
  },

  // ── Bakery / cafe ────────────────────────────────────────────────────────
  {
    id: "sample-prospect-bakery-1",
    restaurantName: "Sunrise Bakery & Cafe",
    city: "Austin",
    state: "TX",
    addressLine: "2200 S Lamar Blvd",
    cuisineType: "Bakery / Cafe / Breakfast",
    googleRating: 4.6,
    reviewCount: 318,
    googleListingUrl: "https://maps.google.com/?cid=sample-sunrise-bakery",
    websiteUrl: "https://sunrisebakery.example.com",
    instagramUrl: "https://instagram.com/sunrisebakery.sample",
    facebookUrl: "https://facebook.com/sunrisebakery.sample",
    matchConfidence: "high",
    onlineConsistencySignal: "strong",
    walkInOpportunitySignal: "high",
    note: "Strong online foundation. Opportunity is around weekly visit triggers (specials, seasonal items) and craving content.",
  },

  // ── Donut shop ───────────────────────────────────────────────────────────
  {
    id: "sample-prospect-donut-1",
    restaurantName: "Glaze & Co. Donuts",
    city: "Houston",
    state: "TX",
    addressLine: "4101 Westheimer Rd",
    cuisineType: "Donuts / Coffee",
    googleRating: 4.4,
    reviewCount: 502,
    googleListingUrl: "https://maps.google.com/?cid=sample-glaze-donuts",
    matchConfidence: "high",
    onlineConsistencySignal: "underused",
    walkInOpportunitySignal: "high",
    note: "Very strong walk-in opportunity from Google search, but no website or social links — customer reminder rhythm is missing.",
  },

  // ── Edge: high Google rating, weak online consistency ───────────────────
  {
    id: "sample-prospect-edge-high-rating-weak-online",
    restaurantName: "Old Town Family Diner",
    city: "San Antonio",
    state: "TX",
    addressLine: "615 Pleasanton Rd",
    cuisineType: "Diner / American",
    googleRating: 4.9,
    reviewCount: 78,
    googleListingUrl: "https://maps.google.com/?cid=sample-old-town-diner",
    matchConfidence: "medium",
    onlineConsistencySignal: "inconsistent",
    walkInOpportunitySignal: "high",
    note: "Customers love the food — but online presence has not kept up with the in-person reputation.",
  },

  // ── Edge: social links but no Google link ───────────────────────────────
  {
    id: "sample-prospect-edge-social-no-google",
    restaurantName: "Patio Verde Cantina",
    city: "Dallas",
    state: "TX",
    addressLine: "1208 Greenville Ave",
    cuisineType: "Mexican / Cantina",
    googleRating: 4.5,
    reviewCount: 220,
    instagramUrl: "https://instagram.com/patioverde.sample",
    facebookUrl: "https://facebook.com/patioverde.sample",
    matchConfidence: "medium",
    onlineConsistencySignal: "strong",
    walkInOpportunitySignal: "medium",
    note: "Active social presence but no Google Business Profile link — the search/Maps decision moment is not captured.",
  },

  // ── Edge: Google link but no social links ───────────────────────────────
  {
    id: "sample-prospect-edge-google-no-social",
    restaurantName: "Bismillah Halal Kitchen",
    city: "San Antonio",
    state: "TX",
    addressLine: "11650 Bandera Rd",
    cuisineType: "Halal / Pakistani / Indian",
    googleRating: 4.6,
    reviewCount: 305,
    googleListingUrl: "https://maps.google.com/?cid=sample-bismillah",
    websiteUrl: "https://bismillahhalal.example.com",
    menuOrderingUrl: "https://bismillahhalal.example.com/menu",
    matchConfidence: "high",
    onlineConsistencySignal: "underused",
    walkInOpportunitySignal: "high",
    note: "Google and menu are in place but no social channels — customer reminder rhythm is the biggest opportunity.",
  },
];

export function normalizeRestaurantSearchText(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .trim()
    .toLowerCase();
}

function tokenize(s: string): string[] {
  return normalizeRestaurantSearchText(s)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
}

function editDistanceWithinOne(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let edits = 0;
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) i += 1;
    else if (b.length > a.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return true;
}

function tokenMatches(queryToken: string, candidateToken: string): boolean {
  if (candidateToken === queryToken) return true;
  if (
    candidateToken.includes(queryToken) ||
    queryToken.includes(candidateToken)
  ) {
    return true;
  }
  return (
    queryToken.length >= 5 &&
    candidateToken.length >= 5 &&
    editDistanceWithinOne(queryToken, candidateToken)
  );
}

function nameScore(
  query: string,
  candidate: RestaurantSearchCandidate,
): number {
  const q = normalizeRestaurantSearchText(query);
  if (!q) return 0;

  const searchableNames = [
    candidate.restaurantName,
    ...(candidate.searchAliases ?? []),
  ];
  if (
    searchableNames.some((name) => normalizeRestaurantSearchText(name) === q)
  ) {
    return 4;
  }
  if (
    searchableNames.some((name) =>
      normalizeRestaurantSearchText(name).includes(q),
    )
  ) {
    return 3;
  }

  const qTokens = tokenize(query);
  const searchableTokens = searchableNames.flatMap(tokenize);
  let hits = 0;
  for (const qToken of qTokens) {
    if (
      searchableTokens.some((candidateToken) =>
        tokenMatches(qToken, candidateToken),
      )
    ) {
      hits += 1;
    }
  }

  if (hits >= Math.max(1, qTokens.length)) return 2;
  return hits >= 1 ? 1 : 0;
}

export interface RestaurantSearchQuery {
  restaurantName: string;
  city: string;
  state: string;
  cuisineType?: string;
}

/**
 * Pure, in-memory partial match. No network. No external API.
 *
 * Rules:
 *  - Blank restaurant name → empty array.
 *  - City and state are optional; when present, exact (case-insensitive)
 *    city/state matches are prioritized and confidence is preserved.
 *  - When city/state are blank or do not match, name-only matches still
 *    return but confidence is reduced one step.
 */
export function searchRestaurantCandidates(
  query: RestaurantSearchQuery,
): RestaurantSearchCandidate[] {
  const name = query.restaurantName?.trim() ?? "";
  if (name.length === 0) return [];
  const city = normalizeRestaurantSearchText(query.city ?? "");
  const state = normalizeRestaurantSearchText(query.state ?? "");
  const cuisineTokens = new Set(tokenize(query.cuisineType ?? ""));

  type Ranked = { candidate: RestaurantSearchCandidate; score: number };
  const ranked: Ranked[] = [];

  for (const candidate of demoRestaurantSearchCandidates) {
    const nScore = nameScore(name, candidate);

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

    if (nScore === 0 && !((cityMatches || stateMatches) && cuisineMatches)) {
      continue;
    }

    let score = nScore * 10;
    if (cityMatches) score += 5;
    if (stateMatches) score += 2;
    if (cuisineMatches) score += 3;
    if (cityProvidedButMismatch) score -= 2;
    if (stateProvidedButMismatch) score -= 1;

    const reduceConfidence =
      (city.length === 0 && state.length === 0) ||
      nScore <= 1 ||
      cityProvidedButMismatch ||
      stateProvidedButMismatch;

    const adjusted: RestaurantSearchCandidate = reduceConfidence
      ? {
          ...candidate,
          matchConfidence:
            candidate.matchConfidence === "high"
              ? "medium"
              : candidate.matchConfidence === "medium"
                ? "low"
                : "low",
        }
      : candidate;

    ranked.push({ candidate: adjusted, score });
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked.map((r) => r.candidate);
}

export function getRestaurantCandidateById(
  id: string,
): RestaurantSearchCandidate | undefined {
  return demoRestaurantSearchCandidates.find((c) => c.id === id);
}
