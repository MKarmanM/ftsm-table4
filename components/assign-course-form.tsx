"use client";

import { useActionState, useId, useRef } from "react";
import {
  assignCourseAction,
  removeCourseAssignmentAction,
  type AssignCourseState,
} from "@/app/actions/user-admin";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/form-field";

type Lecturer = {
  id: string;
  name: string;
  email: string;
};
type CourseOption = {
  id: string;
  code: string;
  nameMs: string;
  programmeCode: string;
};
type Assignment = {
  id: string;
  userName: string;
  courseCode: string;
};

const initialState: AssignCourseState = {};

export function AssignCourseForm({
  lecturers,
  courses,
  assignments,
}: {
  lecturers: Lecturer[];
  courses: CourseOption[];
  assignments: Assignment[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const reactId = useId();
  const hintId = `${reactId}-course-assignment-hint`;
  const [state, action, pending] = useActionState(
    async (previous: AssignCourseState, data: FormData) => {
      const result = await assignCourseAction(previous, data);
      if (result.success) formRef.current?.reset();
      return result;
    },
    initialState
  );
  const [removeState, removeAction, removing] = useActionState(
    removeCourseAssignmentAction,
    initialState
  );

  return (
    <div className="space-y-4">
      <p id={hintId} className="text-xs text-muted-foreground">
        Tugasan membolehkan Pensyarah melihat Table 4 kursus yang ditetapkan.
        Suntingan draf kekal untuk Penyelaras Kursus.
      </p>
      {lecturers.length > 0 && courses.length > 0 ? (
        <form ref={formRef} action={action} className="space-y-3">
          <FormSelect
            label="Pensyarah"
            name="userId"
            required
            defaultValue=""
            describedBy={hintId}
          >
              <option value="" disabled>Pilih Pensyarah</option>
              {lecturers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
          </FormSelect>
          <FormSelect
            label="Kursus"
            name="courseId"
            required
            defaultValue=""
            describedBy={hintId}
          >
              <option value="" disabled>Pilih kursus</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.programmeCode} · {c.code} — {c.nameMs}</option>
              ))}
          </FormSelect>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Memproses..." : "Tugaskan Kursus"}
          </Button>
          {state.error && <p role="alert" className="text-xs text-destructive">{state.error}</p>}
          {state.success && <p className="text-xs text-emerald-700">Kursus ditugaskan.</p>}
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">Tiada Pensyarah atau kursus aktif.</p>
      )}
      {assignments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium">Tugasan Pensyarah</h3>
          <ul className="mt-2 space-y-2">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                <span>{a.userName} · {a.courseCode}</span>
                <form action={removeAction}>
                  <input type="hidden" name="assignmentId" value={a.id} />
                  <Button type="submit" variant="outline" size="sm" disabled={removing}>
                    Buang
                  </Button>
                </form>
              </li>
            ))}
          </ul>
          {removeState.error && <p role="alert" className="text-xs text-destructive">{removeState.error}</p>}
        </div>
      )}
    </div>
  );
}
