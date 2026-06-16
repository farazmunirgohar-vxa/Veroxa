import { useState } from "react";
import { Upload } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { getSupabaseClient } from "@/lib/supabase";
import { isMediaUploadEnabled } from "@/lib/media/mediaUploadConfig";
import { uploadRestaurantMedia } from "@/lib/media/mediaUploadService";
import { validateMediaBatch } from "@/lib/media/mediaValidation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { MediaAssetRecord } from "@/domain/liveAutomation/databaseTypes";

function safeStatusLabel(status: string) { return status === "uploaded" ? "Uploaded" : status.replaceAll("_", " "); }

export function MediaUploadPanel() {
  const auth = useAuth();
  const enabled = isMediaUploadEnabled();
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [assets, setAssets] = useState<MediaAssetRecord[]>([]);

  if (!enabled || auth.status !== "authenticated" || auth.session?.role !== "client" || !auth.session.clientId) return null;

  const validations = validateMediaBatch(files);
  const hasInvalid = validations.some((item) => !item.ok);

  async function submit() {
    const client = getSupabaseClient();
    if (!client || !auth.session?.clientId || !auth.session.userId) { setMessage("Upload failed. Please try again."); return; }
    if (!files.length || hasInvalid) { setMessage("Please upload photos or videos only."); return; }
    setUploading(true); setMessage(null);
    try {
      const uploaded: MediaAssetRecord[] = [];
      for (const file of files) uploaded.push(await uploadRestaurantMedia({ client, restaurantId: auth.session.clientId, userId: auth.session.userId, file }));
      setAssets((current) => [...uploaded, ...current]);
      setFiles([]);
      setMessage("Uploaded. Veroxa will review the media before anything is used.");
    } catch (err) { setMessage(err instanceof Error ? err.message : "Upload failed. Please try again."); }
    finally { setUploading(false); }
  }

  return <Card className="mt-4" data-testid="media-upload-panel"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Upload className="h-4 w-4 text-primary" />Upload Photos or Videos</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><p className="text-muted-foreground">Upload photos or videos whenever it is easy. They do not need to be perfect. Veroxa will review them.</p><input aria-label="Choose photos or videos" type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm" onChange={(event) => { setFiles(Array.from(event.target.files ?? [])); setMessage(null); }} />{files.length > 0 && <div className="space-y-2">{files.map((file, index) => <div key={`${file.name}-${file.size}-${index}`} className="rounded-lg border border-border/70 p-3"><div className="flex items-start justify-between gap-3"><span className="font-medium">{file.name}</span><StatusBadge tone={validations[index]?.ok ? "neutral" : "danger"}>{validations[index]?.ok ? "Ready for Veroxa Review" : "Needs a different file"}</StatusBadge></div>{validations[index]?.message && <p className="mt-1 text-xs text-muted-foreground">{validations[index].message}</p>}</div>)}</div>}<Button onClick={submit} disabled={uploading || !files.length || hasInvalid}>{uploading ? "Uploading..." : "Upload for Veroxa Review"}</Button>{message && <p className="text-sm text-muted-foreground">{message}</p>}{assets.length > 0 && <div className="space-y-2" data-testid="uploaded-media-results">{assets.map((asset) => <div key={asset.id} className="flex items-center justify-between rounded-lg border border-border/70 p-3"><span>{asset.file_type === "video" ? "Video" : "Photo"}</span><StatusBadge tone="neutral">{safeStatusLabel(asset.status)}</StatusBadge></div>)}</div>}</CardContent></Card>;
}
