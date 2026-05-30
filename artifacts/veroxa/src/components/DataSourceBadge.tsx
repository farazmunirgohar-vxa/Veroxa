/**
 * DataSourceBadge — M008
 *
 * Small, intentionally low-key indicator that shows on every client
 * portal page where DATA_MODE is not pure fixture. It exists so dev /
 * QA can spot at a glance whether the page is rendering real
 * read-only Supabase data or fixture fallback.
 *
 * Restaurant clients shouldn't see this in normal use — it only renders
 * when `source` differs from the fixture defaults.
 */

import { AUTH_MODE } from "@/lib/auth/authMode";
import type { ClientPortalSource } from "@/hooks/useClientPortalData";

export interface DataSourceBadgeProps {
  source: ClientPortalSource;
  message: string;
  className?: string;
}

export function DataSourceBadge({ source, message, className }: DataSourceBadgeProps) {
  if (AUTH_MODE === "real" || source === "fixture" || source === "demo") return null;
  return (
    <p
      className={`text-[11px] text-muted-foreground/70 mt-1 font-mono ${className ?? ""}`}
      data-testid="portal-data-source"
      title="Veroxa review status"
    >
      · {message}
    </p>
  );
}
