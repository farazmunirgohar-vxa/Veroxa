import { demoContentItems, demoWorkflowStages } from "@/data/demoData";
import type { ContentItem, WorkflowStage } from "./types";

export const ContentRepository = {
  list:        (): ContentItem[]    => demoContentItems,
  byId:        (id: string)         => demoContentItems.find((c) => c.id === id),
  byClient:    (clientId: string)   => demoContentItems.filter((c) => c.clientId === clientId),
  blocked:     ()                   => demoContentItems.filter((c) => c.status === "Blocked" || c.status === "Waiting"),
  stages:      (): readonly WorkflowStage[] => demoWorkflowStages,
};
