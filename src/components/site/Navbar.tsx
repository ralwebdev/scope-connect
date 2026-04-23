// 🧊 Adaptive Floating Glass Navbar — single unified component with three
// internal cognitive layers (Identity · Progress · Actions). Replaces the
// previous bar-style navbar across every role. The Sidebar (RbacSidebar)
// remains the sole full-navigation surface; this navbar holds NO route menu.
//
// Architecture:
//   • Floating frosted-glass capsule, top-centered, role-themed glow.
//   • Scroll-aware: expands at top, collapses to a compact pill on scroll-down.
//   • SSR/CSR safe: until session hydration completes, we render the
//     logged-out shell so server + first client paint match (kills #418).
//   • RBAC: role + permissions come from useUserSession(). No role-specific
//     route links live here — only the logo redirect uses role landing route.
//   • Reactive progress: profile %, level, XP, streak update live from store.
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Bell, LogOut, Settings as SettingsIcon, Sparkles, Trophy, User as UserIcon,
  Heart, Users, Zap, Menu, Sun, Moon, Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserSession } from "@/hooks/use-session";
import {
  useUnreadNotifications, useNotifications,
} from "@/hooks/use-scope";
import { auth, notifications, meta } from "@/lib/scope-store";
import { useBrand } from "@/hooks/use-platform";
import { useTheme } from "@/hooks/use-theme";
import { landingRouteForRole } from "@/lib/rbac";
import { themeForRole } from "@/lib/role-theme";
import { RoleKpiBar } from "@/components/site/RoleKpiBar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy, spark: Sparkles, zap: Zap, users: Users, heart: Heart,
};

