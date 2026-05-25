import { ContentRepository, WorkflowService } from "@/domain";
export const WorkflowStore = {
  items:    () => ContentRepository.list(),
  stuck:    () => ContentRepository.blocked(),
  stages:   () => WorkflowService.stages(),
  stateOf:  WorkflowService.stateOf,
};
