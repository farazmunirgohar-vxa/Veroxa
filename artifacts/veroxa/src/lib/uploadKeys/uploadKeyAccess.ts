/**
 * uploadKeyAccess.ts — M012
 *
 * Tiny utilities for resolving a typed Restaurant Upload Key against
 * the local demo fixture. Pure functions only — no network, no DB,
 * no localStorage persistence.
 */

import {
  demoRestaurantUploadKeys,
  type DemoRestaurantUploadKey,
} from "@/data/uploadKeys/demoRestaurantUploadKeys";

export type UploadKeyAccessResult =
  | { kind: "granted"; restaurant: DemoRestaurantUploadKey }
  | { kind: "paused"; restaurant: DemoRestaurantUploadKey }
  | { kind: "invalid" }
  | { kind: "empty" };

export function normalizeUploadKey(value: string): string {
  return value.trim().toUpperCase();
}

export function findRestaurantByUploadKey(
  key: string,
): DemoRestaurantUploadKey | undefined {
  const normalized = normalizeUploadKey(key);
  if (!normalized) return undefined;
  return demoRestaurantUploadKeys.find(
    (r) => normalizeUploadKey(r.demoKey) === normalized,
  );
}

export function isUploadKeyActive(key: string): boolean {
  const match = findRestaurantByUploadKey(key);
  return !!match && match.status === "active";
}

export function resolveUploadKey(rawKey: string): UploadKeyAccessResult {
  const normalized = normalizeUploadKey(rawKey);
  if (!normalized) return { kind: "empty" };
  const match = findRestaurantByUploadKey(normalized);
  if (!match) return { kind: "invalid" };
  if (match.status === "paused") return { kind: "paused", restaurant: match };
  return { kind: "granted", restaurant: match };
}

export function getUploadKeyAccessMessage(result: UploadKeyAccessResult): string {
  switch (result.kind) {
    case "granted":
      return `Access granted for ${result.restaurant.restaurantName}. You can upload today's content.`;
    case "paused":
      return `Uploads for ${result.restaurant.restaurantName} are paused. Please contact your Veroxa account manager.`;
    case "invalid":
      return "That key didn't match any restaurant. Double-check it with your manager or Veroxa contact.";
    case "empty":
      return "Enter your restaurant upload key to continue.";
  }
}
