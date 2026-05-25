import { demoTasksV2 } from "@/data/demoData";
export const TaskRepository = {
  list:      () => demoTasksV2,
  byClient:  (id: string) => demoTasksV2.filter((t) => t.clientId === id),
  byStatus:  (s: import("./types").TaskStatus) => demoTasksV2.filter((t) => t.status === s),
  overdue:   () => demoTasksV2.filter((t) => t.dueDate.toLowerCase() === "overdue" && t.status !== "Completed"),
  dueToday:  () => demoTasksV2.filter((t) => t.dueDate.toLowerCase() === "today"   && t.status !== "Completed"),
};
