/**
 * Role & Permission Center — demo-only visual validation of role separation.
 * No auth changes, no backend, no login changes.
 * Source of truth: Veroxa Portal Action Matrix defined inline below.
 */
import {
  Shield, Upload, Eye, Pencil, CheckCircle2, Zap, Ban,
  Users, Building2, Cog, Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoOnlyBanner } from "@/components/DemoOnlyBanner";
import { PageHeader } from "@/components/common";

// ─── permission vocabulary ────────────────────────────────────────────────────

type Permission = "Trigger" | "Edit" | "Approve" | "View" | "Restricted";

interface PermMeta {
  label:      string;
  icon:       LucideIcon;
  chipClass:  string;
  textClass:  string;
  dotClass:   string;
}

const PERM_META: Record<Permission, PermMeta> = {
  Trigger:    { label: "Trigger",    icon: Zap,          chipClass: "bg-blue-500/10 border-blue-500/30",    textClass: "text-blue-300",    dotClass: "bg-blue-400"    },
  Edit:       { label: "Edit",       icon: Pencil,        chipClass: "bg-emerald-500/10 border-emerald-500/30", textClass: "text-emerald-300", dotClass: "bg-emerald-400" },
  Approve:    { label: "Approve",    icon: CheckCircle2,  chipClass: "bg-violet-500/10 border-violet-500/30", textClass: "text-violet-300",  dotClass: "bg-violet-400"  },
  View:       { label: "View",       icon: Eye,           chipClass: "bg-amber-500/10 border-amber-500/30",  textClass: "text-amber-300",   dotClass: "bg-amber-400"   },
  Restricted: { label: "Restricted", icon: Ban,           chipClass: "bg-muted/20 border-border/50",         textClass: "text-muted-foreground", dotClass: "bg-muted-foreground/40" },
};

// ─── role metadata ────────────────────────────────────────────────────────────

interface RoleMeta {
  label:      string;
  icon:       LucideIcon;
  themeClass: string;
  headerBg:   string;
  description: string;
  portal:     string;
}

const ROLE_META: Record<Role, RoleMeta> = {
  Client: { label: "Client", icon: Building2, themeClass: "text-sky-300", headerBg: "bg-sky-500/10 border-sky-500/30", description: "Restaurant partner", portal: "Client Portal" },
  Team: { label: "Team", icon: Users, themeClass: "text-emerald-300", headerBg: "bg-emerald-500/10 border-emerald-500/30", description: "Internal Admin command center", portal: "Team / Internal Admin Portal" },
};

const ROLES = ["Client", "Team"] as const;
type Role = typeof ROLES[number];

// ─── portal action matrix ─────────────────────────────────────────────────────
// Source of truth for role separation validation.

interface ActionRow {
  category: string;
  action:   string;
  client:   Permission;
  team:     Permission;
  note?:    string;
}

