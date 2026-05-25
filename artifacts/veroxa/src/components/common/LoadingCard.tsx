import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function LoadingCard({ rows = 3, title = true }: { rows?: number; title?: boolean }) {
  return (
    <Card className="bg-card border-border animate-pulse">
      {title && (
        <CardHeader className="pb-3">
          <div className="h-4 w-32 bg-muted/40 rounded" />
        </CardHeader>
      )}
      <CardContent className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-3 w-full bg-muted/30 rounded" />
        ))}
      </CardContent>
    </Card>
  );
}

export function LoadingDashboard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-md border border-border bg-muted/20 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LoadingCard rows={4} /><LoadingCard rows={4} />
      </div>
    </div>
  );
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-md border border-border overflow-hidden animate-pulse">
      <div className="h-9 bg-muted/40 border-b border-border" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-muted/10 border-b border-border last:border-b-0" />
      ))}
    </div>
  );
}

export function LoadingTimeline({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-muted/40 mt-2" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-3/4 bg-muted/40 rounded" />
            <div className="h-2 w-1/3 bg-muted/30 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
