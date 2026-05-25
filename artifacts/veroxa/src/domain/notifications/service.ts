import { NotificationRepository } from "./repository";
import type { Role } from "./types";

export const NotificationService = {
  forRole:        (role: Role) => NotificationRepository.forRole(role),
  unreadCount:    (role: Role) => NotificationRepository.forRole(role).length,
  latest:         (role: Role, n = 3) => NotificationRepository.forRole(role).slice(0, n),
};
