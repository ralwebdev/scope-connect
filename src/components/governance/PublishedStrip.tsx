import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { useStoreValue } from "@/hooks/use-scope";
import { governance, type ContentEntity } from "@/lib/governance-store";
import { titleOf } from "@/lib/governance-forms";
import { ROLE_LABELS } from "@/lib/rbac";

export function PublishedStrip({ entity, title = "Recently published" }: { entity: ContentEntity; title?: string }) {
  const items = useStoreValue(() => governance.publishedByEntity(entity));
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-success" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
        <Badge variant="outline" className="ml-1">{items.length}</Badge>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 6).map((it) => (
          <Card key={it.id} className="p-4 hover-lift">
            <div className="flex items-center justify-between">
              <Badge className="bg-success/15 text-success">Verified · Published</Badge>
              {it.scopeTag && <Badge variant="outline">{it.scopeTag}</Badge>}
            </div>
            <h3 className="mt-3 line-clamp-2 font-semibold text-foreground">{titleOf(it)}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {String(it.data.description ?? it.data.deliverables ?? it.data.selection_process ?? "")}
            </p>
            <div className="mt-3 text-xs text-muted-foreground">
              by <b className="text-foreground">{it.createdByName}</b> · {ROLE_LABELS[it.createdByRole]}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
