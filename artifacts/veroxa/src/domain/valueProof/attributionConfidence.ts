import type { AttributionConfidence } from "./types";
export function getConfidenceLabel(confidence: AttributionConfidence): string {
  return (
    {
      confirmed: "Confirmed",
      strong_signal: "Strong signal",
      directional: "Directional",
      owner_reported: "Owner reported",
      unknown: "Unknown",
    } as const
  )[confidence];
}
