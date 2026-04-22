// Role-first sidebar blueprints. Each role gets a structurally different
// mental model of the app — not just filtered visibility. Permissions act
// as a SECONDARY filter to hide individual items the user cannot access.
//
// Add a new role by appending to ROLE_BLUEPRINTS. If a role has no blueprint,
// the sidebar falls back to a minimal "Workspace" view.

import {
  LayoutDashboard, FolderKanban, Newspaper, Calendar, Award, User,
  Building2, Users, BarChart3, Brain, Shield, Settings, Megaphone,
  Sparkles, IndianRupee, ShieldCheck, Wrench, Target, MapPin, Handshake,
  GraduationCap, ClipboardList, TrendingUp, LifeBuoy, Briefcase, FileText,
  Network, Lock,
} from "lucide-react";
import type { PermissionKey, RoleId } from "@/lib/rbac";

export type SidebarItem = {
  to: string;
  label: string;
  permission: PermissionKey;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

export type SidebarGroup = {
  id: string;
  label: string;
  items: SidebarItem[];
};

export type SidebarBlueprint = {
  layout: string;
  groups: SidebarGroup[];
};

// ---------- SUPER ADMIN — system control tower ----------
const SUPER_ADMIN_BLUEPRINT: SidebarBlueprint = {
  layout: "full_system_control",
  groups: [
    {
      id: "system-overview",
      label: "System Overview",
      items: [
        { to: "/scope-super-admin", label: "Command Center", permission: "view_national_analytics", icon: Brain },
        { to: "/dashboard", label: "My Workspace", permission: "view_dashboard", icon: LayoutDashboard },
      ],
    },
    {
      id: "rbac-security",
      label: "RBAC & Security",
      items: [
        { to: "/scope-super-admin/rbac-audit", label: "RBAC Audit", permission: "manage_roles", icon: ShieldCheck },
        { to: "/admin/config", label: "Roles & Config", permission: "manage_roles", icon: Lock },
      ],
    },
    {
      id: "institutions-network",
      label: "Institutions Network",
      items: [
        { to: "/scope-admin", label: "Territory CRM", permission: "manage_partnerships", icon: Network },
        { to: "/institution-admin", label: "Institution Hub", permission: "manage_institution", icon: Building2 },
      ],
    },
    {
      id: "financial-control",
      label: "Financial Control",
      items: [
        { to: "/scope-super-admin", label: "Finance Overview", permission: "view_finance", icon: IndianRupee },
      ],
    },
    {
      id: "academic-engine",
      label: "Academic Engine",
      items: [
        { to: "/projects", label: "Projects", permission: "view_projects", icon: FolderKanban },
        { to: "/events", label: "Events", permission: "view_events", icon: Calendar },
        { to: "/feed", label: "Feed", permission: "view_feed", icon: Newspaper },
      ],
    },
    {
      id: "users-roles",
      label: "Users & Roles",
      items: [
        { to: "/admin", label: "Admin Console", permission: "view_admin", icon: Shield },
      ],
    },
    {
      id: "analytics-insights",
      label: "Analytics & Insights",
      items: [
        { to: "/institution-admin/analytics", label: "Analytics", permission: "view_institution_analytics", icon: BarChart3 },
      ],
    },
    {
      id: "dev-tools",
      label: "Dev Tools",
      items: [
        { to: "/dev/build-diagnostics", label: "Build Diagnostics", permission: "full_system_access", icon: Wrench },
        { to: "/admin/config", label: "Feature Flags", permission: "manage_feature_flags", icon: Sparkles },
      ],
    },
  ],
};

// ---------- SCOPE ADMIN — field operations focus ----------
const SCOPE_ADMIN_BLUEPRINT: SidebarBlueprint = {
  layout: "field_operations_focus",
  groups: [
    {
      id: "my-pipeline",
      label: "My Pipeline",
      items: [
        { to: "/scope-admin", label: "Pipeline Board", permission: "manage_partnerships", icon: Target },
        { to: "/dashboard", label: "Today", permission: "view_dashboard", icon: LayoutDashboard },
      ],
    },
    {
      id: "institutions",
      label: "Institutions I Manage",
      items: [
        { to: "/scope-admin", label: "Territory CRM", permission: "manage_partnerships", icon: Building2 },
        { to: "/institution-admin", label: "Institution Hub", permission: "manage_institution", icon: Network },
      ],
    },
    {
      id: "admissions-ops",
      label: "Admissions Operations",
      items: [
        { to: "/admin", label: "Admin Console", permission: "view_admin", icon: ClipboardList },
        { to: "/admin/campuses/new", label: "New Campus", permission: "manage_campuses", icon: Building2 },
      ],
    },
    {
      id: "outreach",
      label: "Lead & Outreach",
      items: [
        { to: "/institution-admin/communications", label: "Communications", permission: "manage_content", icon: Megaphone },
        { to: "/events", label: "Outreach Events", permission: "manage_events", icon: Calendar },
      ],
    },
    {
      id: "visits-mou",
      label: "Visits & MoU Tracking",
      items: [
        { to: "/scope-admin", label: "Visits & MoUs", permission: "manage_partnerships", icon: Handshake },
      ],
    },
    {
      id: "performance",
      label: "Performance Dashboard",
      items: [
        { to: "/institution-admin/analytics", label: "My Analytics", permission: "view_institution_analytics", icon: TrendingUp },
      ],
    },
  ],
};

// ---------- INSTITUTIONAL ADMIN — single-institution control ----------
const INSTITUTIONAL_ADMIN_BLUEPRINT: SidebarBlueprint = {
  layout: "single_institution_control",
  groups: [
    {
      id: "institution-overview",
      label: "Institution Overview",
      items: [
        { to: "/institution-admin", label: "Overview", permission: "manage_institution", icon: Building2 },
        { to: "/dashboard", label: "Dashboard", permission: "view_dashboard", icon: LayoutDashboard },
      ],
    },
    {
      id: "admissions",
      label: "Admissions",
      items: [
        { to: "/institution-admin/members", label: "Applicants", permission: "approve_students", icon: ClipboardList },
      ],
    },
    {
      id: "students",
      label: "Students",
      items: [
        { to: "/institution-admin/members", label: "Members", permission: "manage_members", icon: Users },
        { to: "/portfolio", label: "Portfolios", permission: "view_portfolio", icon: Award },
      ],
    },
    {
      id: "faculty-classes",
      label: "Faculty & Classes",
      items: [
        { to: "/institution-admin/members", label: "Faculty", permission: "approve_leaders", icon: GraduationCap },
        { to: "/projects", label: "Class Projects", permission: "view_projects", icon: FolderKanban },
      ],
    },
    {
      id: "placements",
      label: "Placements",
      items: [
        { to: "/portfolio", label: "Portfolios", permission: "view_portfolio", icon: Briefcase },
      ],
    },
    {
      id: "communications",
      label: "Communications",
      items: [
        { to: "/institution-admin/communications", label: "Announcements", permission: "manage_content", icon: Megaphone },
        { to: "/feed", label: "Campus Feed", permission: "view_feed", icon: Newspaper },
        { to: "/events", label: "Events", permission: "manage_events", icon: Calendar },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      items: [
        { to: "/institution-admin/analytics", label: "Analytics", permission: "view_institution_analytics", icon: BarChart3 },
      ],
    },
    {
      id: "support",
      label: "Support & Requests",
      items: [
        { to: "/profile", label: "My Profile", permission: "manage_profile", icon: User },
      ],
    },
  ],
};

// ---------- FACULTY / CAMPUS LEADER — lightweight workspace ----------
const FACULTY_BLUEPRINT: SidebarBlueprint = {
  layout: "campus_workspace",
  groups: [
    {
      id: "workspace",
      label: "My Workspace",
      items: [
        { to: "/dashboard", label: "Dashboard", permission: "view_dashboard", icon: LayoutDashboard },
        { to: "/campus", label: "My Campus", permission: "manage_campus", icon: MapPin },
      ],
    },
    {
      id: "students",
      label: "Students",
      items: [
        { to: "/institution-admin/members", label: "Members", permission: "manage_members", icon: Users },
      ],
    },
    {
      id: "academics",
      label: "Academics",
      items: [
        { to: "/projects", label: "Projects", permission: "view_projects", icon: FolderKanban },
        { to: "/events", label: "Events", permission: "view_events", icon: Calendar },
        { to: "/feed", label: "Feed", permission: "view_feed", icon: Newspaper },
      ],
    },
    {
      id: "profile",
      label: "Profile",
      items: [
        { to: "/profile", label: "My Profile", permission: "manage_profile", icon: User },
      ],
    },
  ],
};

// ---------- STUDENT / VIEWER — minimal builder workspace ----------
const STUDENT_BLUEPRINT: SidebarBlueprint = {
  layout: "builder_workspace",
  groups: [
    {
      id: "workspace",
      label: "Workspace",
      items: [
        { to: "/dashboard", label: "Dashboard", permission: "view_dashboard", icon: LayoutDashboard },
        { to: "/projects", label: "Projects", permission: "view_projects", icon: FolderKanban },
        { to: "/feed", label: "Feed", permission: "view_feed", icon: Newspaper },
        { to: "/events", label: "Events", permission: "view_events", icon: Calendar },
      ],
    },
    {
      id: "me",
      label: "Me",
      items: [
        { to: "/portfolio", label: "Portfolio", permission: "view_portfolio", icon: Award },
        { to: "/profile", label: "Profile", permission: "manage_profile", icon: User },
      ],
    },
  ],
};

// ---------- GENERIC ADMIN — regional/campus/content/growth/support ----------
const GENERIC_ADMIN_BLUEPRINT: SidebarBlueprint = {
  layout: "generic_admin",
  groups: [
    {
      id: "workspace",
      label: "Workspace",
      items: [
        { to: "/dashboard", label: "Dashboard", permission: "view_dashboard", icon: LayoutDashboard },
        { to: "/admin", label: "Admin Console", permission: "view_admin", icon: Shield },
      ],
    },
    {
      id: "operations",
      label: "Operations",
      items: [
        { to: "/admin/campuses/new", label: "Campuses", permission: "manage_campuses", icon: Building2 },
        { to: "/projects", label: "Projects", permission: "manage_projects", icon: FolderKanban },
        { to: "/feed", label: "Feed", permission: "manage_feed", icon: Newspaper },
        { to: "/events", label: "Events", permission: "manage_events", icon: Calendar },
        { to: "/institution-admin/communications", label: "Content", permission: "manage_content", icon: FileText },
      ],
    },
    {
      id: "insights",
      label: "Insights",
      items: [
        { to: "/institution-admin/analytics", label: "Analytics", permission: "view_analytics", icon: BarChart3 },
      ],
    },
    {
      id: "support",
      label: "Support",
      items: [
        { to: "/support", label: "Support Queue", permission: "manage_support", icon: LifeBuoy },
      ],
    },
  ],
};

export const ROLE_BLUEPRINTS: Partial<Record<RoleId, SidebarBlueprint>> = {
  super_admin: SUPER_ADMIN_BLUEPRINT,
  scope_super_admin: SUPER_ADMIN_BLUEPRINT,
  scope_admin: SCOPE_ADMIN_BLUEPRINT,
  institutional_admin: INSTITUTIONAL_ADMIN_BLUEPRINT,
  faculty_coordinator: FACULTY_BLUEPRINT,
  campus_leader: FACULTY_BLUEPRINT,
  student: STUDENT_BLUEPRINT,
  viewer: STUDENT_BLUEPRINT,
  regional_admin: GENERIC_ADMIN_BLUEPRINT,
  campus_admin: GENERIC_ADMIN_BLUEPRINT,
  content_admin: GENERIC_ADMIN_BLUEPRINT,
  growth_admin: GENERIC_ADMIN_BLUEPRINT,
  support_admin: GENERIC_ADMIN_BLUEPRINT,
};

export const FALLBACK_BLUEPRINT: SidebarBlueprint = {
  layout: "fallback",
  groups: [
    {
      id: "workspace",
      label: "Workspace",
      items: [
        { to: "/dashboard", label: "Dashboard", permission: "view_dashboard", icon: LayoutDashboard },
      ],
    },
  ],
};

export function blueprintForRole(role: RoleId): SidebarBlueprint {
  return ROLE_BLUEPRINTS[role] ?? FALLBACK_BLUEPRINT;
}
