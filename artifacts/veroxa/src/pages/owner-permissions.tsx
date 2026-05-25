import { Shield, Check, Eye, User, Minus } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ownerPortalNavItems } from "@/lib/ownerPortalNav";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { demoPermissionsMatrix, demoRoleResponsibilities, type RoleAccess } from "@/data/demoData";

const accessMeta: Record<RoleAccess, { color: string; icon: typeof Check; label: string }> = {
  "Full":     { color: "text-emerald-400",      icon: Check, label: "Full access"     },
  "Own Only": { color: "text-sky-400",          icon: User,  label: "Own records"     },
  "View":     { color: "text-amber-400",        icon: Eye,   label: "Read-only"       },
  "None":     { color: "text-muted-foreground", icon: Minus, label: "No access"       },
};

export default function OwnerPermissions() {
  return (
    <PortalLayout items={ownerPortalNavItems} portalName="Owner Portal">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="header-permissions">
          Permissions & Visibility
        </h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Role architecture, module access, and the visibility matrix across Client, Team,
          Operator, and Owner.
        </p>
      </div>

      <DemoOnlyBanner message="Demo only — read-only architecture documentation. No auth is changed." testId="banner-permissions" />

      {/* Role responsibilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {demoRoleResponsibilities.map((r) => (
          <Card key={r.role} className="bg-card border-border" data-testid={`role-card-${r.role.toLowerCase()}`}>
            <CardContent className="p-4">
              <Badge variant="outline" className={`text-[10px] mb-2 ${r.color}`}>{r.role}</Badge>
              <p className="text-xs text-foreground/85 leading-relaxed">{r.summary}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(Object.entries(accessMeta) as [RoleAccess, typeof accessMeta[RoleAccess]][]).map(([k, m]) => {
          const Icon = m.icon;
          return (
            <Badge key={k} variant="outline" className="text-[10px] border-border">
              <Icon className={`w-3 h-3 mr-1 ${m.color}`} />{k} — {m.label}
            </Badge>
          );
        })}
      </div>

      {/* Permissions matrix */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Visibility matrix</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm" data-testid="permissions-table">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left font-medium px-4 py-2 sticky left-0 bg-card">Module</th>
                <th className="text-center font-medium px-3 py-2">Client</th>
                <th className="text-center font-medium px-3 py-2">Team</th>
                <th className="text-center font-medium px-3 py-2">Operator</th>
                <th className="text-center font-medium px-3 py-2">Owner</th>
              </tr>
            </thead>
            <tbody>
              {demoPermissionsMatrix.map((row, i) => (
                <tr key={row.module} className={i % 2 === 0 ? "bg-muted/10" : ""}>
                  <td className="px-4 py-2 text-foreground/90 sticky left-0 bg-inherit">{row.module}</td>
                  <AccessCell access={row.client}   />
                  <AccessCell access={row.team}     />
                  <AccessCell access={row.operator} />
                  <AccessCell access={row.owner}    />
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

function AccessCell({ access }: { access: RoleAccess }) {
  const m    = accessMeta[access];
  const Icon = m.icon;
  return (
    <td className="px-3 py-2 text-center">
      <div className="inline-flex items-center gap-1 text-xs">
        <Icon className={`w-3.5 h-3.5 ${m.color}`} />
        <span className={m.color}>{access}</span>
      </div>
    </td>
  );
}
