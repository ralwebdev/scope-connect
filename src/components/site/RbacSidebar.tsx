// Dynamic RBAC sidebar — renders nav items based on current user permissions.
// Used inside admin portals (institution / scope / super) for consistent navigation.
import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, FolderKanban, Newspaper, Calendar, Award, User, Building2, Users, BarChart3, Brain, Shield, Settings, FileText, Megaphone, Sparkles, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/hooks/use-rbac";
import { rbac, ROLE_LABELS, type PermissionKey } from "@/lib/rbac";

type SidebarItem = {
  to: string;
  label: string;
  permission: PermissionKey;
  icon: React.ComponentType<{ className?: string }>;
  group: "main" | "institution" | "scope" | "super";
};

const ITEMS: SidebarItem[] = [
  // Main
  { to: "/dashboard", label: "Dashboard", permission: "view_dashboard", icon: LayoutDashboard, group: "main" },
  { to: "/projects", label: "Projects", permission: "view_projects", icon: FolderKanban, group: "main" },
  { to: "/feed", label: "Feed", permission: "view_feed", icon: Newspaper, group: "main" },
  { to: "/events", label: "Events", permission: "view_events", icon: Calendar, group: "main" },
  { to: "/portfolio", label: "Portfolio", permission: "view_portfolio", icon: Award, group: "main" },
  { to: "/profile", label: "Profile", permission: "manage_profile", icon: User, group: "main" },

  // Institution Admin
  { to: "/institution-admin", label: "Institution Hub", permission: "manage_institution", icon: Building2, group: "institution" },
  { to: "/institution-admin/members", label: "Members", permission: "manage_members", icon: Users, group: "institution" },
  { to: "/institution-admin/analytics", label: "Analytics", permission: "view_institution_analytics", icon: BarChart3, group: "institution" },
  { to: "/institution-admin/communications", label: "Communications", permission: "manage_content", icon: Megaphone, group: "institution" },

  // Scope Admin
  { to: "/scope-admin", label: "Territory CRM", permission: "manage_partnerships", icon: Building2, group: "scope" },
  { to: "/admin", label: "Admin Console", permission: "view_admin", icon: Shield, group: "scope" },

  // Super Admin
  { to: "/scope-super-admin", label: "Command Center", permission: "view_national_analytics", icon: Brain, group: "super" },
  { to: "/admin/config", label: "Roles & Config", permission: "manage_roles", icon: Settings, group: "super" },
  { to: "/scope-super-admin", label: "Finance", permission: "view_finance", icon: IndianRupee, group: "super" },
  { to: "/admin/config", label: "Feature Flags", permission: "manage_feature_flags", icon: Sparkles, group: "super" },
];

const GROUP_LABELS: Record<SidebarItem["group"], string> = {
  main: "Workspace",
  institution: "Institution",
  scope: "Scope Admin",
  super: "Super Admin HQ",
};

export function RbacSidebar({ children, title }: { children: ReactNode; title?: string }) {
  const role = useRole();
  const location = useLocation();
  const allowed = ITEMS.filter((it) => rbac.hasPermission(role, it.permission));
  const groups: SidebarItem["group"][] = ["main", "institution", "scope", "super"];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card/50 lg:block">
        <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto px-3 py-5">
          <div className="px-2 pb-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Signed in as</div>
            <div className="mt-1 text-sm font-bold text-foreground">{ROLE_LABELS[role]}</div>
            <Badge variant="outline" className="mt-1 text-[10px]">{allowed.length} routes</Badge>
          </div>
          {groups.map((g) => {
            const items = allowed.filter((i) => i.group === g);
            if (items.length === 0) return null;
            // dedupe by `to`
            const seen = new Set<string>();
            const unique = items.filter((i) => (seen.has(i.to) ? false : (seen.add(i.to), true)));
            return (
              <div key={g} className="mt-4">
                <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{GROUP_LABELS[g]}</div>
                <nav className="space-y-0.5">
                  {unique.map((it) => {
                    const active = location.pathname === it.to || (it.to !== "/dashboard" && location.pathname.startsWith(it.to));
                    return (
                      <Link
                        key={`${it.group}-${it.to}-${it.label}`}
                        to={it.to}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                          active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                        )}
                      >
                        <it.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{it.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        {title && (
          <div className="border-b border-border bg-card/30 px-4 py-3 lg:hidden">
            <span className="text-sm font-semibold">{title}</span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
