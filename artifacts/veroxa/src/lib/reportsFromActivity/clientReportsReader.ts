import { getSupabaseClient } from "@/lib/supabase";
import { listClientVisibleReports } from "@/lib/reportsFromActivity/reportsService";
import type { ReportRecord } from "@/domain/liveAutomation/databaseTypes";

export type ClientPortalReport = ReportRecord;

export async function loadClientPortalReports(restaurantId: string): Promise<ClientPortalReport[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  return listClientVisibleReports(client, restaurantId);
}
