import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Save, Globe, Github, Twitter, Linkedin, FileText, Instagram, Plus, X, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppShell } from "@/components/site/AppShell";
import { AuthGate } from "@/components/site/AuthGate";
import { useUser, useProfileStrength, useXP, useLevel, useStreak } from "@/hooks/use-scope";
import { auth, seedInterests } from "@/lib/scope-store";
import { DOMAIN_LABELS, DOMAIN_KEYS, SPECIALIZATIONS, DOMAIN_PORTFOLIO_FIELDS, humanize, type DomainKey } from "@/lib/portfolio-domains";
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

  // Dynamic portfolio extension state
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioWebsite, setPortfolioWebsite] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [portfolioPdfUrl, setPortfolioPdfUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [primaryDomain, setPrimaryDomain] = useState<DomainKey | "">("");
  const [specialization, setSpecialization] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState<Record<string, string>>({});
  const [customKey, setCustomKey] = useState("");
  const [customUrl, setCustomUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    setBio(user.bio); setSkills(user.skills); setInterests(user.interests); setCampus(user.campus);
    setWebsite(user.links.website ?? ""); setGithub(user.links.github ?? ""); setTwitter(user.links.twitter ?? "");
    setAvailability(user.availability);
    setLinkedinUrl(user.linkedinUrl ?? "");
    setPortfolioWebsite(user.portfolioWebsite ?? "");
    setResumeUrl(user.resumeUrl ?? "");
    setPortfolioPdfUrl(user.portfolioPdfUrl ?? "");
    setInstagramUrl(user.instagramUrl ?? "");
    setPrimaryDomain((user.primaryDomain as DomainKey) ?? "");
    setSpecialization(user.specialization ?? "");
    setPortfolioLinks(user.portfolioLinks ?? {});
  }, [user]);

  const domainFields = useMemo(
    () => (primaryDomain ? DOMAIN_PORTFOLIO_FIELDS[primaryDomain] : []),
    [primaryDomain],
  );
  const specializations = useMemo(
    () => (primaryDomain ? SPECIALIZATIONS[primaryDomain] : []),
    [primaryDomain],
  );

  if (!user) return null;

  const isValidUrl = (v: string) => {
    if (!v) return true;
    try { new URL(v.startsWith("http") ? v : `https://${v}`); return true; } catch { return false; }
  };

  const addSkill = (s: string) => {
    const v = s.trim(); if (!v) return;
    if (skills.includes(v)) return;
    setSkills([...skills, v]); setSkillDraft("");
  };
  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));
  const toggleInterest = (t: string) => setInterests((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const setPortfolioLink = (key: string, val: string) => {
    setPortfolioLinks((prev) => {
      const next = { ...prev };
      if (!val.trim()) delete next[key]; else next[key] = val.trim();
      return next;
    });
  };

  const addCustomLink = () => {
    const k = customKey.trim().toLowerCase().replace(/\s+/g, "_");
    const v = customUrl.trim();
    if (!k || !v) return toast.error("Add both a label and URL");
    if (!isValidUrl(v)) return toast.error("Enter a valid URL");
    if (portfolioLinks[k]) return toast.error("That label already exists");
    setPortfolioLinks({ ...portfolioLinks, [k]: v });
    setCustomKey(""); setCustomUrl("");
  };

  const save = () => {
    // Validate all URL-ish fields
    const urlChecks: Array<[string, string]> = [
      ["Website", website], ["LinkedIn", linkedinUrl], ["Portfolio", portfolioWebsite],
      ["Resume", resumeUrl], ["Portfolio PDF", portfolioPdfUrl], ["Instagram", instagramUrl],
      ...Object.entries(portfolioLinks).map(([k, v]) => [humanize(k), v] as [string, string]),
    ];
    for (const [name, val] of urlChecks) {
      if (val && !isValidUrl(val)) return toast.error(`${name} URL is invalid`);
    }
    auth.updateProfile({
      bio, skills, interests, campus,
      links: { website, github, twitter },
      availability,
      linkedinUrl, portfolioWebsite, resumeUrl, portfolioPdfUrl, instagramUrl,
      primaryDomain: primaryDomain || undefined,
      specialization: specialization || undefined,
      portfolioLinks,
    });
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

            {/* ---- Showcase Your Work (dynamic portfolio) ---- */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand" />
                <h4 className="text-sm font-semibold text-foreground">Showcase Your Work</h4>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Add links that prove what you can build, design, or create.</p>

              {/* Universal fields */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="li"><Linkedin className="mr-1 inline h-3 w-3" /> LinkedIn <span className="text-[10px] text-brand">recommended</span></Label>
                  <Input id="li" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/…" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="pw"><Globe className="mr-1 inline h-3 w-3" /> Portfolio Website</Label>
                  <Input id="pw" value={portfolioWebsite} onChange={(e) => setPortfolioWebsite(e.target.value)} placeholder="https://" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="rs"><FileText className="mr-1 inline h-3 w-3" /> Resume URL</Label>
                  <Input id="rs" value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} placeholder="https://drive.google.com/…" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="pdf"><FileText className="mr-1 inline h-3 w-3" /> Portfolio PDF</Label>
                  <Input id="pdf" value={portfolioPdfUrl} onChange={(e) => setPortfolioPdfUrl(e.target.value)} placeholder="https://" className="mt-1.5" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="ig"><Instagram className="mr-1 inline h-3 w-3" /> Instagram (optional)</Label>
                  <Input id="ig" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/…" className="mt-1.5" />
                </div>
              </div>

              {/* Domain + specialization */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Primary Domain</Label>
                  <Select value={primaryDomain} onValueChange={(v) => { setPrimaryDomain(v as DomainKey); setSpecialization(""); }}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select your domain" /></SelectTrigger>
                    <SelectContent>
                      {DOMAIN_KEYS.map((k) => <SelectItem key={k} value={k}>{DOMAIN_LABELS[k]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Specialization</Label>
                  <Select value={specialization} onValueChange={setSpecialization} disabled={!primaryDomain}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder={primaryDomain ? "Select specialization" : "Pick a domain first"} /></SelectTrigger>
                    <SelectContent>
                      {specializations.map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Domain-specific portfolio fields */}
              {primaryDomain && domainFields.length > 0 && (
                <div className="mt-5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">{DOMAIN_LABELS[primaryDomain]} links</Label>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {domainFields.map((f) => (
                      <div key={f}>
                        <Label htmlFor={`pf-${f}`} className="text-xs">{humanize(f)}</Label>
                        <Input id={`pf-${f}`} value={portfolioLinks[f] ?? ""} onChange={(e) => setPortfolioLink(f, e.target.value)} placeholder="https://" className="mt-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom links */}
              <div className="mt-5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Custom links</Label>
                {Object.keys(portfolioLinks).filter((k) => !domainFields.includes(k)).length === 0 && !primaryDomain && (
                  <p className="mt-1 text-xs text-muted-foreground">No portfolio links added yet. Add your work to stand out.</p>
                )}
                <div className="mt-2 space-y-2">
                  {Object.entries(portfolioLinks)
                    .filter(([k]) => !domainFields.includes(k))
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2">
                        <Badge variant="secondary" className="shrink-0">{humanize(k)}</Badge>
                        <Input value={v} onChange={(e) => setPortfolioLink(k, e.target.value)} className="flex-1" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setPortfolioLink(k, "")}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input value={customKey} onChange={(e) => setCustomKey(e.target.value)} placeholder="Label (e.g. Notion)" className="sm:max-w-[180px]" />
                  <Input value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="https://" className="flex-1" />
                  <Button type="button" variant="outline" onClick={addCustomLink}><Plus className="mr-1 h-4 w-4" /> Add</Button>
                </div>
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
