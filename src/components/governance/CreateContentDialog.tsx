import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { FORM_SCHEMAS, visibleFields, type FieldDef } from "@/lib/governance-forms";
import { authorityFor, governance, type ContentEntity } from "@/lib/governance-store";
import { useRole } from "@/hooks/use-rbac";
import { useUser } from "@/hooks/use-scope";
import { ROLE_LABELS } from "@/lib/rbac";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEntity?: ContentEntity;
};

const ENTITY_LABEL: Record<ContentEntity, string> = {
  challenge: "Challenge",
  project: "Project",
  opportunity: "Opportunity",
};

export function CreateContentDialog({ open, onOpenChange, defaultEntity = "challenge" }: Props) {
  const role = useRole();
  const user = useUser();
  const [entity, setEntity] = useState<ContentEntity>(defaultEntity);
  const [values, setValues] = useState<Record<string, unknown>>({});

  const auth = authorityFor(entity, role);
  const schema = FORM_SCHEMAS[entity];
  const fields = useMemo(() => visibleFields(schema, values), [schema, values]);

  const reset = () => setValues({});

  const validate = (): string | null => {
    for (const f of fields) {
      if (f.required && !values[f.name]) return `${f.label} is required`;
    }
    return null;
  };

  const submit = (asDraft: boolean) => {
    const err = validate();
    if (err) return toast.error(err);
    if (!auth.canCreate && !auth.canDraft) {
      return toast.error("Your role can't create this content type.");
    }
    governance.submit({
      entity,
      data: values,
      role,
      actorName: user?.name ?? "Anonymous",
      actorEmail: user?.email,
      saveAsDraft: asDraft,
    });
    toast.success(
      asDraft
        ? "Saved as draft. An admin can submit it for review."
        : "Submitted for moderation. Reviewers have been notified.",
    );
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand" /> Create {ENTITY_LABEL[entity]}
          </DialogTitle>
          <DialogDescription>
            Trust-first creation. Public visibility requires moderation approval.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-3">
          {(["challenge", "project", "opportunity"] as ContentEntity[]).map((e) => (
            <Button
              key={e}
              size="sm"
              variant={entity === e ? "default" : "outline"}
              onClick={() => { setEntity(e); reset(); }}
            >
              {ENTITY_LABEL[e]}
            </Button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{ROLE_LABELS[role]}</Badge>
            {auth.canCreate ? (
              <Badge className="bg-success/15 text-success">can submit</Badge>
            ) : auth.canDraft ? (
              <Badge variant="secondary">draft only</Badge>
            ) : (
              <Badge variant="destructive">no rights</Badge>
            )}
          </div>
        </div>

        {auth.scopes && (
          <p className="text-xs text-muted-foreground">
            Allowed scopes: {auth.scopes.join(", ")}
          </p>
        )}

        <ScrollArea className="max-h-[55vh] pr-3">
          <div className="grid gap-4 py-2">
            {fields.map((f) => (
              <FieldInput
                key={f.name}
                field={f}
                value={values[f.name]}
                onChange={(v) => setValues({ ...values, [f.name]: v })}
              />
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          {auth.canDraft || auth.canCreate ? (
            <Button variant="outline" onClick={() => submit(true)}>
              <Save className="mr-2 h-4 w-4" /> Save draft
            </Button>
          ) : null}
          {auth.canCreate ? (
            <Button onClick={() => submit(false)} className="bg-gradient-brand text-brand-foreground">
              <Send className="mr-2 h-4 w-4" /> Submit for review
            </Button>
          ) : (
            <Button disabled>Submission requires admin role</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const v = value === undefined || value === null ? "" : String(value);
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {field.type === "textarea" ? (
        <Textarea id={field.name} value={v} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={3} />
      ) : field.type === "select" ? (
        <Select value={v} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={field.name}
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text"}
          value={v}
          onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
          placeholder={field.placeholder}
        />
      )}
      {field.helper && <p className="text-xs text-muted-foreground">{field.helper}</p>}
    </div>
  );
}
