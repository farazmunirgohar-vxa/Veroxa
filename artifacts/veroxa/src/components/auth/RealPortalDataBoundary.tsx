import type React from "react";
import { useLocation } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { StillBuilding } from "@/components/StillBuilding";
import { clientPortalNavItems } from "@/lib/clientPortalNav";
import { teamPortalNavItems } from "@/lib/teamPortalNav";

interface RealPortalDataBoundaryProps {
  portal: "client" | "team";
  children: React.ReactNode;
}

const portalCopy = {
  client: {
    portalName: "Client Portal",
    area: "Client Portal",
    detail:
      "This real client route is in review while Veroxa prepares live account data. No sample restaurant data is shown here.",
  },
  team: {
    portalName: "Team Portal",
    area: "Team Command Center",
    detail:
      "This real internal route is in review while live client operations are connected. Launch benchmark fixtures stay out of the active client list.",
  },
} as const;

/**
 * RealPortalDataBoundary prevents demo/fixture data from leaking into real
 * /client/* and /team/* routes. Public demo routes are not wrapped with this
 * boundary, so /demo/client/dashboard can continue to render the sample portal.
 */
export function RealPortalDataBoundary({ portal, children }: RealPortalDataBoundaryProps) {
  const [location] = useLocation();
  const isPublicDemo = location.startsWith("/demo/");

  if (isPublicDemo) return <>{children}</>;

  const copy = portalCopy[portal];
  const items = portal === "client" ? clientPortalNavItems : teamPortalNavItems;

  return (
    <PortalLayout items={items} portalName={copy.portalName}>
      <StillBuilding area={copy.area} detail={copy.detail} />
    </PortalLayout>
  );
}
