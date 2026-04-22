// Retention + onboarding overlay for the dashboard.
// - Welcome modal on first visit after signup
// - Weekly mission banner (rotates by ISO week, dismissible per-week)
// - Profile completion nudge (when strength < 80%)
// All state user-action-driven; nothing recursive.

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Flame, Target, X, ArrowRight, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProfileStrength, useStreak, useUser } from "@/hooks/use-scope";

const WEEKLY_MISSIONS = [
  { title: "Apply to 1 Scope Challenge", reward: "+50 XP", icon: "🚀" },
  { title: "Add 2 portfolio items", reward: "+60 XP", icon: "🧠" },
  { title: "RSVP to a campus event", reward: "+30 XP", icon: "🎟️" },
  { title: "Comment on 3 feed posts", reward: "+20 XP", icon: "💬" },
];

function isoWeek(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function RetentionLayer() {
  const user = useUser();
  const strength = useProfileStrength();
  const streak = useStreak();

  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [missionDismissed, setMissionDismissed] = useState(true);
  const [nudgeDismissed, setNudgeDismissed] = useState(true);
  const week = isoWeek();
  const mission = WEEKLY_MISSIONS[week % WEEKLY_MISSIONS.length];

  // Hydrate dismissal state from localStorage on mount only.
  useEffect(() => {
    if (typeof window === "undefined" || !user) return;
    try {
      const seenWelcome = localStorage.getItem(`scope_welcome_${user.id}`);
      if (!seenWelcome) setWelcomeOpen(true);
      const dismissedWeek = localStorage.getItem("scope_mission_dismissed_week");
      setMissionDismissed(dismissedWeek === String(week));
      const nudgeDay = localStorage.getItem("scope_nudge_dismissed_day");
      const today = new Date().toDateString();
      setNudgeDismissed(nudgeDay === today);
    } catch { /* noop */ }
  }, [user, week]);

  const closeWelcome = () => {
    setWelcomeOpen(false);
    if (user) {
      try { localStorage.setItem(`scope_welcome_${user.id}`, "1"); } catch { /* noop */ }
    }
  };
  const dismissMission = () => {
    setMissionDismissed(true);
    try { localStorage.setItem("scope_mission_dismissed_week", String(week)); } catch { /* noop */ }
  };
  const dismissNudge = () => {
    setNudgeDismissed(true);
    try { localStorage.setItem("scope_nudge_dismissed_day", new Date().toDateString()); } catch { /* noop */ }
  };

  if (!user) return null;

  // Show only ONE primary nudge at a time (anti-spam): mission > profile nudge.
  const showMission = !missionDismissed;
  const showNudge = !showMission && !nudgeDismissed && strength < 80;

  return (
    <>
      {welcomeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm" onClick={closeWelcome}>
          <Card className="w-full max-w-md overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-hero p-6 text-primary-foreground">
              <Sparkles className="h-6 w-6 text-cyan" />
              <h2 className="mt-3 text-2xl font-bold">Welcome to India's builder network, {user.name.split(" ")[0]}.</h2>
              <p className="mt-2 text-sm text-primary-foreground/75">Let's set your growth path. Three quick wins to start strong:</p>
            </div>
            <div className="space-y-3 p-6">
              <Step n={1} title="Complete your profile" sub="+25 XP · attracts collaborators" />
              <Step n={2} title="Apply to your first Scope Challenge" sub="+20 XP · curated opportunities only" />
              <Step n={3} title="Add a portfolio item" sub="+30 XP · proof-of-work that opens doors" />
              <Button onClick={closeWelcome} size="lg" className="mt-2 w-full bg-gradient-brand text-brand-foreground shadow-brand">
                Let's go <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-center text-xs text-muted-foreground">Your first opportunity is waiting.</p>
            </div>
          </Card>
        </div>
      )}

      {(showMission || showNudge || streak >= 3) && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          {streak >= 3 && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/5 px-4 py-2 text-sm text-foreground">
              <Flame className="h-4 w-4 text-brand" />
              <span><b>{streak}-day streak.</b> You're climbing fast — keep momentum.</span>
            </div>
          )}

          {showMission && (
            <Card className="relative overflow-hidden border-cyan/30 bg-gradient-to-r from-cyan/10 via-transparent to-brand/10 p-5">
              <button onClick={dismissMission} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-secondary" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand text-2xl shadow-brand">{mission.icon}</div>
                <div className="flex-1 min-w-0">
                  <Badge className="bg-cyan text-primary"><Trophy className="mr-1 h-3 w-3" /> Weekly Scope Mission · Week {week}</Badge>
                  <h3 className="mt-1.5 text-base font-bold text-foreground">{mission.title}</h3>
                  <p className="text-xs text-muted-foreground">Reward: {mission.reward} · Resets every Monday</p>
                </div>
                <Button asChild size="sm" className="bg-gradient-brand text-brand-foreground"><Link to="/projects">Take action <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
              </div>
            </Card>
          )}

          {showNudge && (
            <Card className="relative border-brand/20 bg-secondary/40 p-4">
              <button onClick={dismissNudge} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-secondary" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
              <div className="flex flex-wrap items-center gap-4">
                <Target className="h-5 w-5 shrink-0 text-brand" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">Your profile is {strength}% complete.</div>
                  <Progress value={strength} className="mt-2 h-1.5" />
                  <p className="mt-1.5 text-xs text-muted-foreground">Strong profiles get 3× more application acceptances.</p>
                </div>
                <Button asChild size="sm" variant="outline"><Link to="/profile">Finish profile</Link></Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

function Step({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-brand-foreground">{n}</div>
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}
