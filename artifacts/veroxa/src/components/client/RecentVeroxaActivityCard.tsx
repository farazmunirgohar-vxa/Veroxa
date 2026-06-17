import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/useAuth";
import { getSupabaseClient } from "@/lib/supabase";
import { canReadClientVisibleActivity } from "@/lib/activityLog/activityLogConfig";
import { listClientVisibleActivity } from "@/lib/activityLog/activityLogService";
import type { ActivityLogRecord } from "@/domain/liveAutomation/databaseTypes";

export function RecentVeroxaActivityCard() {
  const auth = useAuth();
  const [activity, setActivity] = useState<ActivityLogRecord[]>([]);
  const canReadActivity = canReadClientVisibleActivity(auth);

  useEffect(() => {
    if (!canReadActivity || !auth.session?.clientId) return;
    const client = getSupabaseClient();
    if (!client) return;
    void listClientVisibleActivity(client, auth.session.clientId).then(setActivity).catch(() => setActivity([]));
  }, [auth.session?.clientId, canReadActivity]);

  return (
    <Card data-testid="recent-veroxa-activity"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4 text-primary" />Recent Veroxa Activity</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>Only activity Veroxa has marked visible appears here.</p><p>Reports are prepared separately after review.</p>{canReadActivity && activity.length > 0 ? activity.map((item) => <div key={item.id} className="rounded-lg border border-border/70 p-3"><p className="font-medium text-foreground">{item.title}</p>{item.description ? <p className="mt-1">{item.description}</p> : null}<p className="mt-2 text-xs">{new Date(item.created_at).toLocaleString()}</p></div>) : <p>No recent visible activity is available yet.</p>}</CardContent></Card>
  );
}
