import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Inbox,
  Image as ImageIcon,
  Video as VideoIcon,
  Check,
  AlertCircle,
  Clock,
  Bookmark,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { getWriteSafetyBanner } from "@/lib/data/writeReadiness";
import { teamPortalNavItems } from "@/lib/teamPortalNav";
import { demoUploadCategoryLabels } from "@/data/uploadKeys/demoRestaurantUploadKeys";
import {
  demoUploadPriorityLabels,
  demoUploadStatusLabels,
  demoUploadSubmissions,
  type DemoUploadStatus,
  type DemoUploadSubmission,
} from "@/data/uploadKeys/demoUploadSubmissions";
import {
  clearLocalUploadSubmissions,
  getLocalUploadSubmissions,
  isLocalUploadSubmission,
  subscribeToLocalUploadSubmissions,
  updateLocalUploadSubmissionStatus,
} from "@/lib/uploadKeys/localUploadStore";

const statusToneStyles: Record<DemoUploadStatus, string> = {
  received: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  in_review: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  needs_better_photo: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  saved_for_later: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30",
};

/**
 * /demo/team/upload-inbox — Team Upload Inbox (M014).
 *
 * Shows restaurant uploads submitted through the Restaurant Upload Key
 * flow. Local-only state — review actions update component state and
 * never hit the database or any external API.
 */
export default function TeamUploadInbox() {
  // Fixture submissions stay in component state for local triage practice.
  const [fixtureItems, setFixtureItems] = useState<DemoUploadSubmission[]>(() => [
    ...demoUploadSubmissions,
  ]);
  // Session-store submissions (from /upload during this browser session).
  const [localItems, setLocalItems] = useState<DemoUploadSubmission[]>(
    () => getLocalUploadSubmissions(),
  );

  useEffect(() => {
    const unsub = subscribeToLocalUploadSubmissions((next) => setLocalItems(next));
    setLocalItems(getLocalUploadSubmissions());
    return unsub;
  }, []);

  const items = useMemo(
    () => [...localItems, ...fixtureItems],
    [localItems, fixtureItems],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, DemoUploadSubmission[]>();
    for (const s of items) {
      const list = map.get(s.restaurantName) ?? [];
      list.push(s);
      map.set(s.restaurantName, list);
    }
    return Array.from(map.entries());
  }, [items]);

  function updateStatus(id: string, status: DemoUploadStatus) {
    if (isLocalUploadSubmission(id)) {
      updateLocalUploadSubmissionStatus(id, status);
      setLocalItems(getLocalUploadSubmissions());
      return;
    }
    setFixtureItems((curr) => curr.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  function handleClearSession() {
    clearLocalUploadSubmissions();
    setLocalItems([]);
  }

  return (
    <PortalLayout items={teamPortalNavItems} portalName="Team Portal">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="upload-inbox-heading">
              <Inbox className="w-6 h-6 text-primary" /> Upload Inbox
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Daily restaurant uploads submitted through restaurant upload keys. Triage here,
              then move accepted items to{" "}
              <Link
                href="/demo/team/media-review"
                className="text-primary hover:underline"
                data-testid="link-to-media-review"
              >
                Media Review
              </Link>
              .
            </p>
          </div>
          <Link
            href="/upload"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            data-testid="link-open-upload"
          >
            Open Restaurant Upload <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <DemoOnlyBanner message="Demo/local only — no real uploads, no notifications, no database writes. Actions update local state in this browser only." />

        <div
          className="mt-2 text-[11px] text-muted-foreground/80 px-1"
          data-testid="banner-writes-disabled-upload-inbox"
        >
          {getWriteSafetyBanner()}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 mb-4 px-1 text-xs text-muted-foreground">
          <span>
            Uploads from <span className="font-mono">/upload</span> appear here for this
            browser session only ({localItems.length} session upload
            {localItems.length === 1 ? "" : "s"}).
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClearSession}
            disabled={localItems.length === 0}
            data-testid="btn-clear-session-uploads"
          >
            <Trash2 className="w-3 h-3 mr-1" /> Clear session uploads
          </Button>
        </div>

        {grouped.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No uploads yet. Restaurant employees can submit content at <code>/upload</code>.
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {grouped.map(([restaurantName, submissions]) => (
            <Card key={restaurantName} data-testid={`inbox-group-${restaurantName.replace(/\s+/g, "-").toLowerCase()}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{restaurantName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {submissions.length} upload{submissions.length === 1 ? "" : "s"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="divide-y divide-border">
                  {submissions.map((s) => (
                    <li key={s.id} className="py-3 first:pt-0 last:pb-0" data-testid={`inbox-item-${s.id}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {s.fileKind === "video" ? (
                            <VideoIcon className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">{s.fileLabel}</span>
                            <Badge variant="outline" className="text-xs">
                              {demoUploadCategoryLabels[s.category]}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {demoUploadPriorityLabels[s.priority]}
                            </Badge>
                          </div>
                          {s.note && (
                            <p className="text-sm text-foreground/90 mb-1">"{s.note}"</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            <span className="font-mono">{s.id}</span> · Submitted {s.submittedAtLabel}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusToneStyles[s.status]}`}
                          data-testid={`inbox-status-${s.id}`}
                        >
                          {demoUploadStatusLabels[s.status]}
                        </Badge>
                      </div>

                      <Separator className="my-3" />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(s.id, "in_review")}
                          data-testid={`btn-mark-review-${s.id}`}
                        >
                          <Clock className="w-3.5 h-3.5 mr-1" /> Mark In Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(s.id, "accepted")}
                          data-testid={`btn-accept-${s.id}`}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Accept for Content
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(s.id, "needs_better_photo")}
                          data-testid={`btn-needs-photo-${s.id}`}
                        >
                          <AlertCircle className="w-3.5 h-3.5 mr-1" /> Needs Better Photo
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(s.id, "saved_for_later")}
                          data-testid={`btn-save-later-${s.id}`}
                        >
                          <Bookmark className="w-3.5 h-3.5 mr-1" /> Save for Later
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
