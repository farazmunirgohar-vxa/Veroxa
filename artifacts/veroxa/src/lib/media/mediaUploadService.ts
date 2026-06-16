import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaAssetRecord, Uuid } from "@/domain/liveAutomation/databaseTypes";
import { RESTAURANT_MEDIA_BUCKET } from "./mediaUploadConfig";
import { buildRestaurantMediaStoragePath } from "./mediaStoragePaths";
import { validateMediaFile } from "./mediaValidation";

export interface UploadRestaurantMediaInput { client: SupabaseClient; restaurantId: Uuid; userId: Uuid; file: File; }

export async function uploadRestaurantMedia(input: UploadRestaurantMediaInput): Promise<MediaAssetRecord> {
  const validation = validateMediaFile(input.file);
  if (!validation.ok || !validation.kind) throw new Error(validation.message ?? "Upload failed. Please try again.");
  const storagePath = buildRestaurantMediaStoragePath({ restaurantId: input.restaurantId, mimeType: input.file.type });
  const { error: uploadError } = await input.client.storage.from(RESTAURANT_MEDIA_BUCKET).upload(storagePath, input.file, { upsert: false, contentType: input.file.type });
  if (uploadError) throw new Error("Upload failed. Please try again.");
  const insert = { restaurant_id: input.restaurantId, storage_path: storagePath, file_url: null, file_type: validation.kind, mime_type: input.file.type, file_size: input.file.size, uploaded_by: input.userId, status: "uploaded", ai_summary: null, veroxa_notes: null };
  const { data, error } = await input.client.from("media_assets").insert(insert).select("*").single();
  if (error || !data) throw new Error("Upload failed. Please try again.");
  return data as MediaAssetRecord;
}

export async function listRestaurantMediaAssets(client: SupabaseClient, restaurantId: Uuid): Promise<MediaAssetRecord[]> {
  const { data, error } = await client.from("media_assets").select("*").eq("restaurant_id", restaurantId).order("created_at", { ascending: false });
  if (error) throw new Error("Media could not be loaded right now.");
  return (data ?? []) as MediaAssetRecord[];
}
