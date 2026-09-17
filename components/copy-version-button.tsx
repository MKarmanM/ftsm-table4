"use client";

import { useState } from "react";
import { copyPreviousVersionAction } from "@/app/actions/proforma";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

export function CopyVersionButton({
  courseId,
  sourceVersionId,
  sourceLabel,
}: {
  courseId: string;
  sourceVersionId: string;
  sourceLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <form action={copyPreviousVersionAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="sourceVersionId" value={sourceVersionId} />
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Salin Versi Ini
      </Button>
      <ConfirmationDialog
        open={open}
        title="Cipta draf baharu daripada versi ini?"
        description={`Draf baharu akan dicipta berdasarkan ${sourceLabel}. Sejarah semakan, komen dan tarikh kelulusan tidak akan disalin.`}
        confirmLabel="Ya, cipta draf baharu"
        onClose={() => setOpen(false)}
      />
    </form>
  );
}
