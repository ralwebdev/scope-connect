import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-lg tracking-tight">Scope Connect</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-primary-foreground/70">
              India's campus innovation network. Build, ship, and lead with the best Gen Z builders in the country.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/feed" className="hover:text-primary-foreground">Feed</Link></li>
              <li><Link to="/campus" className="hover:text-primary-foreground">Campus Hub</Link></li>
              <li><Link to="/leaderboards" className="hover:text-primary-foreground">Leaderboards</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary-foreground">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">For</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
              <li>Members</li>
              <li>Campus Partners</li>
              <li>Mentors</li>
              <li>Recruiters</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/about" className="hover:text-primary-foreground">About Scope</Link></li>
              <li><Link to="/support" className="hover:text-primary-foreground">Support</Link></li>
              <li><Link to="/support" className="hover:text-primary-foreground">Contact</Link></li>
              <li><Link to="/about" className="hover:text-primary-foreground">National Vision</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/60 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Scope Connect. Every challenge curated. No spam, no fake listings.</p>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-primary-foreground">Privacy</Link>
            <Link to="/about" className="hover:text-primary-foreground">Terms</Link>
            <Link to="/support" className="hover:text-primary-foreground">Code of Conduct</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
