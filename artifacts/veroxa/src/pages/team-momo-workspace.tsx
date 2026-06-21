import { Link } from "wouter";
import { PortalLayout } from "@/components/PortalLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MomoWorkspaceNav } from "@/components/team/MomoWorkspaceNav";
import { teamPortalNavItems } from "@/lib/teamPortalNav";

const sections = [
  { title: "Work Queue", href: "/team/momo/work", body: "Daily execution links for Team Faraz." },
  { title: "Restaurant Intelligence", href: "/team/momo/intelligence", body: "Business truth, media rights, and source-of-truth review." },
  { title: "Content + AI", href: "/team/momo/content-ai", body: "Controlled internal content and AI workflow boundaries." },
  { title: "Reports + Activity", href: "/team/momo/reports", body: "Real Veroxa activity and report foundations only." },
  { title: "Readiness", href: "/team/momo/readiness", body: "Management review, blockers, and approval boundaries." },
];

export default function TeamMomoWorkspace() {
  return <PortalLayout items={teamPortalNavItems} portalName="Team Portal"><MomoWorkspaceNav /><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold tracking-tight">Momo Dashboard</h2><p className="mt-1 text-sm text-muted-foreground">Momo-only internal workspace. This does not activate the pilot.</p></div><Badge variant="outline">Team only</Badge></div><Card className="border-amber-500/30 bg-amber-500/10"><CardContent className="grid gap-1 p-4 text-sm text-amber-100"><p>This does not turn on real auth.</p><p>This does not contact Momo’s House.</p><p>This does not publish externally.</p><p>Momo owner walkthrough remains blocked.</p><p>No next activation PR is approved by default.</p><p>Future real-world activation requires separate explicit Faraz approval.</p></CardContent></Card><section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{sections.map((section) => <Card key={section.href}><CardHeader><CardTitle className="text-sm">{section.title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{section.body}</p><Button asChild className="mt-3" size="sm" variant="outline"><Link href={section.href}>Open</Link></Button></CardContent></Card>)}</section><Card className="mt-4"><CardHeader><CardTitle className="text-sm">Compatibility/detail routes</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link href="/team/control-center">Control Center</Link></Button><Button asChild size="sm" variant="outline"><Link href="/team/momo-dry-run-go-no-go">Momo Dry Run</Link></Button></CardContent></Card></PortalLayout>;
}
