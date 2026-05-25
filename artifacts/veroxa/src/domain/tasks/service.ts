import { TaskRepository } from "./repository";
import type { TaskPriority, Task } from "./types";

const priorityWeight: Record<TaskPriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export const TaskService = {
  todaysFocus: (): Task[] =>
    [...TaskRepository.dueToday()].sort(
      (a, b) => priorityWeight[a.priority] - priorityWeight[b.priority],
    ),
  overdueQueue: () => TaskRepository.overdue(),
  forClient:    (id: string) => TaskRepository.byClient(id),
};
