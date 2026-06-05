import { buildClientReadinessSnapshot } from "./clientReadinessEngine";
import type { ClientReadinessChecklistItem, ClientReadinessSnapshot } from "./types";

export function getClientReadinessChecklist(snapshot: ClientReadinessSnapshot = buildClientReadinessSnapshot()): ClientReadinessChecklistItem[] {
  return snapshot.areas.map((area) => ({
    id: area.id,
    label: area.label,
    status: area.status,
    detail: area.detail,
    nextAction: area.nextAction ?? "Wait for Veroxa review",
    required: area.required,
  }));
}
