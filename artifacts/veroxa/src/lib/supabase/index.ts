export { getSupabaseEnv } from "./env";
export type { SupabaseEnv, SupabaseEnvState } from "./env";

export { getSupabaseClient } from "./client";

export {
  MAMADALI_DEMO_CLIENT_ID,
  getClientById,
  getClientPlatforms,
  getClientMediaAssets,
  getClientPosts,
  getClientPostSlots,
  getClientWeeklyReports,
  getClientMonthlyReports,
  getClientDraftVariants,
} from "./clientPortalQueries";
