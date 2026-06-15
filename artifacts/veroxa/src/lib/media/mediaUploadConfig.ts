import { AUTH_MODE } from "@/lib/auth/authMode";

export const RESTAURANT_MEDIA_BUCKET = "restaurant-media";

export function isMediaUploadEnabled(): boolean {
  return AUTH_MODE === "real" && import.meta.env.VITE_VEROXA_MEDIA_UPLOAD_ENABLED === "true";
}
