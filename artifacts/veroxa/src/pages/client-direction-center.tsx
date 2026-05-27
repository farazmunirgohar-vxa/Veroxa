import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Compass,
  Clock,
  Send,
  CheckCircle2,
  Info,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { getWriteSafetyBanner } from "@/lib/data/writeReadiness";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import {
  demoClientDirection,
  directionChannelLabels,
  directionFocusLabels,
  directionStatusClientLabels,
  directionUrgencyLabels,
  type DirectionChannel,
  type DirectionFocus,
  type DirectionRequest,
  type DirectionUrgency,
} from "@/data/direction/demoClientDirection";
import { demoUploadSubmissions } from "@/data/uploadKeys/demoUploadSubmissions";
import { demoClientTeamWorkflow } from "@/data/workflows/clientTeamWorkflow";
import {
  buildAdaptiveRecommendations,
  rankRecommendations,
} from "@/lib/intelligence/adaptiveRules";
import { AdaptiveRecommendationCard } from "@/components/intelligence/AdaptiveRecommendationCard";
import { WeeklyStrategySnapshot } from "@/components/intelligence/WeeklyStrategySnapshot";
import {
  addLocalDirectionRequest,
  getLocalDirectionRequests,
  subscribeToLocalDirectionRequests,
} from "@/lib/direction/localDirectionStore";
import { getLocalUploadSubmissions } from "@/lib/uploadKeys/localUploadStore";

const CLIENT_ID = "demo-a" as const;
const CLIENT_NAME = "Demo Grill House";

const focusOptions: DirectionFocus[] = [
  "lunch_traffic",
  "dinner_traffic",
  "catering",
  "family_platters",
  "new_item",
  "dessert",
  "slow_day",
  "weekend_push",
  "google_visibility",
  "event_or_holiday",
  "ads_goal",
  "other",
];

const channelOptions: DirectionChannel[] = ["organic_social", "google", "ads", "all"];
const urgencyOptions: DirectionUrgency[] = ["low", "normal", "high", "urgent"];

