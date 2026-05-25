import { useMemo, useState } from "react";
import { Images, Filter, Video, Image as ImageIcon, AlertTriangle, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { PageHeader, MetricTile, StatusBadge, EmptyState } from "@/components/common";
import { MediaRepository } from "@/domain/media/repository";
import { ClientRepository } from "@/domain/clients/repository";
import type { MediaStatus } from "@/domain/media/types";

const statusTone: Record<MediaStatus, "success" | "info" | "warning" | "danger" | "accent" | "neutral"> = {
  "Approved":        "success",
  "Scheduled":       "info",
  "Used":            "accent",
  "Reserved":        "info",
  "Pending Review":  "warning",
  "Blurry":          "danger",
  "Duplicate":       "neutral",
};

const captionHint: Record<MediaStatus, string> = {
  "Approved":       "Ready for captioning",
  "Scheduled":      "Caption locked",
  "Used":           "Caption archived",
  "Reserved":       "Holding for upcoming campaign",
  "Pending Review": "Awaiting review — no caption yet",
  "Blurry":         "Quality flag — reshoot before captioning",
  "Duplicate":      "Skip — duplicate angle",
};

const statusOptions: Array<MediaStatus | "all"> = [
  "all", "Approved", "Scheduled", "Used", "Reserved", "Pending Review", "Blurry", "Duplicate",
];

export default function OperatorMediaLibrary() {
  const [statusFilter, setStatusFilter] = useState<MediaStatus | "all">("all");
  const [clientFilter, setClientFilter] = useState<string>("all");

  const items = MediaRepository.list();
  const clients = ClientRepository.list();

  const filtered = useMemo(() => {
    return items.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (clientFilter !== "all" && m.clientId !== clientFilter) return false;
      return true;
    });
  }, [items, statusFilter, clientFilter]);

  const counts = useMemo(() => ({
    total:     items.length,
    approved:  items.filter((m) => m.status === "Approved").length,
    pending:   items.filter((m) => m.status === "Pending Review").length,
    scheduled: items.filter((m) => m.status === "Scheduled").length,
    quality:   items.filter((m) => m.status === "Blurry" || m.status === "Duplicate").length,
  }), [items]);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
      <PageHeader
        title="Media Library"
        description="Approved photos and videos across every client, with status, quality flags, and caption readiness."
        testId="header-media-library"
      />
      <DemoOnlyBanner
        message="Demo library — uploads, deletions, and edits are disabled. Real uploads land in Phase 4."
        testId="banner-media-library"
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <MetricTile icon={Images}         label="Total"          value={counts.total}     testId="tile-media-total" />
        <MetricTile icon={ImageIcon}      label="Approved"       value={counts.approved}  testId="tile-media-approved"  accent="text-emerald-300" />
        <MetricTile icon={Filter}         label="Pending review" value={counts.pending}   testId="tile-media-pending"   accent="text-amber-300" />
        <MetricTile icon={Video}          label="Scheduled"      value={counts.scheduled} testId="tile-media-scheduled" accent="text-sky-300" />
        <MetricTile icon={AlertTriangle}  label="Quality flags"  value={counts.quality}   testId="tile-media-quality"   accent="text-rose-300" />
      </div>

      <Card className="bg-card border-border mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Filter className="w-4 h-4 text-primary" /> Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Status</p>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as MediaStatus | "all")}>
              <SelectTrigger className="bg-muted/30 border-border" data-testid="filter-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Client</p>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="bg-muted/30 border-border" data-testid="filter-client"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Images}
          title="No media matches these filters"
          message="Try clearing a filter or switching client."
          testId="empty-media-library"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => {
            const TypeIcon: LucideIcon = m.type === "Video" ? Video : ImageIcon;
            const isQualityFlag = m.status === "Blurry" || m.status === "Duplicate";
            return (
              <Card key={m.id} className="bg-card border-border" data-testid={`media-card-${m.id}`}>
                <CardContent className="p-3 space-y-2">
                  <div className="aspect-video rounded-md bg-gradient-to-br from-muted/40 to-muted/10 border border-border/60 flex items-center justify-center">
                    <TypeIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight line-clamp-2">{m.title}</p>
                    <StatusBadge tone={statusTone[m.status]} testId={`media-status-${m.id}`}>{m.status}</StatusBadge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span data-testid={`media-client-${m.id}`}>{ClientRepository.nameOf(m.clientId)}</span>
                    <span>{m.type} · {m.dateAdded}</span>
                  </div>
                  <p className="text-[11px] text-foreground/80 line-clamp-2">
                    <span className="text-muted-foreground">Caption hint:</span> {captionHint[m.status]}
                  </p>
                  {isQualityFlag && (
                    <p className="text-[10px] text-rose-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {m.qualityNote}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
