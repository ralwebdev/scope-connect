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
  { q: "Who creates the public projects on Scope?", a: "Every public challenge is curated and posted by the Scope team. Students and institutions cannot publicly post projects — this keeps quality high and listings trustworthy." },
  { q: "Can I submit my own idea?", a: "Yes. Use the 'Suggest an Idea' button on /projects or /dashboard. Your submission is private and reviewed by the Scope team." },
  { q: "How are applications reviewed?", a: "Scope reviews every application within 48 hours. You'll see status updates (Under Review, Shortlisted, Accepted) directly on your dashboard." },
  { q: "Is my data safe?", a: "All your activity, profile data, and submissions are stored securely in your browser for this MVP. We never publish private data." },
  { q: "How do I earn XP and level up?", a: "Every meaningful action — applying, posting, RSVP-ing, completing your profile — earns XP. Levels unlock perks and visibility." },
  { q: "What happens when I join a chapter?", a: "You unlock campus-exclusive opportunities, chapter-only events, and a path to becoming a chapter leader." },
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
