"use client";

import { useActionState, useRef, useState } from "react";
import { assignRoleAction, type AssignRoleState } from "@/app/actions/user-admin";
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
      <div>
        <label
          htmlFor="userId"
          className="block text-sm font-medium text-foreground"
        >
          Pengguna
        </label>
        <select
          id="userId"
          name="userId"
          required
          defaultValue=""
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="" disabled>
            Pilih pengguna
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-foreground"
        >
          Peranan
        </label>
        <select
          id="role"
          name="role"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {needsProgramme && (
        <div>
          <label
            htmlFor="programmeId"
            className="block text-sm font-medium text-foreground"
          >
            Program
          </label>
          <select
            id="programmeId"
            name="programmeId"
            required
            defaultValue=""
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              Pilih program
            </option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} &mdash; {p.nameMs}
              </option>
            ))}
          </select>
        </div>
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
