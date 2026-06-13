export type ClientPortalSection =
  | "dashboard"
  | "media"
  | "messages"
  | "reports"
  | "connections"
  | "profile"
  | "updates"
  | "requests"
  | "onboarding";

const CLIENT_PORTAL_BASE = "/client";
const CLIENT_DEMO_BASE = "/demo/client";

export function getClientPortalHref(
  section: ClientPortalSection,
  isPublicDemoRoute: boolean,
  suffix = "",
): string {
  const base = isPublicDemoRoute ? CLIENT_DEMO_BASE : CLIENT_PORTAL_BASE;
  return `${base}/${section}${suffix}`;
}
