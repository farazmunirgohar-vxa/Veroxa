import { TaskRepository, TaskService } from "@/domain";
export const TaskStore = {
  all:       () => TaskRepository.list(),
  today:     () => TaskService.todaysFocus(),
  overdue:   () => TaskService.overdueQueue(),
  forClient: (id: string) => TaskRepository.byClient(id),
};
