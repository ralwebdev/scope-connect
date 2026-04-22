import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, Share2, PartyPopper, Image as ImageIcon, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/site/AppShell";
import { feedPosts as initialPosts } from "@/lib/mock-data";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Scope Feed — Scope Connect" },
      { name: "description", content: "Live activity feed from India's campus innovation network." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const [posts, setPosts] = useState(initialPosts);
  const [draft, setDraft] = useState("");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [celebrated, setCelebrated] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => {
    setLiked((p) => ({ ...p, [id]: !p[id] }));
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, likes: p.likes + (liked[id] ? -1 : 1) } : p)));
  };
  const toggleCelebrate = (id: string) => {
    setCelebrated((p) => ({ ...p, [id]: !p[id] }));
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, celebrates: p.celebrates + (celebrated[id] ? -1 : 1) } : p)));
  };

  const submit = () => {
    if (!draft.trim()) return;
    setPosts((ps) => [
      {
        id: String(Date.now()),
        author: "You",
        campus: "IIT Bombay",
        time: "now",
        type: "Achievement",
        content: draft.trim(),
        likes: 0,
        comments: 0,
        celebrates: 0,
      },
      ...ps,
    ]);
    setDraft("");
  };

  return (
    <AppShell>
      <section className="border-b border-border/40 bg-secondary/40 py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Scope Feed</h1>
          <p className="mt-1 text-sm text-muted-foreground">What India's campus builders are shipping right now.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Composer */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-brand-foreground">
              Y
            </div>
            <div className="flex-1">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Share an achievement, project, or milestone…"
                className="min-h-[80px] resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              />
              <div className="mt-3 flex items-center justify-between">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ImageIcon className="mr-2 h-4 w-4" /> Media
                </Button>
                <Button onClick={submit} size="sm" className="bg-gradient-brand text-brand-foreground">
                  <Send className="mr-2 h-4 w-4" /> Post
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Posts */}
        <div className="mt-6 space-y-4">
          {posts.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-brand-foreground">
                  {p.author.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{p.author}</div>
                  <div className="text-xs text-muted-foreground">{p.campus} · {p.time}</div>
                </div>
                <Badge variant="outline" className="text-xs">{p.type}</Badge>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm text-foreground/90">{p.content}</p>

              <div className="mt-4 flex items-center gap-1 border-t border-border pt-3">
                <Button variant="ghost" size="sm" onClick={() => toggleLike(p.id)} className={liked[p.id] ? "text-brand" : "text-muted-foreground"}>
                  <Heart className={`mr-1.5 h-4 w-4 ${liked[p.id] ? "fill-current" : ""}`} /> {p.likes}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleCelebrate(p.id)} className={celebrated[p.id] ? "text-cyan" : "text-muted-foreground"}>
                  <PartyPopper className="mr-1.5 h-4 w-4" /> {p.celebrates}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <MessageCircle className="mr-1.5 h-4 w-4" /> {p.comments}
                </Button>
                <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
