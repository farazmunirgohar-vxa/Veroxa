import { lookup } from "node:dns/promises";
import * as net from "node:net";
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

const MAX_REDIRECTS = 5;
const MANUAL_REVIEW_SCAN_NOTE =
  "Website scan needs manual review before automated scanning can continue.";

export interface UrlSafetyResult {
  ok: boolean;
  normalizedUrl?: string;
  reason?: string;
}

function normalizeHostnameForIpCheck(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, "").replace(/^\[(.*)\]$/, "$1");
}

function ipv4FromMappedIpv6(ip: string): string | null {
  const normalized = normalizeHostnameForIpCheck(ip);
  if (!normalized.startsWith("::ffff:")) return null;

  const mapped = normalized.slice("::ffff:".length);
  if (net.isIP(mapped) === 4) return mapped;

  const hextets = mapped.split(":");
  if (hextets.length !== 2) return null;

  const high = Number.parseInt(hextets[0], 16);
  const low = Number.parseInt(hextets[1], 16);
  if (Number.isNaN(high) || Number.isNaN(low) || high < 0 || high > 0xffff || low < 0 || low > 0xffff) {
    return null;
  }

  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
}

function isLocalHostname(hostname: string): boolean {
  const normalized = normalizeHostnameForIpCheck(hostname);
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "ip6-localhost" ||
    normalized === "ip6-loopback"
  );
}

function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return null;
  }
  return parts.reduce((acc, part) => (acc << 8) + part, 0) >>> 0;
}

function ipv4InCidr(ip: string, base: string, bits: number): boolean {
  const ipNum = ipv4ToNumber(ip);
  const baseNum = ipv4ToNumber(base);
  if (ipNum === null || baseNum === null) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipNum & mask) === (baseNum & mask);
}

export function isPrivateOrInternalIp(ip: string): boolean {
  const normalized = normalizeHostnameForIpCheck(ip);
  const mappedIpv4 = ipv4FromMappedIpv6(normalized);
  if (mappedIpv4) return isPrivateOrInternalIp(mappedIpv4);

  if (net.isIP(normalized) === 4) {
    return (
      ipv4InCidr(normalized, "0.0.0.0", 8) ||
      ipv4InCidr(normalized, "10.0.0.0", 8) ||
      ipv4InCidr(normalized, "127.0.0.0", 8) ||
      ipv4InCidr(normalized, "169.254.0.0", 16) ||
      ipv4InCidr(normalized, "172.16.0.0", 12) ||
      ipv4InCidr(normalized, "192.168.0.0", 16) ||
      ipv4InCidr(normalized, "224.0.0.0", 4) ||
      normalized === "169.254.169.254"
    );
  }

  if (net.isIP(normalized) === 6) {
    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:") ||
      normalized.startsWith("ff") ||
      normalized.includes("169.254.169.254")
    );
  }

  return false;
}

export function normalizeUrl(input: string): string | null {
  try {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const withProto = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    u.username = "";
    u.password = "";
    return u.toString();
  } catch {
    return null;
  }
}

export async function validateScanUrlSafety(inputUrl: string): Promise<UrlSafetyResult> {
  const normalizedUrl = normalizeUrl(inputUrl);
  if (!normalizedUrl) {
    return { ok: false, reason: "Invalid or unsupported website URL." };
  }

  const url = new URL(normalizedUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "Only http and https website URLs can be scanned." };
  }

  const hostname = url.hostname.toLowerCase();
  const ipCheckHostname = normalizeHostnameForIpCheck(hostname);
  if (isLocalHostname(hostname)) {
    return { ok: false, reason: "Localhost and internal hostnames cannot be scanned." };
  }

  if (net.isIP(ipCheckHostname) && isPrivateOrInternalIp(ipCheckHostname)) {
    return { ok: false, reason: "Private or internal network IPs cannot be scanned." };
  }

  try {
    const records = await lookup(hostname, { all: true, verbatim: true });
    if (records.length === 0) {
      return { ok: false, reason: "Website hostname could not be resolved for safe scanning." };
    }
    if (records.some((record) => isPrivateOrInternalIp(record.address))) {
      return { ok: false, reason: "Website hostname resolves to a private/internal network." };
    }
  } catch {
    return { ok: false, reason: "Website hostname could not be resolved for safe scanning." };
  }

  return { ok: true, normalizedUrl };
}


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

  const initialSafety = await validateScanUrlSafety(normalized);
  if (!initialSafety.ok || !initialSafety.normalizedUrl) {
    return emptyScan([`${initialSafety.reason ?? MANUAL_REVIEW_SCAN_NOTE} Manual review needed.`]);
  }

  let fetchUrl = initialSafety.normalizedUrl;
  let html = "";
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const safety = await validateScanUrlSafety(fetchUrl);
    if (!safety.ok || !safety.normalizedUrl) {
      return emptyScan([`${safety.reason ?? MANUAL_REVIEW_SCAN_NOTE} Manual review needed.`]);
    }
    fetchUrl = safety.normalizedUrl;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(fetchUrl, {
        method: "GET",
        headers: {
          "User-Agent": "VeroxaAuditBot/1.0 (+restaurant audit; respects robots)",
          Accept: "text/html,*/*;q=0.1",
        },
        redirect: "manual",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) {
          return emptyScan(["Website redirect did not include a destination. Manual review needed."]);
        }
        if (redirectCount === MAX_REDIRECTS) {
          return emptyScan(["Website had too many redirects. Manual review needed."]);
        }
        fetchUrl = new URL(location, fetchUrl).toString();
        continue;
      }

      const finalUrl = res.url || fetchUrl;
      const finalSafety = await validateScanUrlSafety(finalUrl);
      if (!finalSafety.ok) {
        return emptyScan([`${finalSafety.reason ?? MANUAL_REVIEW_SCAN_NOTE} Manual review needed.`]);
      }

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
      break;
    } catch (err) {
      clearTimeout(timeout);
      logger.warn({ err }, "Web presence scan threw");
      return emptyScan([
        "Could not reach the restaurant website. Manual review needed.",
      ]);
    }
  }

  const lowerHtml = html.toLowerCase();
  const hrefs = extractHrefs(html);
  const baseHost = new URL(fetchUrl).host.toLowerCase();

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
