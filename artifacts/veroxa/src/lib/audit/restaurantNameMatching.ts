/**
 * restaurantNameMatching.ts — canonical deterministic audit matching engine.
 *
 * Pre-live/manual only: no network, no scraping, no Google Places API, no paid
 * API, no production writes. Hard-to-find restaurants become manual audit leads
 * so Free Audit and Team Audit Leads never dead-end.
 */

import {
  demoRestaurantSearchCandidates,
  type RestaurantMatchConfidence,
  type RestaurantSearchCandidate,
  type RestaurantSearchQuery,
} from "../../data/demo/demoRestaurantSearch";

export type { RestaurantSearchCandidate, RestaurantSearchQuery } from "../../data/demo/demoRestaurantSearch";

export type RestaurantMatchState =
  | "exact_match"
  | "likely_match"
  | "multiple_possible_matches"
  | "manual_review_needed"
  | "no_match";

export type RestaurantMatchReason =
  | "name matched"
  | "alias matched"
  | "city/state matched"
  | "address matched"
  | "phone matched"
  | "domain matched"
  | "platform link matched"
  | "weak/fuzzy match only";

export interface RestaurantCandidateMatch {
  candidate: RestaurantSearchCandidate;
  score: number;
  state: RestaurantMatchState;
  reasons: RestaurantMatchReason[];
}

export interface RestaurantMatchingResult {
  state: RestaurantMatchState;
  matches: RestaurantCandidateMatch[];
  topMatch?: RestaurantCandidateMatch;
}

const MANUAL_FALLBACK_NOTE =
  "Weak discoverability / name-indexing issue — potential Veroxa opportunity.";

// Keep meaningful restaurant words. Do not strip "house" because Momo House is
// a locked regression. City/location tokens are scored separately instead.
const GENERIC_SUFFIXES = new Set(["restaurant", "restaurants", "llc", "inc", "co", "company"]);

export function normalizeRestaurantSearchText(input: string | undefined): string {
  return (input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[’'`]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function tokens(input: string | undefined): string[] {
  return normalizeRestaurantSearchText(input)
    .split(" ")
    .filter((token) => token.length >= 2 && !GENERIC_SUFFIXES.has(token));
}

function normalizePhone(input: string | undefined): string {
  const digits = (input ?? "").replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

function normalizeDomain(input: string | undefined): string {
  const raw = (input ?? "").trim().toLowerCase();
  if (!raw) return "";
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  }
}

function canonicalNames(candidate: RestaurantSearchCandidate): string[] {
  return [candidate.restaurantName, ...(candidate.searchAliases ?? []), ...(candidate.aliases ?? [])];
}

function candidateLinks(candidate: RestaurantSearchCandidate): string[] {
  return [
    candidate.websiteUrl,
    candidate.googleListingUrl,
    candidate.googleMapsUrl,
    candidate.googleBusinessProfileUrl,
    candidate.instagramUrl,
    candidate.facebookUrl,
    candidate.menuOrderingUrl,
    candidate.doorDashUrl,
    candidate.uberEatsUrl,
    candidate.grubhubUrl,
    candidate.directOrderingUrl,
  ].filter((link): link is string => Boolean(link));
}

function editDistanceWithinOne(a: string, b: string): boolean {
  const left = normalizeRestaurantSearchText(a).replace(/\s+/g, "");
  const right = normalizeRestaurantSearchText(b).replace(/\s+/g, "");
  if (left === right) return true;
  if (Math.abs(left.length - right.length) > 1) return false;
  let edits = 0;
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) { i += 1; j += 1; continue; }
    edits += 1;
    if (edits > 1) return false;
    if (left.length > right.length) i += 1;
    else if (right.length > left.length) j += 1;
    else { i += 1; j += 1; }
  }
  return true;
}

function tokenMatches(a: string, b: string): boolean {
  return a === b || a.includes(b) || b.includes(a) || (a.length >= 5 && b.length >= 5 && editDistanceWithinOne(a, b));
}

