import {
  demoRestaurants, demoClientLifecycle, demoClientHealth, demoHealthScores,
  getRestaurantName,
} from "@/data/demoData";
import type { Client, ClientLifecycle, ClientHealth, CompositeHealthScore } from "./types";

/** Reads from centralized demoData today. Swap the bodies for DB calls later. */
export const ClientRepository = {
  list:            (): Client[]                     => demoRestaurants,
  byId:            (id: string): Client | undefined => demoRestaurants.find((r) => r.id === id),
  lifecycle:       (): ClientLifecycle[]            => demoClientLifecycle,
  lifecycleFor:    (id: string)                     => demoClientLifecycle.find((l) => l.clientId === id),
  health:          (): ClientHealth[]               => demoClientHealth,
  healthFor:       (id: string)                     => demoClientHealth.find((h) => h.clientId === id),
  compositeScores: (): CompositeHealthScore[]       => demoHealthScores,
  nameOf:          (id: string)                     => getRestaurantName(id),
};
