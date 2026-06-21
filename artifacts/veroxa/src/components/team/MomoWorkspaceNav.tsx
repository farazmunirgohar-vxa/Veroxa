import { Link, useLocation } from "wouter";

const momoWorkspaceLinks = [
  { label: "Dashboard", href: "/team/momo" },
  { label: "Work", href: "/team/momo/work" },
  { label: "Intelligence", href: "/team/momo/intelligence" },
  { label: "Content + AI", href: "/team/momo/content-ai" },
  { label: "Reports", href: "/team/momo/reports" },
  { label: "Readiness", href: "/team/momo/readiness" },
];

export function MomoWorkspaceNav() {
  const [location] = useLocation();

  return (
    <nav aria-label="Momo workspace sections" className="mb-4 rounded-xl border bg-card p-2">
      <div className="flex flex-wrap gap-2">
        {momoWorkspaceLinks.map((link) => {
          const active = location === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
