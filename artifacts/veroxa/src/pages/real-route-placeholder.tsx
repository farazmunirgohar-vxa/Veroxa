import type { ReactNode } from "react";
import { StillBuilding } from "@/components/StillBuilding";
import type { VeroxaRole } from "@/lib/auth/authContract";

interface RealRoutePlaceholderProps {
  role: VeroxaRole;
  /** Short, human-readable area name, e.g. "Dashboard", "Media Library". */
  area: string;
  /** Future real route this placeholder reserves, e.g. "/client/dashboard". */
  futurePath?: string;
  /** Optional one-line description of what this section will do once ready. */
  description?: string;
  /** Optional future-authenticated children, passed straight through when present. */
  children?: ReactNode;
}

/**
 * RealRoutePlaceholder — reusable holder for a real `/client/*` or `/team/*`
 * section that is not finished yet.
 *
 * It renders the calm "Still Building" card inside the real route. It never
 * links to, promotes, or redirects to a demo route. When children are provided
 * (future authenticated content), they render straight through.
 */
export function RealRoutePlaceholder({
  area,
  description,
  children,
}: RealRoutePlaceholderProps) {
  if (children) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <StillBuilding area={area} detail={description} />
      </div>
    </div>
  );
}
