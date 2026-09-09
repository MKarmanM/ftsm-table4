"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  addAssessmentAction,
  removeAssessmentAction,
  updateAssessmentAction,
  type AssessmentFormState,
} from "@/app/actions/table4";
import type { HoursBreakdown } from "@/lib/table4-detail";
import { Button } from "@/components/ui/button";
import { BilingualLabel, LtpoInfoIcon } from "@/components/table4-bilingual-label";

type Item = {
  id: string;
  orderIndex: number;
  nameMs: string;
  weightagePercent: string | null;
  hours: HoursBreakdown;
};

const initial: AssessmentFormState = {};

function ltpo(b: { l: number; t: number; p: number; o: number }) {
  return `L${b.l} T${b.t} P${b.p} O${b.o}`;
}

function LtpoFields({
  namePrefix,
  defaults,
}: {
  namePrefix: string;
  defaults?: { l: number; t: number; p: number; o: number };
}) {
  return (
    <div className="grid grid-cols-4 gap-1">
      {(["L", "T", "P", "O"] as const).map((label) => (
        <input
          key={label}
          name={`${namePrefix}${label}`}
          type="number"
          step="0.5"
          min="0"
          defaultValue={defaults?.[label.toLowerCase() as "l" | "t" | "p" | "o"] ?? 0}
          placeholder={label}
          title={
            { L: "Lecture/Kuliah", T: "Tutorial/Tutoran", P: "Practical/Amali", O: "Other/Lain-lain" }[
              label
            ]
          }
          className="w-full rounded-md border border-input bg-background px-1 py-1 text-xs text-foreground outline-none"
        />
      ))}
    </div>
  );
}

export function AssessmentsEditor({
  versionId,
  courseId,
  readOnly,
  phase,
  items,
}: {
  versionId: string;
  courseId: string;
  readOnly: boolean;
  phase: "CONTINUOUS" | "FINAL";
  items: Item[];
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addState, addAction, isAdding] = useActionState(addAssessmentAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!addState?.error) {
      formRef.current?.reset();
      setIsAddOpen(false);
    }
  }, [addState]);

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Belum ada item.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                <th className="px-3 py-2.5">Nama</th>
                <th className="px-3 py-2.5">Wajaran %</th>
                <th className="px-3 py-2.5">F2F Fizikal (L/T/P/O)<LtpoInfoIcon /></th>
                <th className="px-3 py-2.5">F2F Online (L/T/P/O)<LtpoInfoIcon /></th>
                <th className="px-3 py-2.5">Kendiri</th>
                {!readOnly && <th className="px-3 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  versionId={versionId}
                  courseId={courseId}
                  readOnly={readOnly}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!readOnly && !isAddOpen && (
        <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
          + Tambah Item
        </Button>
      )}

      {!readOnly && isAddOpen && (
        <form
          ref={formRef}
          action={addAction}
          className="space-y-3 rounded-md border border-border p-4"
        >
          <input type="hidden" name="versionId" value={versionId} />
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="phase" value={phase} />
          <p className="text-sm font-semibold text-foreground">Tambah Item</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="nameMs"
              required
              placeholder="Nama penilaian"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
            <input
              name="weightagePercent"
              type="number"
              step="0.5"
              placeholder="Wajaran %"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-3 items-end gap-3">
            <div>
              <span className="inline-flex items-center"><BilingualLabel en="F2F Physical" ms="F2F Fizikal" /><LtpoInfoIcon /></span>
              <LtpoFields namePrefix="assessmentPhysical" />
            </div>
            <div>
              <span className="inline-flex items-center"><BilingualLabel en="F2F Online" ms="F2F Online" /><LtpoInfoIcon /></span>
              <LtpoFields namePrefix="assessmentOnline" />
            </div>
            <div>
              <BilingualLabel en="Independent Learning" ms="Pembelajaran Kendiri (jam)" />
              <input
                name="assessmentIndependent"
                type="number"
                step="0.5"
                min="0"
                defaultValue={0}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isAdding}>
              {isAdding ? "Menambah..." : "Tambah Item"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddOpen(false)}>
              Batal
            </Button>
          </div>
          {addState?.error && (
            <span className="text-xs text-destructive">{addState.error}</span>
          )}
        </form>
      )}
    </div>
  );
}

function ItemRow({
  item,
  versionId,
  courseId,
  readOnly,
}: {
  item: Item;
  versionId: string;
  courseId: string;
  readOnly: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, action] = useActionState(removeAssessmentAction, initial);
  const [updateState, updateAction, isUpdating] = useActionState(
    updateAssessmentAction,
    initial
  );

  useEffect(() => {
    if (!updateState?.error && isEditing) setIsEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateState]);

  if (isEditing) {
    return (
      <tr className="border-b border-border last:border-0">
        <td colSpan={readOnly ? 5 : 6} className="p-2">
          <form
            action={updateAction}
            className="space-y-2 rounded-md border border-border bg-muted/20 p-2"
          >
            <input type="hidden" name="versionId" value={versionId} />
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="assessmentId" value={item.id} />
            <div className="grid grid-cols-2 gap-2">
              <input
                name="nameMs"
                required
                defaultValue={item.nameMs}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground outline-none"
              />
              <input
                name="weightagePercent"
                type="number"
                step="0.5"
                defaultValue={item.weightagePercent ?? ""}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground outline-none"
              />
            </div>
            <div className="grid grid-cols-3 items-end gap-2">
              <div>
                <span className="inline-flex items-center"><BilingualLabel en="F2F Physical" ms="F2F Fizikal" /><LtpoInfoIcon /></span>
                <LtpoFields namePrefix="assessmentPhysical" defaults={item.hours.f2fPhysical} />
              </div>
              <div>
                <span className="inline-flex items-center"><BilingualLabel en="F2F Online" ms="F2F Online" /><LtpoInfoIcon /></span>
                <LtpoFields namePrefix="assessmentOnline" defaults={item.hours.f2fOnline} />
              </div>
              <div>
                <BilingualLabel en="Independent Learning" ms="Pembelajaran Kendiri (jam)" />
                <input
                  name="assessmentIndependent"
                  type="number"
                  step="0.5"
                  min="0"
                  defaultValue={item.hours.independent}
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground outline-none"
                />
              </div>
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
              {updateState?.error && (
                <span className="text-xs text-destructive">{updateState.error}</span>
              )}
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2.5 text-foreground">{item.nameMs}</td>
      <td className="px-3 py-2.5">{item.weightagePercent ?? "\u2014"}</td>
      <td className="px-3 py-2.5 whitespace-nowrap">{ltpo(item.hours.f2fPhysical)}</td>
      <td className="px-3 py-2.5 whitespace-nowrap">{ltpo(item.hours.f2fOnline)}</td>
      <td className="px-3 py-2.5">{item.hours.independent}</td>
      {!readOnly && (
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-md px-2 py-1 text-xs font-medium text-secondary hover:bg-muted hover:text-foreground"
            >
              Edit
            </button>
            <form
              action={action}
              onSubmit={(e) => {
                if (!confirm(`Adakah anda pasti mahu membuang item "${item.nameMs}" ini?`)) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="versionId" value={versionId} />
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="assessmentId" value={item.id} />
              <button
                type="submit"
                className="rounded-md px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                Buang
              </button>
            </form>
          </div>
          {state?.error && (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {state.error}
            </p>
          )}
        </td>
      )}
    </tr>
  );
}
