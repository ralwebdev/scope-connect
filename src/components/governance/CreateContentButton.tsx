import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Plus, Lock } from "lucide-react";
import { CreateContentDialog } from "./CreateContentDialog";
import { authorityFor, type ContentEntity } from "@/lib/governance-store";
import { useRole } from "@/hooks/use-rbac";

type Props = Omit<ButtonProps, "onClick"> & {
  entity: ContentEntity;
  label?: string;
};

export function CreateContentButton({ entity, label, ...rest }: Props) {
  const role = useRole();
  const auth = authorityFor(entity, role);
  const [open, setOpen] = useState(false);

  if (!auth.canCreate && !auth.canDraft) {
    return (
      <Button variant="outline" disabled {...rest}>
        <Lock className="mr-2 h-4 w-4" /> {label ?? `Create ${entity}`}
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} {...rest}>
        <Plus className="mr-2 h-4 w-4" /> {label ?? `Create ${entity}`}
      </Button>
      <CreateContentDialog open={open} onOpenChange={setOpen} defaultEntity={entity} />
    </>
  );
}
