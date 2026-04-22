import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { interestTags } from "@/lib/mock-data";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Join Scope Connect — Sign up" },
      { name: "description", content: "Create your Scope Connect builder profile and join India's campus innovation network." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (t: string) =>
    setSelectedInterests((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Frontend-only demo: skip straight to dashboard.
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-hero text-primary-foreground lg:block">
        <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />
        <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-brand/30 blur-3xl animate-pulse-glow" />
        <div className="pointer-events-none absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-cyan/20 blur-3xl animate-pulse-glow" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-lg tracking-tight">Scope Connect</span>
          </Link>

          <div>
            <h2 className="text-balance text-4xl font-bold leading-tight">
              Welcome to India's
              <br />
              <span className="text-cyan">campus innovation network.</span>
            </h2>
            <p className="mt-4 max-w-md text-primary-foreground/70">
              12,000+ builders. 142 campuses. One ecosystem for projects, hackathons, leadership, and hiring.
            </p>
            <div className="mt-8 flex gap-6">
              {[
                { v: "12.4k", l: "Members" },
                { v: "142", l: "Campuses" },
                { v: "3.2k", l: "Projects" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl font-bold">{s.v}</div>
                  <div className="text-xs text-primary-foreground/60">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-primary-foreground/50">© Scope Connect</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center bg-background px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 font-bold lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-brand-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>Scope Connect</span>
          </Link>

          <div className="mb-6 flex rounded-xl bg-secondary p-1">
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === "signup" ? "bg-background text-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              Create account
            </button>
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === "login" ? "bg-background text-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              Log in
            </button>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {mode === "signup" ? "Build your profile" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Takes less than a minute. Start earning Scope Points today."
              : "Pick up where you left off."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" placeholder="Aarav Mehta" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="campus">Campus</Label>
                  <Input id="campus" placeholder="IIT Bombay" required className="mt-1.5" />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@campus.edu" required className="mt-1.5" />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" required className="mt-1.5" />
            </div>

            {mode === "signup" && (
              <div>
                <Label>Pick your interests</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {interestTags.map((t) => {
                    const active = selectedInterests.includes(t);
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => toggleInterest(t)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          active
                            ? "border-transparent bg-gradient-brand text-brand-foreground shadow-brand"
                            : "border-border bg-background text-muted-foreground hover:border-brand/40 hover:text-foreground"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-95">
              {mode === "signup" ? "Create account" : "Log in"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By continuing you agree to our Terms & Code of Conduct.
            </p>
          </form>

          <Card className="mt-6 border-dashed bg-secondary/40 p-4">
            <div className="flex items-start gap-3">
              <Badge className="bg-cyan/15 text-cyan-foreground">Demo</Badge>
              <p className="text-xs text-muted-foreground">
                This is a frontend preview. Connect Lovable Cloud later to enable real authentication, profiles, and persistence.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