function timeAgo(at: number) {
  const s = Math.floor((Date.now() - at) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function Navbar() {
  const navigate = useNavigate();
  const session = useUserSession();
  const brand = useBrand();
  const unread = useUnreadNotifications();
  const notifs = useNotifications();

  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [shimmer, setShimmer] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Trigger glass shimmer once after hydration completes (gentle "alive" tell).
  useEffect(() => {
    if (!session.ready) return;
    setShimmer(true);
    const t = setTimeout(() => setShimmer(false), 1600);
    return () => clearTimeout(t);
  }, [session.ready]);

  // Scroll-adaptive sizing: collapse to compact pill past 24px, expand near top.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    let lastY = window.scrollY;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const goingDown = y > lastY;
        lastY = y;
        if (y < 8) setCollapsed(false);
        else if (goingDown && y > 32) setCollapsed(true);
        else if (!goingDown && y < 24) setCollapsed(false);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // Click-outside for popovers.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    auth.logout();
    toast.success("Signed out (secure reset). See you soon, Builder.");
    navigate({ to: "/auth", replace: true });
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (!session.ready || !session.isAuthenticated) return;
    const target = landingRouteForRole(session.role);
    if (target !== "/") {
      e.preventDefault();
      navigate({ to: target });
    }
  };

  const showAuthedUI = session.ready && session.isAuthenticated && !!session.user;
  const roleTheme = themeForRole(session.role);
  // Set --nav-glow on the capsule so child nodes can inherit it.
  const glowVar = { ["--nav-glow" as const]: roleTheme.glow } as React.CSSProperties;

  return (
    <>
      {/* Spacer keeps page content below the floating capsule (desktop only;
          on mobile the bottom dock handles nav and we hide this header). */}
      <div aria-hidden className="hidden h-20 w-full md:block" />

      <header
        className={cn(
          "fixed z-[9999] hidden transition-[top,width,padding] duration-300 ease-out md:block",
          collapsed ? "top-2" : "top-4 animate-nav-float",
        )}
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          width: collapsed
            ? "min(720px, calc(100vw - 32px))"
            : "min(1100px, calc(100vw - 32px))",
          maxWidth: "1100px",
          minWidth: "320px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={glowVar}
          className={cn(
            "relative flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-2 py-1.5 backdrop-blur-xl transition-all duration-300 sm:gap-3 sm:px-3",
            "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)]",
            shimmer && "nav-shimmer",
          )}
        >
          {/* Soft role-glow halo */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full opacity-60"
            style={{
              boxShadow: `0 0 28px -6px color-mix(in oklab, ${roleTheme.glow} 35%, transparent), inset 0 0 0 1px color-mix(in oklab, ${roleTheme.glow} 20%, transparent)`,
            }}
          />

          {/* ============ LEFT BRAIN — Identity ============ */}
          <div className="relative flex items-center gap-1.5">
            {showAuthedUI && (
              <button
                aria-label="Open navigation"
                onClick={() => {
                  // Sidebar is desktop-only and lives on workspace routes.
                  // Scroll the existing aside into view on mobile or focus it on desktop.
                  const el = document.querySelector("aside");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="hidden h-8 w-8 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-secondary lg:inline-flex"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
            <Link
              to="/"
              onClick={handleLogoClick}
              className="flex items-center gap-2 rounded-full px-1.5 py-1 font-bold text-foreground transition-transform hover:scale-[1.02]"
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-brand shadow-brand"
                style={{ boxShadow: `0 0 14px -2px ${roleTheme.glow}` }}
              >
                <Sparkles className="h-4 w-4 text-brand-foreground" />
              </span>
              {!collapsed && (
                <span className="hidden text-base tracking-tight sm:inline">
                  {brand.shortName}
                  <span className="text-brand">{brand.accentName}</span>
                </span>
              )}
            </Link>
          </div>

          {/* ============ CENTER BRAIN — Role-aware KPIs ============ */}
          {showAuthedUI && !collapsed && <RoleKpiBar role={session.role} />}

          {/* Spacer — pushes Right Brain to the edge regardless of center contents. */}
          <div className="flex-1" />

          {/* ============ RIGHT BRAIN — Actions ============ */}
          <div className="relative flex items-center gap-1">
            <ThemeQuickToggle />

            {showAuthedUI ? (
              <>
                {/* Role badge chip */}
                {!collapsed && (
                  <span
                    className="hidden items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider sm:inline-flex animate-nav-glow"
                    style={{
                      background: `color-mix(in oklab, ${roleTheme.glow} 18%, transparent)`,
                      color: roleTheme.glow,
                      border: `1px solid color-mix(in oklab, ${roleTheme.glow} 40%, transparent)`,
                    }}
                    title={`Signed in as ${roleTheme.label}`}
                  >
                    <span className="text-[10px] leading-none">{roleTheme.dot}</span>
                    {roleTheme.label}
                  </span>
                )}

                {/* Bell — opens role-aware notification center */}
                <div ref={bellRef} className="relative">
                  <button
                    onClick={() => setBellOpen((v) => !v)}
                    className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {unread > 0 && (
                      <span
                        className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                        style={{ background: roleTheme.glow, color: roleTheme.fg }}
                      >
                        {unread}
                      </span>
                    )}
                  </button>
                  {bellOpen && (
                    <div className="absolute right-0 top-12 origin-top-right animate-scale-in">
                      <RoleNotificationCenter
                        role={session.role}
                        variant="compact"
                        onItemClick={() => setBellOpen(false)}
                      />
                    </div>
                  )}
                </div>

                {/* Profile avatar */}
                <div ref={userRef} className="relative">
                  <button
                    onClick={() => setUserOpen((v) => !v)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-brand-foreground transition-transform hover:scale-105"
                    style={{
                      background: session.user!.avatarColor,
                      boxShadow: `0 0 0 2px color-mix(in oklab, ${roleTheme.glow} 60%, transparent)`,
                    }}
                    aria-label="Profile menu"
                  >
                    {session.user!.name.charAt(0).toUpperCase()}
                  </button>
                  {userOpen && (
                    <div className="absolute right-0 top-12 w-64 origin-top-right rounded-xl border border-border bg-popover shadow-elegant animate-scale-in">
                      <div className="border-b border-border px-4 py-3">
                        <div className="text-sm font-semibold text-foreground">{session.user!.name}</div>
                        <div className="text-xs text-muted-foreground">{session.user!.email}</div>
                        <div
                          className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            background: `color-mix(in oklab, ${roleTheme.glow} 18%, transparent)`,
                            color: roleTheme.glow,
                          }}
                        >
                          {roleTheme.dot} {roleTheme.label}
                        </div>
                      </div>
                      <div className="py-1">
                        <Link to="/profile" onClick={() => setUserOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary">
                          <UserIcon className="h-4 w-4" /> Profile
                        </Link>
                        <Link to="/settings" onClick={() => setUserOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary">
                          <SettingsIcon className="h-4 w-4" /> Settings
                        </Link>
                      </div>
                      <div className="border-t border-border py-1">
                        <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary">
                          <LogOut className="h-4 w-4" /> Sign out (secure reset)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="rounded-full">
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-95">
                  <Link to="/auth">Join Scope</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

/* ProgressBrain has been replaced by <RoleKpiBar/>. Student gamification
   only renders for student/viewer roles inside RoleKpiBar — admin roles
   never see XP/Level/Streak widgets, eliminating role leakage by design. */

/* -------- Right Brain — theme quick toggle (3-state) -------- */
function ThemeQuickToggle() {
  const { mode, setTheme } = useTheme();
  const next = mode === "light" ? "dark" : mode === "dark" ? "system" : "light";
  const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
  return (
    <button
      type="button"
      aria-label={`Theme: ${mode}. Click to switch to ${next}.`}
      onClick={() => setTheme(next)}
      className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
      title={`Theme: ${mode}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

// Module-level: bump visit counter on import (safe SSR check inside)
if (typeof window !== "undefined") meta.bumpVisit();
