import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Sparkles, Bell, Trophy, Heart, Users, Zap, LogOut, User as UserIcon, Settings as SettingsIcon, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsLoggedIn, useUser, useUnreadNotifications, useNotifications, useXP, useStreak } from "@/hooks/use-scope";
import { auth, notifications, meta } from "@/lib/scope-store";
import { toast } from "sonner";

const publicLinks = [
  { to: "/feed", label: "Feed" },
  { to: "/projects", label: "Projects" },
  { to: "/events", label: "Events" },
  { to: "/leaderboards", label: "Leaderboards" },
] as const;

const authedLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/feed", label: "Feed" },
  { to: "/projects", label: "Projects" },
  { to: "/events", label: "Events" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/challenges", label: "Challenges" },
  { to: "/campus", label: "Campus" },
  { to: "/leaderboards", label: "Leaderboards" },
] as const;

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
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthedRaw = useIsLoggedIn();
  const user = useUser();
  const unread = useUnreadNotifications();
  const notifs = useNotifications();
  const xp = useXP();
  const streak = useStreak();
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Treat as logged-out until client mount — keeps SSR/CSR markup identical.
  const isAuthed = mounted && isAuthedRaw;
  const links = isAuthed ? authedLinks : publicLinks;

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
    toast.success("Signed out. See you tomorrow, Builder.");
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-bold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand shadow-brand">
            <Sparkles className="h-4 w-4 text-brand-foreground" />
          </span>
          <span className="text-lg tracking-tight">
            Scope<span className="text-brand">Connect</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isAuthed && user ? (
            <>
              <div className="hidden items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground xl:flex">
                <Zap className="h-3 w-3 text-brand" /> {xp.toLocaleString()} XP
              </div>
              <div className="hidden items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground xl:flex">
                <Flame className="h-3 w-3 text-brand" /> {streak}d
              </div>

              {/* Bell */}
              <div ref={bellRef} className="relative">
                <button
                  onClick={() => { setBellOpen((v) => !v); if (!bellOpen) setTimeout(() => notifications.markAllRead(), 800); }}
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
                      {notifs.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">All quiet. Go ship something.</div>}
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

              {/* User menu */}
              <div ref={userRef} className="relative">
                <button onClick={() => setUserOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-brand-foreground shadow-brand transition-transform hover:scale-105" style={{ background: user.avatarColor }}>
                  {user.name.charAt(0).toUpperCase()}
                </button>
                {userOpen && (
                  <div className="absolute right-0 top-12 w-64 origin-top-right rounded-xl border border-border bg-popover shadow-elegant animate-scale-in">
                    <div className="border-b border-border px-4 py-3">
                      <div className="text-sm font-semibold text-foreground">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                      <div className="mt-2 flex gap-3 text-xs">
                        <span className="text-foreground"><b>{xp.toLocaleString()}</b> <span className="text-muted-foreground">XP</span></span>
                        <span className="text-foreground"><b>{streak}d</b> <span className="text-muted-foreground">streak</span></span>
                      </div>
                    </div>
                    <div className="py-1">
                      <Link to="/profile" onClick={() => setUserOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary">
                        <UserIcon className="h-4 w-4" /> Profile
                      </Link>
                      <Link to="/dashboard" onClick={() => setUserOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary">
                        <Trophy className="h-4 w-4" /> Dashboard
                      </Link>
                      <Link to="/settings" onClick={() => setUserOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary">
                        <SettingsIcon className="h-4 w-4" /> Settings
                      </Link>
                    </div>
                    <div className="border-t border-border py-1">
                      <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary">
                        <LogOut className="h-4 w-4" /> Sign out
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

        <button
          aria-label="Toggle menu"
          className="rounded-lg p-2 text-foreground lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/40 bg-background lg:hidden">
          <div className="space-y-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {link.label}
              </Link>
            ))}
            {isAuthed && user ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">Profile</Link>
                <Link to="/settings" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">Settings</Link>
                <button onClick={() => { setOpen(false); handleLogout(); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-secondary">Sign out</button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to="/auth" onClick={() => setOpen(false)}>Log in</Link>
                </Button>
                <Button asChild size="sm" className="flex-1 bg-gradient-brand text-brand-foreground">
                  <Link to="/auth" onClick={() => setOpen(false)}>Join</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

// Module-level: bump visit counter on import (safe SSR check inside)
if (typeof window !== "undefined") meta.bumpVisit();
