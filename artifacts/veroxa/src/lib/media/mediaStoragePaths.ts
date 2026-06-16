import { getSafeMediaExtension } from "./mediaValidation";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertSafeRestaurantId(restaurantId: string): string {
  if (!UUID_PATTERN.test(restaurantId)) throw new Error("Restaurant workspace is not ready for media upload.");
  return restaurantId;
}

export function buildRestaurantMediaStoragePath(input: { restaurantId: string; mimeType: string; now?: Date; id?: string }): string {
  const restaurantId = assertSafeRestaurantId(input.restaurantId);
  const extension = getSafeMediaExtension(input.mimeType);
  if (!extension) throw new Error("This file type is not supported yet.");
  const id = input.id ?? crypto.randomUUID();
  if (!UUID_PATTERN.test(id)) throw new Error("Upload could not be prepared safely.");
  const date = input.now ?? new Date();
  const yyyy = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `restaurants/${restaurantId}/uploads/${yyyy}/${mm}/${id}.${extension}`;
}
