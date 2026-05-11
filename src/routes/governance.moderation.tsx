import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Check, X, Send, ArrowLeft, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/site/AppShell";
import { AuthGate } from "@/components/site/AuthGate";
import { AccessDenied } from "@/components/site/AccessDenied";
import { useStoreValue } from "@/hooks/use-scope";
import { useRole } from "@/hooks/use-rbac";
import { useUser } from "@/hooks/use-scope";
import { governance, canModerate, canPublish, type ContentItem, type ContentStage } from "@/lib/governance-store";
import { titleOf } from "@/lib/governance-forms";
import { ROLE_LABELS } from "@/lib/rbac";
import { toast } from "sonner";

export const Route = createFileRoute("/governance/moderation")({
  head: () => ({
    meta: [
      { title: "Moderation Queue — Scope Connect" },
      { name: "description", content: "Review and publish challenges, projects and opportunities." },
    ],
  }),
  component: () => <AuthGate><Page /></AuthGate>,
});

function Page() {
  const role = useRole();
  if (!canModerate(role)) {
    return <AppShell><AccessDenied requiredPermission="manage_moderation" /></AppShell>;
  }
  return <AppShell><Queue /></AppShell>;
}

function Queue() {
  const role = useRole();
  const items = useStoreValue(() => governance.all());
  const [tab, setTab] = useState<ContentStage>("moderation_review");
  const filtered = items.filter((i) => i.stage === tab);

  const counts: Record<ContentStage, number> = {
    draft: 0, moderation_review: 0, approved: 0, published: 0, rejected: 0,
  };
  for (const i of items) counts[i.stage]++;

  return (
    <>
      <section className="border-b border-border/40 bg-gradient-hero py-10 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <Badge className="bg-cyan/15 text-cyan hover:bg-cyan/20">
              <ShieldCheck className="mr-1 h-3 w-3" /> Trust-first governance
            </Badge>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Moderation Queue</h1>
            <p className="mt-1 text-primary-foreground/70">
              Reviewing as <b>{ROLE_LABELS[role]}</b>. Creation rights ≠ publishing rights.
            </p>
          </div>
          <Button asChild variant="outline" className="border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/10">
            <Link to="/scope-super-admin"><ArrowLeft className="mr-2 h-4 w-4" /> Back to admin</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ContentStage)}>
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="moderation_review">In Review · {counts.moderation_review}</TabsTrigger>
            <TabsTrigger value="approved">Approved · {counts.approved}</TabsTrigger>
            <TabsTrigger value="published">Published · {counts.published}</TabsTrigger>
            <TabsTrigger value="draft">Drafts · {counts.draft}</TabsTrigger>
            <TabsTrigger value="rejected">Rejected · {counts.rejected}</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-6">
            {filtered.length === 0 ? (
              <Card className="flex flex-col items-center justify-center gap-2 p-10 text-muted-foreground">
                <FileText className="h-8 w-8" />
                <p>No items in this stage.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filtered.map((it) => <ItemCard key={it.id} item={it} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}

function ItemCard({ item }: { item: ContentItem }) {
  const role = useRole();
  const user = useUser();
  const [note, setNote] = useState("");
  const actor = { name: user?.name ?? "Reviewer", role };

  const act = (action: "approved" | "rejected" | "published" | "submitted") => {
    governance.transition(item.id, action, actor, note || undefined);
    toast.success(`Marked as ${action}.`);
    setNote("");
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{item.entity}</Badge>
            <Badge>{item.stage.replace("_", " ")}</Badge>
            {item.scopeTag && <Badge variant="secondary">{item.scopeTag}</Badge>}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-foreground">{titleOf(item)}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            by <b className="text-foreground">{item.createdByName}</b> · {ROLE_LABELS[item.createdByRole]} ·{" "}
            {new Date(item.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.stage === "draft" && (
            <Button size="sm" variant="outline" onClick={() => act("submitted")}>
              <Send className="mr-1.5 h-4 w-4" /> Submit for review
            </Button>
          )}
          {item.stage === "moderation_review" && (
            <>
              <Button size="sm" onClick={() => act("approved")} className="bg-success text-primary-foreground">
                <Check className="mr-1.5 h-4 w-4" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => act("rejected")}>
                <X className="mr-1.5 h-4 w-4" /> Reject
              </Button>
            </>
          )}
          {item.stage === "approved" && canPublish(role) && (
            <Button size="sm" onClick={() => act("published")} className="bg-gradient-brand text-brand-foreground">
              <ShieldCheck className="mr-1.5 h-4 w-4" /> Publish
            </Button>
          )}
        </div>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-foreground">View submission data</summary>
        <pre className="mt-2 overflow-x-auto rounded-md bg-muted/40 p-3 text-xs">
{JSON.stringify(item.data, null, 2)}
        </pre>
      </details>

      {(item.stage === "moderation_review" || item.stage === "approved") && (
        <div className="mt-3">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reviewer note (optional)…"
            rows={2}
          />
        </div>
      )}

      {item.events.length > 0 && (
        <div className="mt-4 border-t border-border/40 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audit trail</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {item.events.map((ev, i) => (
              <li key={i}>
                <b className="text-foreground">{ev.action}</b> by {ev.by} ({ROLE_LABELS[ev.byRole]}) ·{" "}
                {new Date(ev.at).toLocaleString()}
                {ev.note && <> · "{ev.note}"</>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
