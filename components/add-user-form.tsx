"use client";

import { useActionState, useRef, useEffect } from "react";
import { createUserAction, type CreateUserState } from "@/app/actions/user-admin";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";

const initialState: CreateUserState = {};

export function AddUserForm() {
  const [state, formAction, isPending] = useActionState(
    createUserAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nama Penuh" name="name" placeholder="Dr. Ali bin Ahmad" required />
        <FormField label="No. Staf — pilihan" name="staffNo" placeholder="A1234" />
      </div>
      <FormField
        label="Emel"
        name="email"
        type="email"
        placeholder="ali@ftsm.ukm.edu.my"
        required
      />
      <FormField
        label="Kata Laluan Awal"
        name="password"
        type="password"
        placeholder="Sekurang-kurangnya 8 aksara"
        required
      />

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Mencipta..." : "Tambah Pengguna"}
        </Button>
        {state?.error && (
          <p role="alert" className="text-xs text-destructive">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-xs text-emerald-700">Pengguna ditambah.</p>
        )}
      </div>
    </form>
  );
}
