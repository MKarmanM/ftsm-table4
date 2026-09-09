"use client";

import { useActionState, useState } from "react";
import {
  reviewActionFormAction,
  type ReviewActionFormState,
} from "@/app/actions/proforma";
import { ACTION_LABEL } from "@/lib/workflow-constants";
import { Button } from "@/components/ui/button";
import type { ReviewActionType } from "@/lib/generated/prisma/enums";

const initialState: ReviewActionFormState = {};

export function ReviewActionButtons({
  versionId,
  courseId,
  allowedActions,
  hasStatusActionsButNoPermission,
}: {
  versionId: string;
  courseId: string;
  allowedActions: ReviewActionType[];
  hasStatusActionsButNoPermission?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    reviewActionFormAction,
    initialState
  );
  const [pendingType, setPendingType] = useState<ReviewActionType | null>(
    null
  );

  if (allowedActions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        {hasStatusActionsButNoPermission
          ? "Draf ini menunggu tindakan daripada peranan lain (contoh: Penyelaras Program atau Pegawai Akademik)."
          : "Tiada tindakan lanjut tersedia untuk status semasa."}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="versionId" value={versionId} />
      <input type="hidden" name="courseId" value={courseId} />

      <div>
        <label
          htmlFor="note"
          className="block text-sm font-medium text-foreground"
        >
          Catatan (pilihan)
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Contoh: perlu tambah CLO untuk topik 3"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {allowedActions.map((type) => (
          <Button
            key={type}
            type="submit"
            name="type"
            value={type}
            variant={type === "PUBLISH" ? "default" : "outline"}
            size="sm"
            disabled={isPending}
            onClick={() => setPendingType(type)}
          >
            {isPending && pendingType === type
              ? "Memproses..."
              : ACTION_LABEL[type]}
          </Button>
        ))}
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
