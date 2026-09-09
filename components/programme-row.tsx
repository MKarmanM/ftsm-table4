"use client";

import { useActionState, useState } from "react";
import {
  updateProgrammeAction,
  setProgrammeActiveAction,
  type UpdateProgrammeState,
  type SetProgrammeActiveState,
} from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";

type Programme = {
  id: string;
  code: string;
  nameMs: string;
  nameEn: string | null;
  isActive: boolean;
  activeCourseCount: number;
};

const initialUpdateState: UpdateProgrammeState = {};
const initialActiveState: SetProgrammeActiveState = {};

export function ProgrammeRow({ programme }: { programme: Programme }) {
  const [isEditing, setIsEditing] = useState(false);
  const [updateState, updateAction, isUpdating] = useActionState(
    updateProgrammeAction,
    initialUpdateState
  );
  const [activeState, activeAction, isTogglingActive] = useActionState(
    setProgrammeActiveAction,
    initialActiveState
  );

  if (isEditing) {
    return (
      <div className="rounded-md border border-border p-3">
        <form action={updateAction} className="space-y-2">
          <input type="hidden" name="programmeId" value={programme.id} />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="code"
              defaultValue={programme.code}
              required
              className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <input
              name="nameEn"
              defaultValue={programme.nameEn ?? ""}
              placeholder="Nama (EN)"
              className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <input
            name="nameMs"
            defaultValue={programme.nameMs}
            required
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isUpdating}>
              {isUpdating ? "Menyimpan..." : "Simpan"}
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
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
      <div>
        <p className="text-sm font-medium text-foreground">
          {programme.code} &mdash; {programme.nameMs}
          {!programme.isActive && (
            <span className="ml-2 text-xs font-normal text-muted-foreground italic">
              (tidak aktif)
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {programme.activeCourseCount} kursus aktif
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
        <form
          action={activeAction}
          onSubmit={(e) => {
            if (
              programme.isActive &&
              !confirm(
                `Nyahaktifkan program ${programme.code}? Ia tidak akan muncul dalam senarai program aktif.`
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="programmeId" value={programme.id} />
          <input
            type="hidden"
            name="isActive"
            value={programme.isActive ? "false" : "true"}
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={isTogglingActive}
          >
            {programme.isActive ? "Nyahaktif" : "Aktifkan"}
          </Button>
        </form>
      </div>
      {activeState?.error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {activeState.error}
        </p>
      )}
    </div>
  );
}