const urgencyTone: Record<DirectionUrgency, string> = {
  low: "bg-muted text-muted-foreground border-border",
  normal: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  urgent: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

export default function ClientDirectionCenter() {
  const [focus, setFocus] = useState<DirectionFocus | null>(null);
  const [channel, setChannel] = useState<DirectionChannel>("organic_social");
  const [urgency, setUrgency] = useState<DirectionUrgency>("normal");
  const [note, setNote] = useState("");
  const [localItems, setLocalItems] = useState<DirectionRequest[]>(
    () => getLocalDirectionRequests().filter((d) => d.clientId === CLIENT_ID),
  );
  const [confirmationId, setConfirmationId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () =>
      setLocalItems(
        getLocalDirectionRequests().filter((d) => d.clientId === CLIENT_ID),
      );
    refresh();
    return subscribeToLocalDirectionRequests(refresh);
  }, []);

  const clientDirection = useMemo(
    () => [
      ...localItems,
      ...demoClientDirection.filter((d) => d.clientId === CLIENT_ID),
    ],
    [localItems],
  );

  const recommendations = useMemo(
    () =>
      rankRecommendations(
        buildAdaptiveRecommendations({
          clientId: CLIENT_ID,
          direction: clientDirection,
          uploads: [
            ...getLocalUploadSubmissions().filter(
              (u) => u.restaurantId === CLIENT_ID,
            ),
            ...demoUploadSubmissions.filter((u) => u.restaurantId === CLIENT_ID),
          ],
          workflow: demoClientTeamWorkflow.filter((w) => w.clientId === CLIENT_ID),
        }),
      ),
    [clientDirection],
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!focus) return;
    const created = addLocalDirectionRequest({
      clientId: CLIENT_ID,
      restaurantName: CLIENT_NAME,
      focus,
      channel,
      urgency,
      title: directionFocusLabels[focus],
      clientNote: note,
      preferredTimingLabel: "This week",
      submittedAtLabel: "Just now",
    });
    setConfirmationId(created.id);
    setFocus(null);
    setNote("");
    setUrgency("normal");
    setChannel("organic_social");
  }

  return (
    <PortalLayout items={clientPortalNavItems} portalName="Client Portal">
      <div className="mb-4">
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2"
          data-testid="header-direction-center"
        >
          <Compass className="w-6 h-6 text-primary" /> Direction Center
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base max-w-3xl">
          Tell Veroxa what matters this week. You guide priorities; Veroxa handles the
          strategy, review, schedule, and execution.
        </p>
      </div>

      <DemoOnlyBanner
        message="Demo only — direction is stored in local state, no real notifications or database writes."
        testId="banner-direction-center"
      />

      <div
        className="mt-2 text-[11px] text-muted-foreground/80 px-1"
        data-testid="banner-writes-disabled-direction-center"
      >
        {getWriteSafetyBanner()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Submission form */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">What should Veroxa focus on this week?</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" data-testid="direction-form">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Focus
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {focusOptions.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFocus(f)}
                      className={`px-3 py-2.5 rounded-md border text-sm text-left transition-colors ${
                        focus === f
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:bg-accent/40"
                      }`}
                      data-testid={`direction-focus-${f}`}
                    >
                      {directionFocusLabels[f]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Where should we focus?
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {channelOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setChannel(c)}
                      className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                        channel === c
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:bg-accent/40"
                      }`}
                      data-testid={`direction-channel-${c}`}
                    >
                      {directionChannelLabels[c]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="direction-note"
                  className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block"
                >
                  Add a note
                </label>
                <Textarea
                  id="direction-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder='e.g. "Push the lamb platter this weekend." or "We are slow on Tuesdays."'
                  data-testid="direction-note"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Examples: "Push the lamb platter this weekend." · "We are slow on Tuesdays." ·
                  "Do not post the old menu." · "Use the chef video for TikTok."
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Urgency
                </p>
                <div className="flex flex-wrap gap-2">
                  {urgencyOptions.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUrgency(u)}
                      className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                        urgency === u
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:bg-accent/40"
                      }`}
                      data-testid={`direction-urgency-${u}`}
                    >
                      {directionUrgencyLabels[u]}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Info className="w-3 h-3" /> You guide priorities. Veroxa handles execution.
                </p>
                <Button
                  type="submit"
                  disabled={!focus}
                  className="font-semibold"
                  data-testid="direction-submit"
                >
                  <Send className="w-4 h-4 mr-1" /> Send to Veroxa
                </Button>
              </div>
            </form>

            {confirmationId && (
              <div
                className="mt-4 p-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-sm text-emerald-200 flex items-start gap-2"
                data-testid="direction-confirmation"
              >
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Direction received. Reference{" "}
                  <span className="font-mono">{confirmationId}</span>. Veroxa team will
                  interpret and plan — no campaigns or posts publish without team review.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Adaptive preview sidebar */}
        <div className="space-y-3">
          <WeeklyStrategySnapshot
            recommendations={recommendations}
            audience="client"
            ctaHref="/demo/client/media"
            ctaLabel="Upload more content"
          />
          {recommendations.slice(0, 2).map((r) => (
            <AdaptiveRecommendationCard
              key={r.id}
              recommendation={r}
              audience="client"
            />
          ))}
        </div>
      </div>

      {/* Recent direction */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Recent direction
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {clientDirection.map((d) => (
            <Card key={d.id} className="bg-card border-border" data-testid={`direction-item-${d.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-medium text-sm">{d.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {directionFocusLabels[d.focus]} · {directionChannelLabels[d.channel]}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${urgencyTone[d.urgency]}`}>
                    {directionUrgencyLabels[d.urgency]}
                  </Badge>
                </div>
                {d.clientNote && d.clientNote !== "—" && (
                  <p className="text-sm text-foreground/90 mb-2">"{d.clientNote}"</p>
                )}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {d.preferredTimingLabel}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    {directionStatusClientLabels[d.status]}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
