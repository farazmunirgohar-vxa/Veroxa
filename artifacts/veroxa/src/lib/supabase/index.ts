export { getSupabaseEnv } from "./env";
export type { SupabaseEnv, SupabaseEnvState } from "./env";

export { getSupabaseClient } from "./client";

export {
  DEFAULT_DEMO_CLIENT_ID,
  getClientById,
  getClientPlatforms,
  getClientMediaAssets,
  getClientCalendar,
  getClientWeeklyReports,
  getClientMonthlyReports,
} from "./clientPortalQueries";
