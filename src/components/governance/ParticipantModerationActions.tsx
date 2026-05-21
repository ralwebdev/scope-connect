// Scope Connect — Execution Ecosystem (A4): Role-aware participant
// moderation panel. Renders permission-gated buttons + mandatory-reason
// modals. STRICT ADDITIVE: drops into a participant card; no other UI is
// touched. Buttons hidden when the actor lacks the capability.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, Ban, Flag, RotateCcw, ShieldAlert, Snowflake,
  Megaphone, Replace, Scale, ScrollText, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { RoomParticipant } from "@/lib/projects-execution-store";
import {
  canDo, flagParticipant, warnParticipant, requestRemoval, escalateIssue,
  removeParticipant, restoreParticipant, replaceParticipant, overrideDecision,
  cooldownParticipant, markAbuse, settlementFor, moderation,
  FLAG_REASONS, REMOVAL_REASONS, WARNING_REASONS,
  type ActorContext, type ReasonCategory, type RemovalSeverity, type WarningType,
} from "@/lib/moderation-governance-store";
import { useStoreValue } from "@/hooks/use-scope";

type ModalKind =
  | null | "flag" | "warn" | "request_removal" | "escalate"
  | "remove" | "force_remove" | "replace" | "override"
  | "cooldown" | "mark_abuse" | "logs";

