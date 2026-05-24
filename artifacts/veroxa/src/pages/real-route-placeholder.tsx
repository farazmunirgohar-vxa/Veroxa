import type { ReactNode } from "react";
import { RequireRole } from "@/components/auth/RequireRole";
import type { VeroxaRole } from "@/lib/auth/authContract";

interface RealRoutePlaceholderProps {
  role: VeroxaRole;
  /** Short, human-readable area name, e.g. "Dashboard", "Media Library". */
  area: string;
  /** Future real route this placeholder reserves, e.g. "/client/dashboard". */
  futurePath: string;
  /** Companion demo route to preview today, e.g. "/demo/client/dashboard". */
  demoPath: string;
  /**
   * Optional one-line description of what this route will do once auth
   * ships. When omitted, `RequireRole` renders its default copy
   * (including the `required-role` testid) — leaving the existing
   * protected-route-preview behavior untouched.
   */
  description?: string;
  /** Optional future-authenticated children. Not rendered today because placeholder auth is unauthenticated. */
  children?: ReactNode;
}

/**
 * RealRoutePlaceholder — reusable wrapper for every future `/client/*`,
 * `/team/*`, `/operator/*`, `/owner/*` route.
 *
 * Today, placeholder auth is always unauthenticated, so this only ever
 * renders the `RequireRole` "Protected Route Preview" card. Once real
 * auth ships, the same component will pass `children` straight through
 * for authenticated users of the matching role.
 *
 * The `area`, `futurePath`, and `demoPath` props are kept on the
 * component (even though they are not currently shown in the preview
 * card) so that:
 *   - the central real-route registry (`src/lib/realRoutes.ts`) wires
 *     metadata explicitly,
 *   - future iterations can surface "Preview the demo at {demoPath}"
 *     links without touching every page,
 *   - tests have a stable place to assert what each placeholder reserves.
 */
export function RealRoutePlaceholder({
  role,
  area: _area,
  futurePath: _futurePath,
  demoPath: _demoPath,
  description,
  children,
}: RealRoutePlaceholderProps) {
  // Only forward `description` when the caller explicitly set one, so
  // that the default `RequireRole` copy (and its `required-role` testid)
  // is preserved for the existing placeholder pages. `area`, `futurePath`,
  // and `demoPath` are kept on the props for the route registry and
  // future iterations, but are intentionally not rendered today.
  return (
    <RequireRole role={role} {...(description ? { description } : {})}>
      {children ?? <></>}
    </RequireRole>
  );
}
