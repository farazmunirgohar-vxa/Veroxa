import { NotificationService } from "@/domain";
import type { Role } from "@/domain/notifications/types";
export const NotificationStore = {
  forRole:     (role: Role) => NotificationService.forRole(role),
  latest:      (role: Role) => NotificationService.latest(role),
  unreadCount: (role: Role) => NotificationService.unreadCount(role),
};
