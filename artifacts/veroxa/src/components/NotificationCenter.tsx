import { useMemo, useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  BellOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  demoNotifications,
  getRestaurantName,
  notificationCategoryOrder,
  type DemoNotification,
  type NotificationCategory,
} from "@/data/demoData";

interface NotificationCenterProps {
  viewerRole: "owner" | "operator";
}

type Filter = "all" | NotificationCategory;

const categoryMeta: Record<
  NotificationCategory,
  {
    label: string;
    icon: React.ElementType;
    badge: string;
    stripe: string;
    iconColor: string;
  }
> = {
  critical: {
    label:     "Critical",
    icon:      AlertOctagon,
    badge:     "bg-red-500/10 text-red-400 border-red-500/30",
    stripe:    "before:bg-red-500",
    iconColor: "text-red-400",
  },
  warning: {
    label:     "Warning",
    icon:      AlertTriangle,
    badge:     "bg-amber-500/10 text-amber-400 border-amber-500/30",
    stripe:    "before:bg-amber-500",
    iconColor: "text-amber-400",
  },
  info: {
    label:     "Info",
    icon:      Info,
    badge:     "bg-blue-500/10 text-blue-400 border-blue-500/30",
    stripe:    "before:bg-blue-500",
    iconColor: "text-blue-400",
  },
  success: {
    label:     "Success",
    icon:      CheckCircle2,
    badge:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    stripe:    "before:bg-emerald-500",
    iconColor: "text-emerald-400",
  },
};

const priorityBadge: Record<DemoNotification["priority"], string> = {
  P1: "bg-red-500/15 text-red-400 border-red-500/30",
  P2: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  P3: "bg-muted text-muted-foreground border-border",
};

export function NotificationCenter({ viewerRole }: NotificationCenterProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const sorted = useMemo(
    () =>
      [...demoNotifications].sort(
        (a, b) =>
          notificationCategoryOrder[a.category] -
          notificationCategoryOrder[b.category],
      ),
    [],
  );

  const filtered = useMemo(
    () =>
      filter === "all" ? sorted : sorted.filter((n) => n.category === filter),
    [filter, sorted],
  );

  const unreadCount = filtered.filter((n) => !readIds.has(n.id)).length;

  const toggleRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markAllRead = () => {
    setReadIds(new Set(filtered.map((n) => n.id)));
  };

  const tabs: { key: Filter; label: string }[] = [
    { key: "all",      label: "All"      },
    { key: "critical", label: "Critical" },
    { key: "warning",  label: "Warning"  },
    { key: "info",     label: "Info"     },
    { key: "success",  label: "Success"  },
  ];

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => {
            const count =
              tab.key === "all"
                ? sorted.length
                : sorted.filter((n) => n.category === tab.key).length;
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors",
                  active
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-card/40 text-muted-foreground border-border/60 hover:bg-card hover:text-foreground",
                )}
                data-testid={`notif-filter-${tab.key}`}
              >
                {tab.label}
                <span className="ml-1.5 text-[10px] text-muted-foreground/70">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">
            {unreadCount} unread
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px]"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            data-testid="btn-mark-all-read"
          >
            Mark all read
          </Button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="bg-card/40 border-dashed border-border/60">
          <CardContent className="p-8 flex flex-col items-center text-center gap-2">
            <BellOff className="w-5 h-5 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              No notifications in this category.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((n) => {
            const meta = categoryMeta[n.category];
            const Icon = meta.icon;
            const isRead = readIds.has(n.id);

            return (
              <Card
                key={n.id}
                className={cn(
                  "relative overflow-hidden bg-card border-border/60 transition-opacity",
                  "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1",
                  meta.stripe,
                  isRead && "opacity-60",
                )}
                data-testid={`notification-${n.id}`}
              >
                <CardContent className="pl-5 pr-4 py-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex-shrink-0",
                        meta.iconColor,
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground">
                            {n.title}
                          </h4>
                          {!isRead && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
                              aria-label="unread"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold",
                              priorityBadge[n.priority],
                            )}
                          >
                            {n.priority}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] font-semibold", meta.badge)}
                          >
                            {meta.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground mb-2">
                        <span className="font-medium text-foreground/70">
                          {getRestaurantName(n.clientId)}
                        </span>
                        <span>{n.time}</span>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed mb-2.5">
                        {n.description}
                      </p>

                      <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-muted/40 border border-border/40 mb-3">
                        <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-foreground">
                          <span className="font-semibold">Suggested action: </span>
                          {n.suggestedAction}
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
                          onClick={() => toggleRead(n.id)}
                          data-testid={`btn-toggle-read-${n.id}`}
                        >
                          {isRead ? "Mark unread" : "Mark as read"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/60">
        Viewing as: <span className="text-foreground/70">{viewerRole}</span> ·
        Demo notifications only. No real notification system, email, SMS, push, or
        automation is connected.
      </p>
    </div>
  );
}
