"use client";

import { useActionState, useState } from "react";
import { savePayloadAction, type SavePayloadState } from "@/app/actions/proforma";
import { Button } from "@/components/ui/button";

const initialState: SavePayloadState = {};

export function PayloadEditor({
  versionId,
  courseId,
  initialPayload,
  readOnly,
}: {
  versionId: string;
  courseId: string;
  initialPayload: unknown;
  readOnly: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    savePayloadAction,
    initialState
  );
  const [value, setValue] = useState(() =>
    JSON.stringify(initialPayload ?? {}, null, 2)
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="versionId" value={versionId} />
      <input type="hidden" name="courseId" value={courseId} />
      <textarea
        name="payload"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        readOnly={readOnly}
        rows={16}
        spellCheck={false}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
      />
      <div className="flex items-center gap-3">
        {!readOnly && (
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        )}
        {state?.error && (
          <p role="alert" className="text-xs text-destructive">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-xs text-emerald-700">Disimpan.</p>
        )}
      </div>
      {readOnly && (
        <p className="text-xs text-muted-foreground italic">
          Draf ini tidak lagi berstatus DRAFT — kandungan tidak boleh
          diedit. Guna &quot;Buka Semula sebagai Draf&quot; jika perlu
          pembetulan.
        </p>
      )}
    </form>
  );
}