export function ParticipantModerationActions({
  participant, actor,
}: {
  participant: RoomParticipant;
  actor: ActorContext;
}) {
  const [modal, setModal] = useState<ModalKind>(null);

  // Self-actions: never let an actor moderate themselves.
  const isSelf = actor.id === participant.userId;
  if (isSelf) return null;

  const isRemoved = participant.status === "removed";

  const canFlag = canDo("flag", actor);
  const canWarn = canDo("warn", actor);
  const canReq = canDo("request_removal", actor);
  const canEsc = canDo("escalate", actor);
  const canRemove = canDo("remove", actor) && !isRemoved;
  const canForce = canDo("force_remove", actor) && !isRemoved;
  const canRestore = canDo("restore", actor) && isRemoved;
  const canReplace = canDo("replace", actor) && !isRemoved;
  const canOverride = canDo("override", actor);
  const canCooldown = canDo("cooldown", actor);
  const canAbuse = canDo("mark_abuse", actor);
  const canLogs = canDo("view_logs", actor);

  const nothing =
    !canFlag && !canWarn && !canReq && !canEsc && !canRemove && !canForce &&
    !canRestore && !canReplace && !canOverride && !canCooldown && !canAbuse && !canLogs;
  if (nothing) return null;

  function close() { setModal(null); }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {canFlag && (
        <Btn icon={Flag} onClick={() => setModal("flag")}>Flag</Btn>
      )}
      {canWarn && (
        <Btn icon={AlertTriangle} onClick={() => setModal("warn")}>Warn</Btn>
      )}
      {canReq && (
        <Btn icon={Megaphone} onClick={() => setModal("request_removal")}>Request Removal</Btn>
      )}
      {canEsc && (
        <Btn icon={ShieldAlert} onClick={() => setModal("escalate")}>Escalate</Btn>
      )}
      {canRemove && (
        <Btn icon={Ban} variant="destructive" onClick={() => setModal("remove")}>Remove</Btn>
      )}
      {canForce && (
        <Btn icon={Ban} variant="destructive" onClick={() => setModal("force_remove")}>Force Remove</Btn>
      )}
      {canReplace && (
        <Btn icon={Replace} onClick={() => setModal("replace")}>Replace</Btn>
      )}
      {canRestore && (
        <Btn icon={RotateCcw} onClick={() => setModal("override")} hide>{null}</Btn>
      )}
      {canRestore && (
        <Btn icon={RotateCcw} onClick={() => {
          const out = restoreParticipant({ participant, actor });
          if (out.ok) toast.success(`${participant.userName} restored.`);
          else toast.error(out.reason);
        }}>Restore</Btn>
      )}
      {canCooldown && (
        <Btn icon={Snowflake} onClick={() => setModal("cooldown")}>Cooldown</Btn>
      )}
      {canAbuse && (
        <Btn icon={ShieldAlert} onClick={() => setModal("mark_abuse")}>Mark Abuse</Btn>
      )}
      {canOverride && (
        <Btn icon={Scale} onClick={() => setModal("override")}>Override</Btn>
      )}
      {canLogs && (
        <Btn icon={ScrollText} onClick={() => setModal("logs")}>Logs</Btn>
      )}

      <ReasonModal
        open={modal === "flag"} onClose={close}
        title="Flag participant"
        description="Captured in the moderation audit log. Reason is mandatory."
        reasons={FLAG_REASONS}
        minNotes={5}
        onSubmit={({ reason, notes }) => {
          const out = flagParticipant({ participant, actor, reasonCategory: reason, notes });
          handle(out, `${participant.userName} flagged.`); close();
        }}
      />

      <WarnModal
        open={modal === "warn"} onClose={close}
        onSubmit={({ warningType, message }) => {
          const out = warnParticipant({ participant, actor, warningType, message });
          handle(out, `Warning issued to ${participant.userName}.`); close();
        }}
      />

      <ReasonModal
        open={modal === "request_removal"} onClose={close}
        title="Request removal"
        description="Escalates a removal recommendation to faculty/admin. Reason mandatory."
        reasons={REMOVAL_REASONS}
        minNotes={10}
        onSubmit={({ reason, notes }) => {
          const out = requestRemoval({ participant, actor, reasonCategory: reason, notes });
          handle(out, "Removal request submitted."); close();
        }}
      />

      <NotesOnlyModal
        open={modal === "escalate"} onClose={close}
        title="Escalate issue"
        description="Notify higher-tier moderators. Notes required."
        minNotes={5}
        onSubmit={({ notes }) => {
          const out = escalateIssue({ participant, actor, notes });
          handle(out, "Escalated."); close();
        }}
      />

      <RemoveModal
        open={modal === "remove" || modal === "force_remove"} onClose={close}
        force={modal === "force_remove"}
        participantName={participant.userName}
        onSubmit={({ reason, notes, severity }) => {
          const out = removeParticipant({
            participant, actor, reasonCategory: reason, notes, severity,
            force: modal === "force_remove",
          });
          if (out.ok) {
            const s = out.settlement;
            toast.success(
              `${participant.userName} removed.` +
              (s ? ` XP refund: ${s.refundPercent}% · Cooldown: ${s.cooldown ? "yes" : "no"}` : ""),
            );
          } else toast.error(out.reason);
          close();
        }}
      />

      <ReasonModal
        open={modal === "replace"} onClose={close}
        title="Replace participant"
        description="Marks as removed and reopens the seat for a new joiner via Auto Join."
        reasons={REMOVAL_REASONS}
        minNotes={10}
        onSubmit={({ reason, notes }) => {
          const out = replaceParticipant({ participant, actor, reasonCategory: reason, notes });
          handle(out, "Seat reopened — new participant can Auto-Join."); close();
        }}
      />

      <NotesOnlyModal
        open={modal === "cooldown"} onClose={close}
        title="Cooldown participant"
        description="Applies a temporary participation cooldown. Justification required."
        minNotes={5}
        onSubmit={({ notes }) => {
          const out = cooldownParticipant({ participant, actor, notes });
          handle(out, "Cooldown applied."); close();
        }}
      />

      <ReasonModal
        open={modal === "mark_abuse"} onClose={close}
        title="Mark abuse"
        description="Logs an abuse signal against this participant. Notes mandatory."
        reasons={REMOVAL_REASONS}
        minNotes={10}
        onSubmit={({ reason, notes }) => {
          const out = markAbuse({ participant, actor, reasonCategory: reason, notes });
          handle(out, "Abuse marker recorded."); close();
        }}
      />

      <NotesOnlyModal
        open={modal === "override"} onClose={close}
        title="Override decision"
        description="Overrides a prior moderation decision. Justification (min 10) required."
        minNotes={10}
        onSubmit={({ notes }) => {
          const out = overrideDecision({ participant, actor, notes });
          handle(out, "Decision overridden."); close();
        }}
      />

      <LogsModal
        open={modal === "logs"} onClose={close}
        participantId={participant.id}
        participantName={participant.userName}
      />
    </div>
  );
}

function handle(out: { ok: boolean; reason?: string }, success: string) {
  if (out.ok) toast.success(success);
  else toast.error(out.reason ?? "Action failed.");
}

function Btn({
  icon: Icon, children, onClick, variant = "outline", hide = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick: () => void;
  variant?: "outline" | "destructive" | "secondary";
  hide?: boolean;
}) {
  if (hide) return null;
  return (
    <Button type="button" size="sm" variant={variant} onClick={onClick} className="h-7 px-2 text-xs">
      <Icon className="mr-1 h-3 w-3" />
      {children}
    </Button>
  );
}

/* ----------------------------- Modals --------------------------------- */

