import { createContext, useContext, type ReactNode } from "react";
import { useLocation } from "wouter";

export type RealPortalKind = "client" | "team";

export interface RealPortalDataMode {
  portal: RealPortalKind;
  isPublicDemoRoute: boolean;
  isRealPortalRoute: boolean;
  isLiveDataConnected: boolean;
  allowDemoFixtures: boolean;
  showLaunchReadinessBenchmark: boolean;
  boundaryMessage: string;
}

interface RealPortalDataBoundaryProps {
  portal: RealPortalKind;
  children: ReactNode;
}

const demoMode: RealPortalDataMode = {
  portal: "client",
  isPublicDemoRoute: true,
  isRealPortalRoute: false,
  isLiveDataConnected: false,
  allowDemoFixtures: true,
  showLaunchReadinessBenchmark: true,
  boundaryMessage: "Client Demo Preview — real client data is not connected.",
};

const RealPortalDataContext = createContext<RealPortalDataMode>(demoMode);

function getBoundaryMessage(portal: RealPortalKind): string {
  if (portal === "team") {
    return "Team Portal in review — live client operations are not connected yet. Use safe empty states or clearly labeled launch-readiness benchmarks only.";
  }

  return "Client Portal in review — live account data is being prepared. No sample restaurant is shown as an active client.";
}

/**
 * RealPortalDataBoundary separates real portal shells from unsafe fixture data
 * without hiding the page shell. Public /demo/* routes keep allowing sample
 * preview records. Real /client/* and /team/* routes render their children with a
 * data-mode contract so pages can show calm empty/review states until live
 * account data is connected.
 */
export function RealPortalDataBoundary({
  portal,
  children,
}: RealPortalDataBoundaryProps) {
  const [location] = useLocation();
  const isPublicDemoRoute = location.startsWith("/demo/");
  const isRealPortalRoute = location.startsWith(`/${portal}/`);

  const mode: RealPortalDataMode = isPublicDemoRoute
    ? { ...demoMode, portal }
    : {
        portal,
        isPublicDemoRoute,
        isRealPortalRoute,
        isLiveDataConnected: false,
        allowDemoFixtures: false,
        showLaunchReadinessBenchmark: portal === "team",
        boundaryMessage: getBoundaryMessage(portal),
      };

  return (
    <RealPortalDataContext.Provider value={mode}>
      {children}
    </RealPortalDataContext.Provider>
  );
}

export function useRealPortalDataMode(): RealPortalDataMode {
  return useContext(RealPortalDataContext);
}
