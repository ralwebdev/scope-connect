import { Link } from "@tanstack/react-router";
import { Sparkles, Mail, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-lg tracking-tight">Scope Connect</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-primary-foreground/70">
              India's curated campus innovation network. Every challenge verified. No spam, no fake listings.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium text-primary-foreground/85">
              <ShieldCheck className="h-3 w-3 text-cyan" /> Operated by Scope Innovation Lab
            </div>
            <a href="mailto:hello@scope.in" className="mt-3 flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <Mail className="h-3.5 w-3.5" /> hello@scope.in
            </a>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/projects" className="hover:text-primary-foreground">Projects</Link></li>
              <li><Link to="/campus" className="hover:text-primary-foreground">Campuses</Link></li>
              <li><Link to="/events" className="hover:text-primary-foreground">Events</Link></li>
              <li><Link to="/leaderboards" className="hover:text-primary-foreground">Leaderboards</Link></li>
              <li><Link to="/portfolio" className="hover:text-primary-foreground">Portfolio</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Grow</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/waitlist" className="hover:text-primary-foreground">Join waitlist</Link></li>
              <li><Link to="/refer" className="hover:text-primary-foreground">Refer & earn</Link></li>
              <li><Link to="/ambassador" className="hover:text-primary-foreground">Ambassador</Link></li>
              <li><Link to="/announcements" className="hover:text-primary-foreground">Announcements</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/about" className="hover:text-primary-foreground">About Scope</Link></li>
              <li><Link to="/contact" className="hover:text-primary-foreground">Contact</Link></li>
              <li><Link to="/contact" className="hover:text-primary-foreground">Partnerships</Link></li>
              <li><Link to="/support" className="hover:text-primary-foreground">Support</Link></li>
              <li><Link to="/feedback" className="hover:text-primary-foreground">Feedback</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/60 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Scope Innovation Lab. Built for India's campus builders.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="hover:text-primary-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-primary-foreground">Terms</Link>
            <Link to="/community-guidelines" className="hover:text-primary-foreground">Community</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
