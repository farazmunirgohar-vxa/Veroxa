import { logger } from "./logger";

export interface WebPresenceScan {
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

const MAX_BYTES = 350_000;
const TIMEOUT_MS = 10_000;

function emptyScan(notes: string[]): WebPresenceScan {
  return {
    websiteFound: false,
    menuLinkFound: false,
    orderLinkFound: false,
    reservationLinkFound: false,
    contactPathFound: false,
    instagramLinkFound: false,
    facebookLinkFound: false,
    tiktokLinkFound: false,
    yelpLinkFound: false,
    googleMapsLinkFound: false,
    discoveredSocialLinks: [],
    discoveredMenuLinks: [],
    scanConfidence: "none",
    scanNotes: notes,
  };
}

function normalizeUrl(input: string): string | null {
  try {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const withProto = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].trim()).slice(0, 200) : undefined;
}

function extractMetaDescription(html: string): string | undefined {
  const m =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i,
    ) ||
    html.match(
      /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i,
    );
  return m ? decodeEntities(m[1].trim()).slice(0, 400) : undefined;
}

function extractHrefs(html: string): string[] {
  const out: string[] = [];
  const re = /href\s*=\s*["']([^"']{1,500})["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    out.push(m[1]);
    if (out.length > 1500) break;
  }
  return out;
}

export async function scanRestaurantWebPresence(input: {
  websiteUrl?: string;
  restaurantName?: string;
}): Promise<WebPresenceScan> {
  const normalized = input.websiteUrl ? normalizeUrl(input.websiteUrl) : null;
  if (!normalized) {
    return emptyScan(["No restaurant-owned website was provided to scan."]);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let html = "";
  try {
    const res = await fetch(normalized, {
      method: "GET",
      headers: {
        "User-Agent": "VeroxaAuditBot/1.0 (+restaurant audit; respects robots)",
        Accept: "text/html,*/*;q=0.1",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return emptyScan([
        `Website did not respond cleanly (status ${res.status}). Manual review needed.`,
      ]);
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("html")) {
      return emptyScan(["Website did not return HTML. Manual review needed."]);
    }
    const reader = res.body?.getReader();
    if (!reader) {
      const fallback = await res.text();
      html = fallback.slice(0, MAX_BYTES);
    } else {
      const decoder = new TextDecoder("utf-8", { fatal: false });
      let bytes = 0;
      while (bytes < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        html += decoder.decode(value, { stream: true });
        if (bytes >= MAX_BYTES) break;
      }
      try {
        await reader.cancel();
      } catch {
        // ignore
      }
    }
  } catch (err) {
    clearTimeout(timeout);
    logger.warn({ err }, "Web presence scan threw");
    return emptyScan([
      "Could not reach the restaurant website. Manual review needed.",
    ]);
  }

  const lowerHtml = html.toLowerCase();
  const hrefs = extractHrefs(html);
  const baseHost = new URL(normalized).host.toLowerCase();

  const social = {
    instagram: /instagram\.com\//i,
    facebook: /facebook\.com\//i,
    tiktok: /tiktok\.com\//i,
    yelp: /yelp\.com\//i,
    googleMaps: /(?:maps\.google\.com|maps\.app\.goo\.gl|goo\.gl\/maps|g\.page)/i,
  };

  const discoveredSocialLinks: string[] = [];
  const discoveredMenuLinks: string[] = [];
  let instagramLinkFound = false;
  let facebookLinkFound = false;
  let tiktokLinkFound = false;
  let yelpLinkFound = false;
  let googleMapsLinkFound = false;
  let menuLinkFound = false;
  let orderLinkFound = false;
  let reservationLinkFound = false;
  let contactPathFound = false;

  const menuRe = /\bmenu\b|\bmenus\b/i;
  const orderRe =
    /\border(?:[\s-]?online)?\b|\bdoordash\b|\bgrubhub\b|\buber\s*eats\b|\bchownow\b|\btoasttab\b|\bcheckout\b/i;
  const reservationRe =
    /\breserv|\bbook(?:[\s-]?a[\s-]?table)?\b|\bopentable\b|\bresy\b|\bsevenrooms\b/i;
  const contactRe =
    /\bcontact\b|\bphone\b|\btel:|\bmailto:|\babout\b|\blocation\b|\bhours\b/i;

  for (const href of hrefs) {
    const lower = href.toLowerCase();
    if (social.instagram.test(lower)) {
      instagramLinkFound = true;
      if (!discoveredSocialLinks.includes(href)) discoveredSocialLinks.push(href);
    }
    if (social.facebook.test(lower)) {
      facebookLinkFound = true;
      if (!discoveredSocialLinks.includes(href)) discoveredSocialLinks.push(href);
    }
    if (social.tiktok.test(lower)) {
      tiktokLinkFound = true;
      if (!discoveredSocialLinks.includes(href)) discoveredSocialLinks.push(href);
    }
    if (social.yelp.test(lower)) {
      yelpLinkFound = true;
      if (!discoveredSocialLinks.includes(href)) discoveredSocialLinks.push(href);
    }
    if (social.googleMaps.test(lower)) googleMapsLinkFound = true;
    if (menuRe.test(lower)) {
      menuLinkFound = true;
      if (!discoveredMenuLinks.includes(href) && discoveredMenuLinks.length < 15)
        discoveredMenuLinks.push(href);
    }
    if (orderRe.test(lower)) orderLinkFound = true;
    if (reservationRe.test(lower)) reservationLinkFound = true;
    if (contactRe.test(lower)) contactPathFound = true;
  }

  // Body-text fallback for menu/contact words (helps when nav is JS-rendered).
  if (!menuLinkFound && /\bmenu\b/.test(lowerHtml)) menuLinkFound = true;
  if (!contactPathFound && /(tel:|mailto:|\bcontact\b)/.test(lowerHtml))
    contactPathFound = true;

  const foundCount = [
    menuLinkFound,
    orderLinkFound,
    reservationLinkFound,
    contactPathFound,
    instagramLinkFound,
    facebookLinkFound,
  ].filter(Boolean).length;
  let scanConfidence: WebPresenceScan["scanConfidence"] = "low";
  if (foundCount >= 4) scanConfidence = "high";
  else if (foundCount >= 2) scanConfidence = "medium";

  const notes: string[] = [];
  notes.push(`Scanned restaurant website at ${baseHost}.`);
  notes.push(
    "Social and Google Maps links were not visited directly — only links referenced on the restaurant's own website were noted.",
  );
  if (!menuLinkFound) notes.push("Menu link not found — manual review needed.");
  if (!contactPathFound)
    notes.push("Clear contact path not found — manual review needed.");

  return {
    websiteFound: true,
    menuLinkFound,
    orderLinkFound,
    reservationLinkFound,
    contactPathFound,
    instagramLinkFound,
    facebookLinkFound,
    tiktokLinkFound,
    yelpLinkFound,
    googleMapsLinkFound,
    pageTitle: extractTitle(html),
    metaDescription: extractMetaDescription(html),
    discoveredSocialLinks: discoveredSocialLinks.slice(0, 15),
    discoveredMenuLinks,
    scanConfidence,
    scanNotes: notes,
  };
}
