"use client";

import { useActionState, useRef, useState } from "react";
import { assignRoleAction, type AssignRoleState } from "@/app/actions/user-admin";
import { FormSelect } from "@/components/form-field";
import { Button } from "@/components/ui/button";

const initialState: AssignRoleState = {};

const ROLE_OPTIONS: { value: string; label: string; needsProgramme: boolean }[] = [
  { value: "ADMIN", label: "Admin", needsProgramme: false },
  { value: "FACULTY_OFFICER", label: "Pegawai Akademik", needsProgramme: false },
  { value: "PROGRAMME_COORDINATOR", label: "Penyelaras Program", needsProgramme: true },
  { value: "COURSE_COORDINATOR", label: "Penyelaras Kursus", needsProgramme: true },
  { value: "LECTURER", label: "Pensyarah", needsProgramme: true },
];

export function AssignRoleForm({
  users,
  programmes,
}: {
  users: { id: string; name: string; email: string }[];
  programmes: { id: string; code: string; nameMs: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedRole, setSelectedRole] = useState(ROLE_OPTIONS[0].value);
  const [state, formAction, isPending] = useActionState(
    async (previousState: AssignRoleState, formData: FormData) => {
      const result = await assignRoleAction(previousState, formData);
      if (result.success) {
        formRef.current?.reset();
        setSelectedRole(ROLE_OPTIONS[0].value);
      }
      return result;
    },
    initialState
  );
  const needsProgramme = ROLE_OPTIONS.find(
    (r) => r.value === selectedRole
  )?.needsProgramme;

  if (users.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Tambah pengguna dahulu sebelum boleh memberi peranan.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <FormSelect label="Pengguna" name="userId" required defaultValue="">
          <option value="" disabled>
            Pilih pengguna
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
      </FormSelect>

      <FormSelect
        label="Peranan"
        name="role"
        value={selectedRole}
        onChange={(event) => setSelectedRole(event.target.value)}
      >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
      </FormSelect>

      {needsProgramme && (
        <FormSelect label="Program" name="programmeId" required defaultValue="">
            <option value="" disabled>
              Pilih program
            </option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} &mdash; {p.nameMs}
              </option>
            ))}
        </FormSelect>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Memproses..." : "Beri Peranan"}
        </Button>
        {state?.error && (
          <p role="alert" className="text-xs text-destructive">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-xs text-emerald-700">Peranan diberikan.</p>
        )}
      </div>
    </form>
  );
}
