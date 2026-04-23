// Lightweight identity-only Navbar.
// Per RBAC architecture: Navbar contains NO navigation menu — the Sidebar
// (RbacSidebar) is the sole navigation surface. Navbar exposes only:
//   - Logo (role-aware redirect after hydration)
//   - Notifications bell
//   - Theme toggle
//   - Profile dropdown (or auth CTAs when logged out)
//
// SSR/CSR safety: until session hydration completes, we render the
// logged-out shell. This guarantees identical server + first-client markup
// (eliminates React #418 hydration mismatches) before the role resolves.
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Bell, LogOut, Settings as SettingsIcon, Sparkles, Trophy, User as UserIcon,
  Heart, Users, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { useUserSession } from "@/hooks/use-session";
import { useUnreadNotifications, useNotifications } from "@/hooks/use-scope";
import { auth, notifications, meta } from "@/lib/scope-store";
import { useBrand } from "@/hooks/use-platform";
import { landingRouteForRole } from "@/lib/rbac";
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
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

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
    if (!session.ready) return; // honor default <Link to="/"> during hydration
    if (!session.isAuthenticated) return;
    const target = landingRouteForRole(session.role);
    if (target !== "/") {
      e.preventDefault();
      navigate({ to: target });
    }
  };

  const showAuthedUI = session.ready && session.isAuthenticated && session.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 font-bold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand shadow-brand">
            <Sparkles className="h-4 w-4 text-brand-foreground" />
          </span>
          <span className="text-lg tracking-tight">
            {brand.shortName}<span className="text-brand">{brand.accentName}</span>
          </span>
        </Link>

        {/* Spacer — no nav menu lives here, sidebar owns navigation. */}
        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {showAuthedUI ? (
            <>
              {/* Bell */}
              <div ref={bellRef} className="relative">
                <button
                  onClick={() => {
                    setBellOpen((v) => !v);
                    if (!bellOpen) setTimeout(() => notifications.markAllRead(), 800);
                  }}
                  className="relative rounded-lg p-2 text-foreground transition-colors hover:bg-secondary"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">
                      {unread}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div className="absolute right-0 top-12 w-80 origin-top-right rounded-xl border border-border bg-popover shadow-elegant animate-scale-in">
                    <div className="border-b border-border px-4 py-3">
                      <div className="text-sm font-semibold text-foreground">Notifications</div>
                      <div className="text-xs text-muted-foreground">{notifs.length} updates · auto-marked read</div>
                    </div>
                    <div className="max-h-96 divide-y divide-border overflow-y-auto">
                      {notifs.length === 0 && (
                        <div className="p-6 text-center text-sm text-muted-foreground">All quiet. Go ship something.</div>
                      )}
                      {notifs.map((n) => {
                        const Icon = ICONS[n.icon] ?? Sparkles;
                        return (
                          <div key={n.id} className="flex gap-3 px-4 py-3 transition-colors hover:bg-secondary/50">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm text-foreground">{n.text}</div>
                              <div className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.at)} ago</div>
                            </div>
                            {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div ref={userRef} className="relative">
                <button
                  onClick={() => setUserOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-brand-foreground shadow-brand transition-transform hover:scale-105"
                  style={{ background: session.user!.avatarColor }}
                  aria-label="Profile menu"
                >
                  {session.user!.name.charAt(0).toUpperCase()}
                </button>
                {userOpen && (
                  <div className="absolute right-0 top-12 w-64 origin-top-right rounded-xl border border-border bg-popover shadow-elegant animate-scale-in">
                    <div className="border-b border-border px-4 py-3">
                      <div className="text-sm font-semibold text-foreground">{session.user!.name}</div>
                      <div className="text-xs text-muted-foreground">{session.user!.email}</div>
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-brand">
                        {session.role.replace(/_/g, " ")}
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
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Log in</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-95">
                <Link to="/auth">Join Scope</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// Module-level: bump visit counter on import (safe SSR check inside)
if (typeof window !== "undefined") meta.bumpVisit();
