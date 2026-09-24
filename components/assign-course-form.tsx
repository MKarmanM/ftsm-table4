"use client";

import { useActionState, useRef } from "react";
import {
  assignCourseAction,
  removeCourseAssignmentAction,
  type AssignCourseState,
} from "@/app/actions/user-admin";
import { Button } from "@/components/ui/button";

type Lecturer = {
  id: string;
  name: string;
  email: string;
  programmeCodes: string[];
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
      <p className="text-xs text-muted-foreground">
        Tugasan membolehkan Pensyarah melihat Table 4 kursus yang ditetapkan.
        Suntingan draf kekal untuk Penyelaras Kursus.
      </p>
      {lecturers.length > 0 && courses.length > 0 ? (
        <form ref={formRef} action={action} className="space-y-3">
          <div>
            <label htmlFor="assignment-user" className="block text-sm font-medium">Pensyarah</label>
            <select id="assignment-user" name="userId" required defaultValue=""
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="" disabled>Pilih Pensyarah</option>
              {lecturers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="assignment-course" className="block text-sm font-medium">Kursus</label>
            <select id="assignment-course" name="courseId" required defaultValue=""
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="" disabled>Pilih kursus</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.programmeCode} · {c.code} — {c.nameMs}</option>
              ))}
            </select>
          </div>
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
