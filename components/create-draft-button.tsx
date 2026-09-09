"use client";

import { useActionState } from "react";
import { createDraftAction, type CreateDraftState } from "@/app/actions/proforma";
import { Button } from "@/components/ui/button";

const initialState: CreateDraftState = {};

export function CreateDraftButton({ courseId }: { courseId: string }) {
  const [state, formAction, isPending] = useActionState(
    createDraftAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="courseId" value={courseId} />
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {isPending ? "Mencipta..." : "Cipta Draf"}
      </Button>
      {state?.error && (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
