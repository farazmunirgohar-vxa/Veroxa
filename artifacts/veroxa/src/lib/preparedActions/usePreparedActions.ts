/**
 * usePreparedActions — React hook that subscribes the Approval Queue UI to the
 * local prepared-action store so status changes re-render immediately.
 */

import { useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "./preparedActionStore";
import type { PreparedAction } from "@/domain/preparedActions";

export function usePreparedActions(): PreparedAction[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