function reasonLabel(r: ReasonCategory) {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ReasonModal({
  open, onClose, title, description, reasons, minNotes, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  reasons: ReasonCategory[];
  minNotes: number;
  onSubmit: (v: { reason: ReasonCategory; notes: string }) => void;
}) {
  const [reason, setReason] = useState<ReasonCategory | "">("");
  const [notes, setNotes] = useState("");
  const valid = reason !== "" && notes.trim().length >= minNotes;
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setReason(""); setNotes(""); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Reason category *</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as ReasonCategory)}>
              <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r} value={r}>{reasonLabel(r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes * <span className="text-muted-foreground">(min {minNotes} chars)</span></Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Describe the issue clearly. This is permanently audited."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid} onClick={() => valid && onSubmit({ reason: reason as ReasonCategory, notes })}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NotesOnlyModal({
  open, onClose, title, description, minNotes, onSubmit,
}: {
  open: boolean; onClose: () => void;
  title: string; description: string;
  minNotes: number;
  onSubmit: (v: { notes: string }) => void;
}) {
  const [notes, setNotes] = useState("");
  const valid = notes.trim().length >= minNotes;
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setNotes(""); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label className="text-xs">Notes * (min {minNotes} chars)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid} onClick={() => valid && onSubmit({ notes })}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WarnModal({
  open, onClose, onSubmit,
}: {
  open: boolean; onClose: () => void;
  onSubmit: (v: { warningType: WarningType; message: string }) => void;
}) {
  const [warningType, setWarningType] = useState<WarningType>("gentle_warning");
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState<ReasonCategory | "">("");
  const valid = message.trim().length >= 5 && reason !== "";
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setMessage(""); setReason(""); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Warn participant</DialogTitle>
          <DialogDescription>The warning is logged and visible in audit history.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Warning level *</Label>
            <Select value={warningType} onValueChange={(v) => setWarningType(v as WarningType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gentle_warning">Gentle warning</SelectItem>
                <SelectItem value="moderate_warning">Moderate warning</SelectItem>
                <SelectItem value="final_warning">Final warning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reason category *</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as ReasonCategory)}>
              <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
              <SelectContent>
                {WARNING_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{reasonLabel(r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Message * (min 5 chars)</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid} onClick={() => valid && onSubmit({ warningType, message: `[${reason}] ${message}` })}>
            Send warning
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemoveModal({
  open, onClose, force, participantName, onSubmit,
}: {
  open: boolean; onClose: () => void;
  force: boolean; participantName: string;
  onSubmit: (v: { reason: ReasonCategory; notes: string; severity: RemovalSeverity }) => void;
}) {
  const [reason, setReason] = useState<ReasonCategory | "">("");
  const [notes, setNotes] = useState("");
  const [severity, setSeverity] = useState<RemovalSeverity>("medium");
  const valid = reason !== "" && notes.trim().length >= 20;
  const preview = reason ? settlementFor(reason as ReasonCategory) : null;
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setReason(""); setNotes(""); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{force ? "Force remove" : "Remove"} {participantName}</DialogTitle>
          <DialogDescription>
            Soft-delete only — the participant record is preserved for audit. XP settlement
            follows the project governance matrix.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Reason category *</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as ReasonCategory)}>
              <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
              <SelectContent>
                {REMOVAL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{reasonLabel(r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Severity *</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as RemovalSeverity)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Detailed notes * (min 20 chars)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </div>
          {preview && (
            <Card className="p-3 text-xs">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">XP refund: {preview.refundPercent}%</Badge>
                <Badge variant="outline">{preview.cooldown ? "Cooldown applied" : "No cooldown"}</Badge>
                <Badge variant="outline">{preview.reliabilityPenalty ? "Reliability penalty" : "No reliability hit"}</Badge>
              </div>
            </Card>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={!valid} onClick={() => valid && onSubmit({ reason: reason as ReasonCategory, notes, severity })}>
            {force ? "Force remove" : "Remove"} participant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LogsModal({
  open, onClose, participantId, participantName,
}: {
  open: boolean; onClose: () => void;
  participantId: string; participantName: string;
}) {
  const logs = useStoreValue(() => moderation.logs.byParticipant(participantId));
  const items = useMemo(() => logs, [logs]);
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Audit log — {participantName}</DialogTitle>
          <DialogDescription>All moderation actions are permanently recorded.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-2">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">No moderation actions yet.</p>
            )}
            {items.map((l) => (
              <Card key={l.id} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="capitalize">{l.kind.replace(/_/g, " ")}</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(l.at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-xs">
                  by <strong>{l.actorName}</strong> ({l.actorRole})
                  {l.reasonCategory && <> · {reasonLabel(l.reasonCategory)}</>}
                  {l.severity && <> · severity {l.severity}</>}
                  {l.warningType && <> · {l.warningType.replace(/_/g, " ")}</>}
                </p>
                {l.notes && <p className="mt-1 text-xs text-muted-foreground">{l.notes}</p>}
              </Card>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}><X className="mr-1 h-3 w-3" /> Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
