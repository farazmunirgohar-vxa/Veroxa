export type {
  DemoContentItem as ContentItem,
  WorkflowStage, ContentItemStatus, ContentItemType, ContentStageEvent,
} from "@/data/demoData";

export interface WorkflowState {
  currentStage:  import("@/data/demoData").WorkflowStage;
  previousStage: import("@/data/demoData").WorkflowStage | null;
  nextStage:     import("@/data/demoData").WorkflowStage | null;
  progress:      number;
  isTerminal:    boolean;
}
