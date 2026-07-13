import type { DeferredCapability, ProviderResult } from "./types";

export interface MediaAiInput {
  assetId: string;
  restaurantId: string;
  rightsVerified: boolean;
}

export interface ContentAiInput {
  restaurantId: string;
  confirmedTruthRevision: number;
  approvedMediaIds: string[];
  contentPillar: string;
  platforms: Array<"facebook" | "instagram" | "google_business_profile">;
}

export interface ApprovedPublicationInput {
  restaurantId: string;
  contentId: string;
  platform: "facebook" | "instagram" | "google_business_profile";
  approvalEventId: string;
}

export interface VisibilityMonitorInput {
  restaurantId: string;
  connectionId: string;
}

export interface MomoProviderAdapters {
  classifyMedia(input: MediaAiInput): Promise<ProviderResult<{ tags: string[]; confidence: number }>>;
  generateContent(input: ContentAiInput): Promise<ProviderResult<{ strategy: string; variants: Record<string, string> }>>;
  publishApproved(input: ApprovedPublicationInput): Promise<ProviderResult<{ publishedAt: string; permalink?: string }>>;
  monitorVisibility(input: VisibilityMonitorInput): Promise<ProviderResult<{ capturedAt: string; measurements: Record<string, number> }>>;
}

const capabilityForOperation = {
  classifyMedia: "media_ai_classification",
  generateContent: "content_ai_generation",
  publishApproved: ["meta_publish", "google_business_profile_write"] as const,
  monitorVisibility: "visibility_monitoring",
} satisfies Record<
  keyof MomoProviderAdapters,
  DeferredCapability | readonly DeferredCapability[]
>;

export function capabilityForPublication(
  platform: ApprovedPublicationInput["platform"],
): "meta_publish" | "google_business_profile_write" {
  return platform === "google_business_profile"
    ? "google_business_profile_write"
    : "meta_publish";
}

export function createDeferredMomoProviderAdapters(
  reason: "provider_not_authorized" | "incremental_spend_not_approved" = "provider_not_authorized",
): MomoProviderAdapters & { capabilities: typeof capabilityForOperation } {
  const blocked = async <T>(): Promise<ProviderResult<T>> => ({ status: "blocked", reason });
  return {
    capabilities: capabilityForOperation,
    classifyMedia: blocked,
    generateContent: blocked,
    publishApproved: blocked,
    monitorVisibility: blocked,
  };
}
