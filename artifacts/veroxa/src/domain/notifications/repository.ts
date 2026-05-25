import { demoNotifications, demoRoleNotifications } from "@/data/demoData";
import type { Role } from "./types";

export const NotificationRepository = {
  legacy: () => demoNotifications,
  forRole:    (role: Role) => demoRoleNotifications[role],
};
