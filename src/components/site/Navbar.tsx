import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/feed", label: "Feed" },
  { to: "/campus", label: "Campus" },
  { to: "/leaderboards", label: "Leaderboards" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-bold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand shadow-brand">
            <Sparkles className="h-4 w-4 text-brand-foreground" />
          </span>
          <span className="text-lg tracking-tight">
            Scope<span className="text-brand">Connect</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Log in</Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-95">
            <Link to="/auth">Join Scope</Link>
          </Button>
        </div>

        <button
          aria-label="Toggle menu"
          className="rounded-lg p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to="/auth" onClick={() => setOpen(false)}>Log in</Link>
              </Button>
              <Button asChild size="sm" className="flex-1 bg-gradient-brand text-brand-foreground">
                <Link to="/auth" onClick={() => setOpen(false)}>Join</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
