import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LifeBuoy, Mail, AlertTriangle, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Scope Connect" },
      { name: "description", content: "FAQs, issue reporting, and direct contact with the Scope team." },
      { property: "og:title", content: "Scope Support" },
      { property: "og:description", content: "We're here to help you build." },
    ],
  }),
  component: SupportPage,
});

const FAQS = [
  { q: "What is Scope Connect?", a: "Scope Connect is India's home for student builders — a single platform where you find real opportunities, ship real projects, build a verified portfolio, and grow alongside the most ambitious campuses in the country." },
  { q: "Who can join Scope Connect?", a: "Any student in an Indian college or university. Whether you're a designer, developer, marketer, researcher, founder or community lead — if you build, you belong." },
  { q: "Are the projects on Scope real?", a: "Yes. Every Scope Challenge, Campus Project and Open Project is curated and posted by the Scope team or verified campus chapters. They come with real briefs, real timelines and real rewards." },
  { q: "Who creates the public projects on Scope?", a: "Every public challenge is curated and posted by the Scope team. Students and institutions cannot publicly post projects — this keeps quality high and listings trustworthy." },
  { q: "Can I submit my own idea?", a: "Yes. Use the 'Suggest an Idea' button on /projects or /dashboard. Your submission is private and reviewed by the Scope team." },
  { q: "How does XP work?", a: "Every meaningful action — applying to a project, posting an update, RSVP-ing to an event, completing your profile, maintaining a daily streak — earns XP. XP unlocks levels (Explorer → Builder → Innovator → Leader → Ambassador) and visibility across the platform." },
  { q: "How do I level up?", a: "Stack consistent actions. Most builders reach Builder tier within their first month and Innovator by month three. Your level appears on your profile, in the feed, and on every leaderboard." },
  { q: "How do campus chapters work?", a: "Each campus has a Scope chapter. Joining unlocks campus-only projects, chapter events, and a path to becoming a chapter leader. You can switch chapters anytime from your profile." },
  { q: "What if my campus isn't on Scope yet?", a: "Pick the closest match for now and tell us via /support. New chapters launch every week — we'll get yours added within 7 days." },
  { q: "Can I build a portfolio on Scope?", a: "Absolutely. Your portfolio is one of the most powerful trust signals on the platform. Add projects, designs, research, startup ideas, campaigns or certificates — public to recruiters and collaborators." },
  { q: "How are applications reviewed?", a: "Scope reviews every application within 48 hours. You'll see status updates (Under Review, Shortlisted, Accepted, Waitlisted) directly on your dashboard." },
  { q: "How are opportunities selected?", a: "We curate based on quality, relevance, and impact. Every brief is vetted — no spam recruitment, no low-effort gigs. Just real shipping opportunities for student builders." },
  { q: "Is Scope Connect free?", a: "Yes. Scope Connect is free for every student. We monetize through partner organizations and brand sponsorships, never by charging builders." },
  { q: "Is my data safe?", a: "All your activity, profile data, and submissions are stored securely. We never sell your data, and your private submissions stay private to the Scope team." },
  { q: "How do I contact the Scope team?", a: "Use the contact form below — we reply to every message within 24 hours. For urgent issues, email hello@scope.in. Partnerships: partners@scope.in. Privacy requests: privacy@scope.in." },
];

function SupportPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [issue, setIssue] = useState("");

  const submitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !message.trim()) {
      toast.error("Add a valid email and a message.");
      return;
    }
    toast.success("Got it. The Scope team replies within 24 hours.");
    setName(""); setEmail(""); setMessage("");
  };

  const submitIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim()) {
      toast.error("Tell us what went wrong.");
      return;
    }
    toast.success("Issue logged. Thanks for helping us improve.");
    setIssue("");
  };

  return (
    <AppShell>
      <section className="border-b border-border/40 bg-gradient-hero py-12 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Badge className="bg-cyan/15 text-cyan hover:bg-cyan/20"><LifeBuoy className="mr-1 h-3 w-3" /> Support</Badge>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">We're here to help you build.</h1>
          <p className="mt-2 max-w-xl text-primary-foreground/70">FAQs, issue reports, or a direct line to the Scope team — pick whichever's fastest.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-foreground">Frequently asked</h2>
        <div className="mt-4 space-y-2">
          {FAQS.map((f, i) => {
            const open = openIdx === i;
            return (
              <Card key={f.q} className="overflow-hidden">
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-secondary/40"
                >
                  <span className="text-sm font-semibold text-foreground">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">{f.a}</div>}
              </Card>
            );
          })}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-brand" />
              <h3 className="text-lg font-semibold text-foreground">Report an issue</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Bug, broken link, or anything off? Tell us.</p>
            <form onSubmit={submitIssue} className="mt-4 space-y-3">
              <div>
                <Label htmlFor="issue">What happened?</Label>
                <Textarea id="issue" value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Describe the issue…" rows={4} className="mt-1.5" />
              </div>
              <Button type="submit" className="bg-gradient-brand text-brand-foreground">Send report</Button>
            </form>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand" />
              <h3 className="text-lg font-semibold text-foreground">Contact the team</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Direct line to the humans behind Scope.</p>
            <form onSubmit={submitContact} className="mt-4 space-y-3">
              <div>
                <Label htmlFor="cname">Your name</Label>
                <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="cemail">Email</Label>
                <Input id="cemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="cmsg">Message</Label>
                <Textarea id="cmsg" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="mt-1.5" />
              </div>
              <Button type="submit" className="bg-gradient-brand text-brand-foreground">Send message</Button>
            </form>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
