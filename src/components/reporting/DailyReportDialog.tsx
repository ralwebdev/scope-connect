import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Send, Flame } from "lucide-react";
import { toast } from "sonner";
import { reporting, type ReportAssignment } from "@/lib/reporting-store";
import { dailyReportFields } from "@/lib/reporting-forms";
import type { FieldDef } from "@/lib/governance-forms";

type Props = {
  assignment: ReportAssignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DailyReportDialog({ assignment, open, onOpenChange }: Props) {
  const today = useMemo(() => reporting.todayReport(assignment.id), [assignment.id, open]);
  const streak = useMemo(() => reporting.streakFor(assignment.id), [assignment.id, open]);
  const [values, setValues] = useState<Record<string, unknown>>(today?.data ?? {});
  const fields = dailyReportFields({ projectType: assignment.projectType, teamMode: assignment.teamMode });

  const submit = () => {
    for (const f of fields) {
      if (f.required && !values[f.name]) return toast.error(`${f.label} is required`);
    }
    reporting.submit({ assignmentId: assignment.id, data: values });
    reporting.evaluate();
    toast.success(today ? "Report updated for today." : "Daily report submitted. Streak preserved.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-brand" /> Daily report — {assignment.projectTitle}
          </DialogTitle>
          <DialogDescription>
            Mandatory daily update. Submitting today preserves your streak and clears active warnings.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-3 text-xs">
          <Badge variant="outline">{assignment.projectType}</Badge>
          {assignment.teamMode && <Badge variant="secondary">team mode</Badge>}
          <Badge className="bg-gradient-brand text-brand-foreground"><Flame className="mr-1 h-3 w-3" /> {streak}-day streak</Badge>
          {today && <Badge>Editing today's submission</Badge>}
        </div>

        <ScrollArea className="max-h-[55vh] pr-3">
          <div className="grid gap-4 py-2">
            {fields.map((f) => (
              <FieldRow key={f.name} field={f} value={values[f.name]} onChange={(v) => setValues({ ...values, [f.name]: v })} />
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-gradient-brand text-brand-foreground">
            <Send className="mr-2 h-4 w-4" /> {today ? "Update report" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const v = value === undefined || value === null ? "" : String(value);
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {field.type === "textarea" ? (
        <Textarea id={field.name} value={v} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <Input
          id={field.name}
          type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
          value={v}
          onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
          placeholder={field.placeholder}
        />
      )}
      {field.helper && <p className="text-xs text-muted-foreground">{field.helper}</p>}
    </div>
  );
}
