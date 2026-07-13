const MINIMUM_PASSWORD_LENGTH = 12;
const MAXIMUM_PASSWORD_BYTES = 72;
const ALLOWED_SYMBOLS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

export function getVeroxaPasswordIssue(password) {
  const passwordBytes = new TextEncoder().encode(password).length;
  if (password.length < MINIMUM_PASSWORD_LENGTH) return "Use at least 12 characters.";
  if (passwordBytes > MAXIMUM_PASSWORD_BYTES) return "Use no more than 72 bytes.";
  if (/\s/.test(password)) return "Do not use spaces.";
  if (!/[a-z]/.test(password)) return "Add a lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Add an uppercase letter.";
  if (!/[0-9]/.test(password)) return "Add a number.";
  if (![...password].some((character) => ALLOWED_SYMBOLS.includes(character))) return "Add a supported symbol.";
  if ([...password].some((character) => !/[A-Za-z0-9]/.test(character) && !ALLOWED_SYMBOLS.includes(character))) {
    return "Use only letters, numbers, and supported symbols.";
  }
  return null;
}

export async function sha1Hex(value) {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export function pwnedRangeContainsHash(responseBody, fullHash) {
  const suffix = fullHash.slice(5).toUpperCase();
  return responseBody.split(/\r?\n/).some((line) => {
    const [candidate, rawCount] = line.trim().split(":");
    const count = Number.parseInt(rawCount || "0", 10);
    return candidate?.toUpperCase() === suffix && Number.isFinite(count) && count > 0;
  });
}

export async function isVeroxaPasswordCompromised(password, fetchImpl = globalThis.fetch) {
  const fullHash = await sha1Hex(password);
  const prefix = fullHash.slice(0, 5);
  let response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    response = await fetchImpl(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: "GET",
      headers: { "Add-Padding": "true" },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    throw new Error("password_check_unavailable");
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error("password_check_unavailable");
  return pwnedRangeContainsHash(await response.text(), fullHash);
}
