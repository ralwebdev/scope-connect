import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Rocket, Flame, Plus, ExternalLink, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/site/AppShell";
import { useStoreValue, useIsLoggedIn } from "@/hooks/use-scope";
import { projects } from "@/lib/scope-store";
import { ConfettiBurst } from "@/components/site/Effects";
import { toast } from "sonner";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Scope Connect" },
      { name: "description", content: "Browse and launch student-built projects from across India's campus network." },
    ],
  }),
  component: ProjectsPage,
});

const CATEGORIES = ["All", "AI", "Web", "Design", "Startup", "Robotics", "EdTech"] as const;
const COVERS = ["🚀", "⚡", "🎨", "🧠", "🛠️", "🌐", "📊", "🤖", "💡", "🩺"];

function ProjectsPage() {
  const isAuthed = useIsLoggedIn();
  const all = useStoreValue(() => projects.all());
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("All");
  const [open, setOpen] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problem, setProblem] = useState("");
  const [team, setTeam] = useState("");
  const [category, setCategory] = useState("AI");
  const [demoUrl, setDemoUrl] = useState("");
  const [cover, setCover] = useState(COVERS[0]);

  const filtered = filter === "All" ? all : all.filter((p) => p.category === filter);

  const launch = () => {
    if (!isAuthed) { toast.error("Sign in to launch projects."); return; }
    if (!title.trim() || !description.trim()) { toast.error("Title & description are required."); return; }
    projects.create({ title: title.trim(), description: description.trim(), problem: problem.trim(), team: team.trim() || "Solo", category, demoUrl: demoUrl.trim(), cover });
    toast.success("Project launched 🚀 +50 Scope Points awarded.");
    setConfettiKey(Date.now());
    setOpen(false);
    setTitle(""); setDescription(""); setProblem(""); setTeam(""); setDemoUrl(""); setCover(COVERS[0]);
  };

  return (
    <AppShell>
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-hero py-12 text-primary-foreground">
        <ConfettiBurst trigger={confettiKey} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge className="bg-cyan/15 text-cyan hover:bg-cyan/20"><Rocket className="mr-1 h-3 w-3" /> Builder Projects</Badge>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Projects shipping now</h1>
              <p className="mt-2 max-w-xl text-primary-foreground/70">Real builds from real students. Vote, fork, collaborate.</p>
            </div>
            <Button onClick={() => setOpen(true)} size="lg" className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-95">
              <Plus className="mr-2 h-4 w-4" /> Launch Project
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${filter === c ? "border-transparent bg-gradient-brand text-brand-foreground shadow-brand" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card className="mt-8 p-12 text-center">
            <Rocket className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-semibold text-foreground">No projects yet. Be the first builder.</h3>
            <Button onClick={() => setOpen(true)} className="mt-4 bg-gradient-brand text-brand-foreground"><Plus className="mr-2 h-4 w-4" /> Launch Project</Button>
          </Card>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Card key={p.id} className="group flex flex-col overflow-hidden hover-lift animate-fade-in">
                <div className="flex h-32 items-center justify-center bg-gradient-hero text-5xl">
                  <span className="transition-transform group-hover:scale-110">{p.cover}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{p.category}</Badge>
                    <button
                      onClick={() => projects.vote(p.id)}
                      className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold transition-all ${p.userVoted ? "border-brand bg-brand text-brand-foreground" : "border-border text-muted-foreground hover:text-brand"}`}
                    >
                      <Flame className="h-3 w-3" /> {p.votes}
                    </button>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-foreground">{p.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{p.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">by {p.author}</div>
                    {p.demoUrl && (
                      <a href={p.demoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                        Demo <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <Card className="w-full max-w-lg p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Launch a project 🚀</h3>
                <p className="text-xs text-muted-foreground">Earn +50 Scope Points instantly.</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="ptitle">Title</Label>
                <Input id="ptitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="MediMatch AI" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="pdesc">Short description</Label>
                <Textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does it do?" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="pprob">Problem solved</Label>
                <Input id="pprob" value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Symptom triage takes too long…" className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pteam">Team</Label>
                  <Input id="pteam" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="AI Builders Mumbai" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="pcat">Category</Label>
                  <select id="pcat" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="pdemo">Demo URL (optional)</Label>
                <Input id="pdemo" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://…" className="mt-1.5" />
              </div>
              <div>
                <Label>Pick a cover</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COVERS.map((c) => (
                    <button key={c} onClick={() => setCover(c)} className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-all ${cover === c ? "border-brand bg-brand/10" : "border-border hover:border-brand/40"}`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={launch} className="bg-gradient-brand text-brand-foreground">Launch (+50 XP)</Button>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
