"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  addPloAction,
  removePloAction,
  updatePloAction,
  type AddPloState,
  type RemovePloState,
  type UpdatePloState,
} from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";

type Plo = { id: string; orderNumber: number; textMs: string; textEn: string | null };

const initialAddState: AddPloState = {};
const initialRemoveState: RemovePloState = {};
const initialUpdateState: UpdatePloState = {};

export function PloManager({
  programmeId,
  plos,
}: {
  programmeId: string;
  plos: Plo[];
}) {
  const [addState, addAction, isAdding] = useActionState(
    addPloAction,
    initialAddState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (addState?.success) formRef.current?.reset();
  }, [addState?.success]);

  return (
    <div className="mt-2 rounded-md border border-border bg-background p-4">
      <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        PLO Program
      </p>

      {plos.length === 0 ? (
        <p className="mb-2 text-xs text-muted-foreground italic">
          Belum ada PLO didaftarkan.
        </p>
      ) : (
        <ul className="mb-4 space-y-2">
          {plos.map((plo) => (
            <PloRow key={plo.id} plo={plo} />
          ))}
        </ul>
      )}

      <form ref={formRef} action={addAction} className="flex items-end gap-2">
        <input type="hidden" name="programmeId" value={programmeId} />
        <div>
          <label className="block text-xs text-muted-foreground">No.</label>
          <input
            name="orderNumber"
            type="number"
            min="1"
            required
            className="w-16 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-muted-foreground">
            Teks PLO (BM)
          </label>
          <input
            name="textMs"
            required
            placeholder="Contoh: Mengaplikasikan pengetahuan sains komputer..."
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <Button type="submit" size="sm" disabled={isAdding}>
          {isAdding ? "..." : "Tambah"}
        </Button>
      </form>
      {addState?.error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {addState.error}
        </p>
      )}
    </div>
  );
}

function PloRow({ plo }: { plo: Plo }) {
  const [isEditing, setIsEditing] = useState(false);
  const [removeState, removeAction, isRemoving] = useActionState(
    removePloAction,
    initialRemoveState
  );
  const [updateState, updateAction, isUpdating] = useActionState(
    updatePloAction,
    initialUpdateState
  );

  useEffect(() => {
    if (updateState?.success) setIsEditing(false);
  }, [updateState?.success]);

  if (isEditing) {
    return (
      <li className="rounded-md border border-border bg-card p-3">
        <form action={updateAction} className="space-y-2">
          <input type="hidden" name="ploId" value={plo.id} />
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs text-muted-foreground">No.</label>
              <input
                name="orderNumber"
                type="number"
                min="1"
                required
                defaultValue={plo.orderNumber}
                className="w-16 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground">
                Teks (EN) — pilihan
              </label>
              <input
                name="textEn"
                defaultValue={plo.textEn ?? ""}
                className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground">
              Teks PLO (BM)
            </label>
            <textarea
              name="textMs"
              required
              defaultValue={plo.textMs}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isUpdating}>
              {isUpdating ? "..." : "Simpan"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Batal
            </Button>
          </div>
          {updateState?.error && (
            <p role="alert" className="text-xs text-destructive">
              {updateState.error}
            </p>
          )}
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-md border border-border bg-card px-3 py-2.5">
      <span className="text-sm text-foreground">
        <span className="font-medium">PLO{plo.orderNumber}</span> &mdash;{" "}
        {plo.textMs}
      </span>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
        <form action={removeAction}>
          <input type="hidden" name="ploId" value={plo.id} />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={isRemoving}
            title="Buang PLO ini"
          >
            Buang
          </Button>
        </form>
      </div>
      {removeState?.error && (
        <p role="alert" className="text-xs text-destructive">
          {removeState.error}
        </p>
      )}
    </li>
  );
}
