import { ContentRepository } from "./repository";
import type { WorkflowStage, WorkflowState } from "./types";

/** Pure stage math — derived from the repository's stage list, not demoData. */
function stageIndex(stage: WorkflowStage): number {
  return ContentRepository.stages().indexOf(stage);
}

function nextOf(stage: WorkflowStage): WorkflowStage | null {
  const stages = ContentRepository.stages();
  const i = stages.indexOf(stage);
  return i >= 0 && i < stages.length - 1 ? stages[i + 1] : null;
}

function prevOf(stage: WorkflowStage): WorkflowStage | null {
  const stages = ContentRepository.stages();
  const i = stages.indexOf(stage);
  return i > 0 ? stages[i - 1] : null;
}

function progressOf(stage: WorkflowStage): number {
  const stages = ContentRepository.stages();
  const i = stages.indexOf(stage);
  if (i < 0) return 0;
  return Math.round(((i + 1) / stages.length) * 100);
}

export const WorkflowService = {
  stages:            (): readonly WorkflowStage[] => ContentRepository.stages(),
  getNextStage:      (s: WorkflowStage) => nextOf(s),
  getPreviousStage:  (s: WorkflowStage) => prevOf(s),
  calculateProgress: (s: WorkflowStage) => progressOf(s),
  isTerminal:        (s: WorkflowStage) => nextOf(s) === null,
  validateTransition(from: WorkflowStage, to: WorkflowStage): { ok: boolean; reason?: string } {
    const i = stageIndex(from);
    const j = stageIndex(to);
    if (i < 0 || j < 0)             return { ok: false, reason: "Unknown stage" };
    if (j === i)                    return { ok: false, reason: "Already at this stage" };
    if (j !== i + 1 && j !== i - 1) return { ok: false, reason: "Stages must advance one step at a time" };
    return { ok: true };
  },
  /** Demo-only stage advance. Returns next state — does not persist. */
  advanceStage(s: WorkflowStage): WorkflowState {
    return WorkflowService.stateOf(nextOf(s) ?? s);
  },
  stateOf(stage: WorkflowStage): WorkflowState {
    return {
      currentStage:  stage,
      previousStage: prevOf(stage),
      nextStage:     nextOf(stage),
      progress:      progressOf(stage),
      isTerminal:    nextOf(stage) === null,
    };
  },
};

export const ContentService = {
  forClient:    (id: string) => ContentRepository.byClient(id),
  stuck:        ()           => ContentRepository.blocked(),
  withState:    (id: string) => {
    const item = ContentRepository.byId(id);
    return item ? { item, state: WorkflowService.stateOf(item.currentStage) } : undefined;
  },
};