const ACTION_MATRIX: ActionRow[] = [
  // ── Client-safe progress
  { category: "Client-safe Progress", action: "View client-safe progress", client: "View", team: "Edit", note: "Client sees calm progress; Team manages the internal source of truth." },
  { category: "Client-safe Progress", action: "Upload media", client: "Trigger", team: "Edit", note: "Clients can submit assets; Team reviews quality and next use." },
  // ── Content workflow
  { category: "Content Workflow", action: "Manage content workflow", client: "Restricted", team: "Approve", note: "Team owns concepts, drafts, approval queue, and queue-for-later decisions." },
  { category: "Content Workflow", action: "Manage content health", client: "Restricted", team: "Edit", note: "Team monitors supply, freshness, and client-safe next steps." },
  // ── Reporting
  { category: "Reporting", action: "Validate weekly report", client: "View", team: "Approve", note: "Team validates report readiness before client-safe delivery." },
  { category: "Reporting", action: "Review monthly report", client: "View", team: "Approve", note: "Team/Internal Admin is the report review and approval gate." },
  // ── Internal operations
  { category: "Internal Operations", action: "Manage internal alerts", client: "Restricted", team: "Trigger", note: "Team receives and resolves internal alerts without exposing internals to clients." },
  { category: "Internal Operations", action: "Manage automation workflow", client: "Restricted", team: "Trigger", note: "Team controls automation workflow states; no live integrations are implied." },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function permissionCount(role: Role, level: Permission | Permission[]): number {
  const levels = Array.isArray(level) ? level : [level];
  return ACTION_MATRIX.filter((r) => levels.includes(r[role.toLowerCase() as keyof Pick<ActionRow, "client" | "team">] as Permission)).length;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function PermChip({ perm }: { perm: Permission }) {
  const m    = PERM_META[perm];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium whitespace-nowrap ${m.chipClass} ${m.textClass}`}>
      <Icon className="w-3 h-3 flex-shrink-0" />{m.label}
    </span>
  );
}

function CategoryDivider({ label }: { label: string }) {
  return (
    <tr className="bg-muted/30">
      <td colSpan={3} className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </td>
    </tr>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function InternalPermissions() {
  // Build category-grouped rows
  const categories = [...new Set(ACTION_MATRIX.map((r) => r.category))];

  return (
    <div className="min-h-screen bg-background text-foreground px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
      <PageHeader
        title="Role & Permission Center"
        description="Visual validation of the Veroxa role architecture — who can trigger, edit, approve, or view each portal action."
        testId="header-permissions"
      />
      <DemoOnlyBanner
        message="Demo only — this is an architecture validation tool. No auth is modified and no backend is connected."
        testId="banner-permissions"
      />

      {/* ── Role summary cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {ROLES.map((role) => {
          const meta    = ROLE_META[role];
          const Icon    = meta.icon;
          const active  = permissionCount(role, ["Trigger", "Edit", "Approve"]);
          const viewOnly = permissionCount(role, "View");
          const blocked = permissionCount(role, "Restricted");
          return (
            <Card key={role} className={`border ${meta.headerBg}`} data-testid={`role-card-${role.toLowerCase()}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md bg-muted/30 ${meta.themeClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${meta.themeClass}`}>{meta.label}</p>
                    <p className="text-[10px] text-muted-foreground">{meta.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{active}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Active</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-400">{viewOnly}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">View</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-muted-foreground">{blocked}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Blocked</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground border-t border-border/50 pt-2">{meta.portal}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Legend ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4" data-testid="legend">
        {(Object.entries(PERM_META) as [Permission, PermMeta][]).map(([k, m]) => {
          const Icon = m.icon;
          return (
            <span key={k} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium ${m.chipClass} ${m.textClass}`}>
              <Icon className="w-3 h-3" />{m.label}
              {k === "Trigger"    && <span className="text-muted-foreground font-normal">— initiate action</span>}
              {k === "Edit"       && <span className="text-muted-foreground font-normal">— modify / review</span>}
              {k === "Approve"    && <span className="text-muted-foreground font-normal">— decision authority</span>}
              {k === "View"       && <span className="text-muted-foreground font-normal">— read-only visibility</span>}
              {k === "Restricted" && <span className="text-muted-foreground font-normal">— no access</span>}
            </span>
          );
        })}
      </div>

      {/* ── Permission matrix ─────────────────────────────────────────── */}
      <Card className="bg-card border-border mb-6" data-testid="permissions-matrix">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Portal Action Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full" data-testid="matrix-table">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-2.5 w-40 sticky left-0 bg-card">Action</th>
                {ROLES.map((role) => {
                  const meta = ROLE_META[role];
                  const Icon = meta.icon;
                  return (
                    <th key={role} className="text-center px-3 py-2.5">
                      <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${meta.headerBg} ${meta.themeClass}`}>
                        <Icon className="w-3 h-3" />{role}
                      </div>
                    </th>
                  );
                })}
                <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-2.5 hidden xl:table-cell">Note</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const rows = ACTION_MATRIX.filter((r) => r.category === cat);
                return (
                  <>
                    <CategoryDivider key={`div-${cat}`} label={cat} />
                    {rows.map((row, i) => (
                      <tr key={row.action} className={i % 2 === 0 ? "bg-muted/5" : ""} data-testid={`matrix-row-${row.action.toLowerCase().replace(/\s+/g, "-")}`}>
                        <td className="px-4 py-2.5 text-[12px] font-medium text-foreground/90 sticky left-0 bg-inherit whitespace-nowrap">
                          {row.action}
                        </td>
                        <td className="px-3 py-2.5 text-center"><PermChip perm={row.client} /></td>
                        <td className="px-3 py-2.5 text-center"><PermChip perm={row.team} /></td>
                        <td className="px-4 py-2.5 text-[10px] text-muted-foreground hidden xl:table-cell max-w-xs">{row.note}</td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ── Role responsibility cards ──────────────────────────────────── */}
      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Lock className="w-4 h-4 text-primary" /> Role responsibilities
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROLE_DETAIL.map((r) => {
          const meta = ROLE_META[r.role];
          const Icon = meta.icon;
          return (
            <Card key={r.role} className={`border ${meta.headerBg}`} data-testid={`role-detail-${r.role.toLowerCase()}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${meta.themeClass}`} />
                  <span className={meta.themeClass}>{r.role}</span>
                  <span className="text-muted-foreground font-normal text-[11px]">— {r.tagline}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {r.groups.map((g) => (
                  <div key={g.label}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{g.label}</p>
                    <ul className="space-y-0.5">
                      {g.items.map((item) => (
                        <li key={item} className="text-[11px] text-foreground/75 flex items-start gap-1.5">
                          <span className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${r.dotClass}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── role detail data ─────────────────────────────────────────────────────────
// Defined below the component to keep the JSX clean.

interface RoleDetailGroup { label: string; items: string[] }
interface RoleDetail { role: Role; tagline: string; dotClass: string; groups: RoleDetailGroup[] }

const ROLE_DETAIL: RoleDetail[] = [
  {
    role: "Client", tagline: "restaurant partner", dotClass: "bg-sky-400",
    groups: [
      { label: "Can trigger", items: ["Upload media", "Send requests and input"] },
      { label: "Can view", items: ["Client-safe progress", "Own published reports", "Prepared updates"] },
      { label: "Cannot access", items: ["Internal notes", "AI assist internals", "Approval queue logic", "Team alerts"] },
    ],
  },
  {
    role: "Team", tagline: "internal admin command center", dotClass: "bg-emerald-400",
    groups: [
      { label: "Can manage", items: ["Content workflow", "Approval queue", "Report queue", "Content health"] },
      { label: "Can review", items: ["Weekly reports", "Monthly reports", "Visibility audit findings", "Prepared actions"] },
      { label: "Can control", items: ["Internal alerts", "Automation workflow states", "Queue for later / hold for later decisions"] },
    ],
  },
];
