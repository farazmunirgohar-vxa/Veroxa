import { redirect } from "next/navigation";
import { MomoClientPortal } from "../../momo-client-portal";
import {
  getServerSupabasePublicConfig,
  getServerVeroxaAccess,
} from "../../veroxa-supabase-server";

export const dynamic = "force-dynamic";

const allowedPaths = new Set([
  "/client/dashboard",
  "/client/requests",
  "/client/onboarding",
  "/client/media",
  "/client/content",
  "/client/reports",
  "/client/services",
]);

export default async function MomoClientRoute({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  const requestedPath = `/client${slug.length ? `/${slug.join("/")}` : ""}`;
  if (!allowedPaths.has(requestedPath)) redirect("/client/dashboard");

  const access = await getServerVeroxaAccess();
  if (!access) redirect(`/login?return_to=${encodeURIComponent(requestedPath)}`);
  if (access.role !== "client") redirect("/team/momo");
  if (!access.restaurantId) redirect("/login");
  const supabaseConfig = getServerSupabasePublicConfig();
  if (!supabaseConfig) redirect("/login");

  return <MomoClientPortal
    initialPath={requestedPath}
    displayName={access.displayName}
    restaurantId={access.restaurantId}
    supabaseConfig={supabaseConfig}
  />;
}