function addReason(reasons: RestaurantMatchReason[], reason: RestaurantMatchReason) {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function queryFromInput(input: string | Partial<RestaurantSearchQuery>): RestaurantSearchQuery {
  if (typeof input === "string") return { restaurantName: input };
  return { ...input, restaurantName: input.restaurantName ?? "" };
}

export function matchRestaurantCandidates(
  input: string | Partial<RestaurantSearchQuery>,
  candidates: RestaurantSearchCandidate[] = demoRestaurantSearchCandidates,
): RestaurantMatchingResult {
  const query = queryFromInput(input);
  const queryName = normalizeRestaurantSearchText(query.restaurantName);
  const queryCity = normalizeRestaurantSearchText(query.city);
  const queryState = normalizeRestaurantSearchText(query.state);
  const queryAddress = normalizeRestaurantSearchText(query.address ?? query.restaurantName);
  const queryPhone = normalizePhone(query.phone ?? query.restaurantName);
  const queryDomain = normalizeDomain(query.websiteUrl ?? query.website ?? query.domain ?? query.restaurantName);
  const queryPlatformDomains = [
    query.googleMapsUrl,
    query.googleBusinessProfileUrl,
    query.instagramUrl,
    query.facebookUrl,
    query.doorDashUrl,
    query.uberEatsUrl,
    query.grubhubUrl,
    query.directOrderingUrl,
  ].map(normalizeDomain).filter(Boolean);
  const queryCuisineTokens = tokens(query.cuisineType);
  const queryNameTokens = tokens(query.restaurantName);

  if (!queryName && !queryPhone && !queryDomain && !queryAddress) {
    return { state: "no_match", matches: [] };
  }

  const ranked: RestaurantCandidateMatch[] = [];

  for (const candidate of candidates) {
    let score = 0;
    const reasons: RestaurantMatchReason[] = [];
    const candidateNameNorm = normalizeRestaurantSearchText(candidate.restaurantName);
    const candidateAliases = [...(candidate.searchAliases ?? []), ...(candidate.aliases ?? [])];
    const allNames = canonicalNames(candidate);
    const allNameNorms = allNames.map(normalizeRestaurantSearchText);
    const aliasNorms = candidateAliases.map(normalizeRestaurantSearchText);

    if (queryName && queryName === candidateNameNorm) { score += 100; addReason(reasons, "name matched"); }
    if (queryName && aliasNorms.includes(queryName)) { score += 95; addReason(reasons, "alias matched"); }
    if (queryName && allNameNorms.some((name) => name.includes(queryName) || queryName.includes(name))) {
      score += 60;
      addReason(reasons, aliasNorms.some((name) => name.includes(queryName) || queryName.includes(name)) ? "alias matched" : "name matched");
    }

    if (queryNameTokens.length > 0) {
      const candidateNameTokens = allNames.flatMap(tokens);
      const hits = queryNameTokens.filter((qt) => candidateNameTokens.some((ct) => tokenMatches(qt, ct))).length;
      const ratio = hits / queryNameTokens.length;
      if (ratio >= 0.8) { score += 45; addReason(reasons, "weak/fuzzy match only"); }
      else if (hits >= 1) { score += 15; addReason(reasons, "weak/fuzzy match only"); }
    }

    const cityMatches = queryCity && normalizeRestaurantSearchText(candidate.city) === queryCity;
    const stateMatches = queryState && normalizeRestaurantSearchText(candidate.state) === queryState;
    if (cityMatches && stateMatches) { score += 18; addReason(reasons, "city/state matched"); }
    else if (cityMatches || stateMatches) { score += 8; addReason(reasons, "city/state matched"); }

    const candidateAddress = normalizeRestaurantSearchText(candidate.address ?? candidate.addressLine);
    if (queryAddress && candidateAddress && (queryAddress.includes(candidateAddress) || candidateAddress.includes(queryAddress) || tokens(queryAddress).filter((qt) => tokens(candidateAddress).some((ct) => tokenMatches(qt, ct))).length >= 3)) {
      score += 50;
      addReason(reasons, "address matched");
    }

    const candidatePhone = normalizePhone(candidate.phone);
    if (queryPhone.length >= 10 && candidatePhone && queryPhone === candidatePhone) { score += 90; addReason(reasons, "phone matched"); }

    const candidateDomains = candidateLinks(candidate).map(normalizeDomain).filter(Boolean);
    if (queryDomain && candidateDomains.includes(queryDomain)) { score += 90; addReason(reasons, "domain matched"); }
    if (queryPlatformDomains.some((domain) => candidateDomains.includes(domain))) { score += 35; addReason(reasons, "platform link matched"); }

    if (queryCuisineTokens.length > 0) {
      const cuisineHits = queryCuisineTokens.filter((qt) => tokens(candidate.cuisineType).some((ct) => tokenMatches(qt, ct))).length;
      if (cuisineHits > 0) score += Math.min(8, cuisineHits * 3);
    }

    if (score < 25) continue;
    let state: RestaurantMatchState = "manual_review_needed";
    if (score >= 115 || reasons.includes("phone matched") || reasons.includes("domain matched")) state = "exact_match";
    else if (score >= 65) state = "likely_match";

    ranked.push({ candidate, score, state, reasons });
  }

  ranked.sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return { state: "no_match", matches: [] };
  const top = ranked[0];
  const second = ranked[1];
  const state = second && top.score - second.score < 10 ? "multiple_possible_matches" : top.state;
  return { state, matches: ranked.map((match, index) => index === 0 ? { ...match, state } : match), topMatch: { ...top, state } };
}

function confidenceForState(state: RestaurantMatchState, current: RestaurantMatchConfidence): RestaurantMatchConfidence {
  if (state === "exact_match" || state === "likely_match") return current;
  if (current === "high") return "medium";
  return "low";
}

export function searchRestaurantCandidates(input: string | Partial<RestaurantSearchQuery>): RestaurantSearchCandidate[] {
  const result = matchRestaurantCandidates(input);
  return result.matches.map((match) => ({
    ...match.candidate,
    matchSource: match.reasons.includes("weak/fuzzy match only") && !match.reasons.includes("name matched") && !match.reasons.includes("alias matched") ? "fuzzy match" : match.candidate.matchSource ?? "fixture",
    matchConfidence: confidenceForState(match.state, match.candidate.matchConfidence),
  }));
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
  const addressLine = city || state ? `${[city, state].filter(Boolean).join(", ")} — address needs manual confirmation` : "Address needs manual confirmation";
  const slug = normalizeRestaurantSearchText(restaurantName).replace(/\s+/g, "-") || "restaurant";
  const notes = [MANUAL_FALLBACK_NOTE, input.notes?.trim()].filter(Boolean).join(" ");

  return {
    id: `manual-audit-${slug}`,
    restaurantName,
    searchAliases: [restaurantName],
    city,
    state,
    addressLine,
    cuisineType: input.cuisineType?.trim() || "Restaurant / Food — category not verified",
    googleListingUrl: input.googleMapsUrl,
    googleMapsUrl: input.googleMapsUrl,
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
