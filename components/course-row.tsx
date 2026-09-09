"use client";

import { useActionState, useState } from "react";
import {
  updateCourseAction,
  setCourseActiveAction,
  type UpdateCourseState,
  type SetCourseActiveState,
} from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";

type Course = {
  id: string;
  code: string;
  nameMs: string;
  nameEn: string | null;
  creditHours: string;
  programmeId: string;
  programmeCode: string;
  isActive: boolean;
};

const initialUpdateState: UpdateCourseState = {};
const initialActiveState: SetCourseActiveState = {};

export function CourseRow({
  course,
  programmes,
}: {
  course: Course;
  programmes: { id: string; code: string; nameMs: string }[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [updateState, updateAction, isUpdating] = useActionState(
    updateCourseAction,
    initialUpdateState
  );
  const [activeState, activeAction, isTogglingActive] = useActionState(
    setCourseActiveAction,
    initialActiveState
  );

  if (isEditing) {
    return (
      <div className="rounded-md border border-border p-3">
        <form action={updateAction} className="space-y-2">
          <input type="hidden" name="courseId" value={course.id} />
          <div className="grid grid-cols-3 gap-2">
            <input
              name="code"
              defaultValue={course.code}
              required
              className="col-span-2 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <input
              name="creditHours"
              type="number"
              step="0.5"
              min="0"
              defaultValue={course.creditHours}
              required
              className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <select
            name="programmeId"
            defaultValue={course.programmeId}
            required
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} &mdash; {p.nameMs}
              </option>
            ))}
          </select>
          <input
            name="nameMs"
            defaultValue={course.nameMs}
            required
            placeholder="Nama (BM)"
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <input
            name="nameEn"
            defaultValue={course.nameEn ?? ""}
            placeholder="Nama (EN)"
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
          {course.code} &mdash; {course.nameMs}
          {!course.isActive && (
            <span className="ml-2 text-xs font-normal text-muted-foreground italic">
              (tidak aktif)
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {course.programmeCode} &middot; {course.creditHours} kredit
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
              course.isActive &&
              !confirm(
                `Nyahaktifkan kursus ${course.code}? Ia tidak akan muncul dalam senarai kursus.`
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="courseId" value={course.id} />
          <input
            type="hidden"
            name="isActive"
            value={course.isActive ? "false" : "true"}
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={isTogglingActive}
          >
            {course.isActive ? "Nyahaktif" : "Aktifkan"}
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
