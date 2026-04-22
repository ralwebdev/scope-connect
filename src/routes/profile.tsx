import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, Globe, Github, Twitter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/site/AppShell";
import { AuthGate } from "@/components/site/AuthGate";
import { useUser, useProfileStrength, useXP, useLevel, useStreak } from "@/hooks/use-scope";
import { auth, seedInterests } from "@/lib/scope-store";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Scope Connect" },
      { name: "description", content: "Edit your Scope Connect builder profile." },
    ],
  }),
  component: () => <AuthGate><ProfilePage /></AuthGate>,
});

const AVAILABILITY = ["Open to collab", "Building solo", "Hiring teammates", "Looking for internship"] as const;
const SUGGESTED_SKILLS = ["React", "TypeScript", "Tailwind", "Python", "ML", "Figma", "Product", "Growth", "Web3", "Rust"];

function ProfilePage() {
  const user = useUser();
  const strength = useProfileStrength();
  const xp = useXP();
  const level = useLevel();
  const streak = useStreak();

  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [campus, setCampus] = useState("");
  const [website, setWebsite] = useState("");
  const [github, setGithub] = useState("");
  const [twitter, setTwitter] = useState("");
  const [availability, setAvailability] = useState<typeof AVAILABILITY[number]>("Open to collab");
  const [skillDraft, setSkillDraft] = useState("");

  useEffect(() => {
    if (!user) return;
    setBio(user.bio); setSkills(user.skills); setInterests(user.interests); setCampus(user.campus);
    setWebsite(user.links.website ?? ""); setGithub(user.links.github ?? ""); setTwitter(user.links.twitter ?? "");
    setAvailability(user.availability);
  }, [user]);

  if (!user) return null;

  const addSkill = (s: string) => {
    const v = s.trim(); if (!v) return;
    if (skills.includes(v)) return;
    setSkills([...skills, v]); setSkillDraft("");
  };
  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));
  const toggleInterest = (t: string) => setInterests((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const save = () => {
    auth.updateProfile({ bio, skills, interests, campus, links: { website, github, twitter }, availability });
    toast.success("Profile saved. Your profile attracts collaborators.");
  };

  return (
    <AppShell>
      <section className="border-b border-border/40 bg-gradient-hero py-10 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold text-brand-foreground shadow-brand" style={{ background: user.avatarColor }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-sm text-primary-foreground/70">{user.email} · {campus}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="bg-cyan/20 text-cyan-foreground">{level.name}</Badge>
              <Badge className="bg-primary-foreground/10 text-primary-foreground">{xp.toLocaleString()} XP</Badge>
              <Badge className="bg-primary-foreground/10 text-primary-foreground">🔥 {streak}d streak</Badge>
              <Badge className="bg-primary-foreground/10 text-primary-foreground">{availability}</Badge>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground">Edit profile</h3>
          <p className="text-sm text-muted-foreground">Complete your profile to unlock {level.next} rank.</p>

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What are you building? What do you care about?" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="campus">Campus</Label>
              <Input id="campus" value={campus} onChange={(e) => setCampus(e.target.value)} className="mt-1.5" />
            </div>

            <div>
              <Label>Skills</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <button key={s} onClick={() => removeSkill(s)} className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand hover:bg-brand/20">{s} ×</button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Input value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill(skillDraft))} placeholder="Add a skill (press Enter)" />
                <Button onClick={() => addSkill(skillDraft)} variant="outline">Add</Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                  <button key={s} onClick={() => addSkill(s)} className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-[11px] text-muted-foreground hover:border-brand hover:text-brand">+ {s}</button>
                ))}
              </div>
            </div>

            <div>
              <Label>Interests</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {seedInterests.map((t) => {
                  const active = interests.includes(t);
                  return (
                    <button key={t} type="button" onClick={() => toggleInterest(t)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${active ? "border-transparent bg-gradient-brand text-brand-foreground shadow-brand" : "border-border bg-background text-muted-foreground hover:border-brand/40"}`}
                    >{t}</button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="web"><Globe className="mr-1 inline h-3 w-3" /> Website</Label>
                <Input id="web" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="gh"><Github className="mr-1 inline h-3 w-3" /> GitHub</Label>
                <Input id="gh" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="@handle" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="tw"><Twitter className="mr-1 inline h-3 w-3" /> Twitter</Label>
                <Input id="tw" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@handle" className="mt-1.5" />
              </div>
            </div>

            <div>
              <Label>Availability</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {AVAILABILITY.map((a) => (
                  <button key={a} type="button" onClick={() => setAvailability(a)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${availability === a ? "border-transparent bg-cyan/20 text-cyan-foreground" : "border-border text-muted-foreground hover:border-cyan/40"}`}
                  >{a}</button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={save} className="bg-gradient-brand text-brand-foreground"><Save className="mr-2 h-4 w-4" /> Save profile</Button>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-foreground">Profile strength</h3>
            <div className="mt-3 text-3xl font-bold text-foreground">{strength}%</div>
            <Progress value={strength} className="mt-2" />
            <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <li className={bio.length > 20 ? "text-success" : ""}>• Add a bio (20+ chars)</li>
              <li className={skills.length >= 3 ? "text-success" : ""}>• Add 3+ skills</li>
              <li className={interests.length >= 3 ? "text-success" : ""}>• Pick 3+ interests</li>
              <li className={website || github ? "text-success" : ""}>• Add a portfolio link</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-foreground">Stats</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Scope Points</span><b className="text-foreground">{xp.toLocaleString()}</b></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Level</span><b className="text-foreground">{level.name}</b></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Streak</span><b className="text-foreground">{streak} days</b></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><b className="text-foreground">{new Date(user.joinedAt).toLocaleDateString()}</b></div>
            </div>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
