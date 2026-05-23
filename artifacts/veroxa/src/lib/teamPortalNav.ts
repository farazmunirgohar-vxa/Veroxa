import { CheckSquare, Image as ImageIcon, Cpu, Layers, CalendarDays } from "lucide-react";
import type { SidebarItem } from "@/components/PortalLayout";

export const teamPortalNavItems: SidebarItem[] = [
  { label: "My Tasks",     icon: CheckSquare,   href: "/demo/team/tasks"        },
  { label: "Media Review", icon: ImageIcon,     href: "/demo/team/media-review" },
  { label: "AI Review",    icon: Cpu,           href: "/demo/team/ai-review"    },
  { label: "Drafts",       icon: Layers,        href: "/demo/team/drafts"       },
  { label: "Scheduling",   icon: CalendarDays,  href: "/demo/team/scheduling"   },
];
