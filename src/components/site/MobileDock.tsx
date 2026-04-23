// 📱 Mobile Bottom Dock — thumb-first navigation surface for small screens.
// Pairs with the floating Navbar (which collapses to identity-only on mobile).
// RBAC-safe: every item is filtered through the user's permissions; logged-out
// users see a minimal explore + auth dock. Hides on scroll-down, returns on
// scroll-up. Tap "+" expands a quick-actions panel (role-aware).
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Home, Search, Plus, Bell, User as UserIcon, Sparkles, Trophy, Compass,
  Users, Briefcase, Megaphone, Settings as SettingsIcon, LogIn, X,
} from "lucide-react";
import { useUserSession } from "@/hooks/use-session";
import { useUnreadNotifications } from "@/hooks/use-scope";
import { themeForRole } from "@/lib/role-theme";
import { landingRouteForRole, type PermissionKey } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type DockItem = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  permission?: PermissionKey;
  action?: "search" | "primary" | "notifications";
  badge?: number;
};

type QuickAction = {
  key: string;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: PermissionKey;
};

export function MobileDock() {
  const session = useUserSession();
  const navigate = useNavigate();
  const router = useRouterState();
  const unread = useUnreadNotifications();
  const currentPath = router.location.pathname;

  const [hidden, setHidden] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const lastY = useRef(0);
  const touchStartY = useRef<number | null>(null);

  // Scroll-aware hide/reveal
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const goingDown = y > lastY.current + 4;
        const goingUp = y < lastY.current - 4;
        if (goingDown && y > 64) setHidden(true);
        else if (goingUp || y < 24) setHidden(false);
        lastY.current = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // Swipe gestures on the dock itself (swipe up expands, swipe down collapses)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy < -32) setQuickOpen(true);
    else if (dy > 32) setQuickOpen(false);
    touchStartY.current = null;
  };

  if (!session.ready) return null;
  const roleTheme = themeForRole(session.role);

  // Build dock items based on auth + role
  const homeRoute = session.isAuthenticated ? landingRouteForRole(session.role) : "/";
  const dockItems: DockItem[] = session.isAuthenticated
    ? [
        { key: "home", label: "Home", icon: Home, to: homeRoute },
        { key: "search", label: "Discover", icon: Compass, to: "/feed" },
        { key: "primary", label: "Create", icon: Plus, action: "primary" },
        { key: "bell", label: "Inbox", icon: Bell, to: "/notifications", badge: unread },
        { key: "me", label: "Me", icon: UserIcon, to: "/profile" },
      ]
    : [
        { key: "home", label: "Home", icon: Home, to: "/" },
        { key: "explore", label: "Explore", icon: Compass, to: "/feed" },
        { key: "events", label: "Events", icon: Sparkles, to: "/events" },
        { key: "about", label: "About", icon: Trophy, to: "/about" },
        { key: "join", label: "Join", icon: LogIn, to: "/auth" },
      ];

  // Role-aware quick actions
  const quickActions: QuickAction[] = session.isAuthenticated
    ? [
        { key: "qa-projects", label: "New Project", to: "/projects", icon: Briefcase, permission: "manage_projects" },
        { key: "qa-events", label: "Browse Events", to: "/events", icon: Sparkles, permission: "view_events" },
        { key: "qa-leaders", label: "Leaderboards", to: "/leaderboards", icon: Trophy, permission: "view_leaderboards" },
        { key: "qa-campus", label: "My Campus", to: "/campus", icon: Users, permission: "view_campus" },
        { key: "qa-portfolio", label: "Portfolio", to: "/portfolio", icon: UserIcon, permission: "view_portfolio" },
        { key: "qa-feedback", label: "Feedback", to: "/feedback", icon: Megaphone, permission: "submit_feedback" },
        { key: "qa-settings", label: "Settings", to: "/settings", icon: SettingsIcon },
      ].filter((a) => !a.permission || session.canAccess(a.permission))
    : [];

  return (
    <>
      {/* Quick actions panel */}
      {quickOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm md:hidden"
          onClick={() => setQuickOpen(false)}
        >
          <div
            className="absolute inset-x-3 bottom-24 rounded-2xl border border-border/60 bg-popover/95 p-3 shadow-elegant backdrop-blur-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: `0 0 32px -8px color-mix(in oklab, ${roleTheme.glow} 35%, transparent)` }}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <div>
                <div className="text-sm font-semibold text-foreground">Quick Actions</div>
                <div className="text-[11px] text-muted-foreground">{roleTheme.dot} {roleTheme.label}</div>
              </div>
              <button
                aria-label="Close quick actions"
                onClick={() => setQuickOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.key}
                    onClick={() => {
                      setQuickOpen(false);
                      navigate({ to: a.to });
                    }}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border/40 bg-background/60 p-3 text-foreground transition-all hover:scale-[1.02] hover:border-border"
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full"
                      style={{
                        background: `color-mix(in oklab, ${roleTheme.glow} 18%, transparent)`,
                        color: roleTheme.glow,
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-medium leading-tight">{a.label}</span>
                  </button>
                );
              })}
              {quickActions.length === 0 && (
                <div className="col-span-3 px-2 py-6 text-center text-xs text-muted-foreground">
                  No quick actions available for your role.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* The dock */}
      <nav
        aria-label="Primary mobile navigation"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={cn(
          "fixed bottom-3 left-1/2 z-40 -translate-x-1/2 transition-[transform,opacity] duration-300 md:hidden",
          hidden ? "translate-y-[140%] opacity-0" : "translate-y-0 opacity-100",
        )}
        style={{ width: "min(420px, calc(100vw - 16px))" }}
      >
        <div
          className="relative flex items-center justify-between gap-1 rounded-full border border-border/60 bg-background/70 px-2 py-1.5 backdrop-blur-xl"
          style={{
            boxShadow: `0 12px 36px -12px rgba(0,0,0,0.35), 0 0 24px -8px color-mix(in oklab, ${roleTheme.glow} 30%, transparent)`,
          }}
        >
          {dockItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.to ? currentPath === item.to : false;
            const isPrimary = item.action === "primary";

            if (isPrimary) {
              return (
                <button
                  key={item.key}
                  onClick={() => setQuickOpen((v) => !v)}
                  aria-label="Open quick actions"
                  className="relative -mt-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-brand-foreground shadow-brand transition-transform hover:scale-105 active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${roleTheme.glow}, color-mix(in oklab, ${roleTheme.glow} 60%, white))`,
                    boxShadow: `0 8px 24px -6px ${roleTheme.glow}`,
                  }}
                >
                  <Plus className={cn("h-5 w-5 transition-transform", quickOpen && "rotate-45")} />
                </button>
              );
            }

            const inner = (
              <span className="relative flex flex-col items-center justify-center gap-0.5">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                    isActive ? "" : "text-foreground/70",
                  )}
                  style={
                    isActive
                      ? {
                          background: `color-mix(in oklab, ${roleTheme.glow} 18%, transparent)`,
                          color: roleTheme.glow,
                        }
                      : undefined
                  }
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.badge && item.badge > 0 ? (
                    <span
                      className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                      style={{ background: roleTheme.glow, color: roleTheme.fg }}
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "text-[9px] font-medium leading-none",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </span>
            );

            return item.to ? (
              <Link
                key={item.key}
                to={item.to}
                className="flex flex-1 items-center justify-center py-1"
                aria-label={item.label}
              >
                {inner}
              </Link>
            ) : (
              <button
                key={item.key}
                className="flex flex-1 items-center justify-center py-1"
                aria-label={item.label}
              >
                {inner}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Spacer so page content isn't covered by the dock */}
      <div aria-hidden className="h-20 w-full md:hidden" />
    </>
  );
}
