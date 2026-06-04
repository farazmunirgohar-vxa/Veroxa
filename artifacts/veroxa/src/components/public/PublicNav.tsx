import { Link } from "wouter";

const navItems = [
  { href: "/", label: "Home", testId: "nav-link-home" },
  { href: "/free-audit", label: "Audit", testId: "nav-link-audit" },
  { href: "/login", label: "Login", testId: "nav-link-login" },
] as const;

export default function PublicNav() {
  return (
    <nav className="h-20 border-b border-border/40 flex items-center justify-center px-4 lg:px-12 backdrop-blur-md sticky top-0 z-50 bg-background/80">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground sm:gap-x-8">
        <Link href="/" className="font-bold text-foreground hover:text-primary transition-colors" data-testid="nav-link-brand">
          Veroxa
        </Link>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="hover:text-foreground transition-colors" data-testid={item.testId}>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
