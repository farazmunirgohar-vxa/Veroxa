import { VeroxaApp } from "../page";
import type { MomoReadinessTracker } from "../momo-readiness-types";
import { redirect } from "next/navigation";
import { getServerVeroxaAccess } from "../veroxa-supabase-server";

export default async function VeroxaRoute({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const initialPath = `/${slug.join("/")}`;
  const protectedTeam = initialPath.startsWith("/team/") || initialPath === "/team";
  const protectedClient = initialPath.startsWith("/client/") || initialPath === "/client";
  if (!protectedTeam && !protectedClient) return <VeroxaApp initialPath={initialPath} />;

  const access = await getServerVeroxaAccess();
  if (!access) redirect(`/login?return_to=${encodeURIComponent(initialPath)}`);
  if (protectedTeam && access.role !== "team") redirect("/client/dashboard");
  if (protectedClient && access.role !== "client") redirect("/team/momo");
  let initialMomoReadiness: MomoReadinessTracker | undefined;
  if (access.role === "team") {
    const readinessSource = await import("../momo-readiness-tracker.json");
    initialMomoReadiness = readinessSource.default as MomoReadinessTracker;
  }
  return <VeroxaApp initialPath={initialPath} initialAccess={access} initialMomoReadiness={initialMomoReadiness} />;
}
