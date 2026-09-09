"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createProgrammeAction,
  type CreateProgrammeState,
} from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";

const initialState: CreateProgrammeState = {};

export function AddProgrammeForm() {
  const [state, formAction, isPending] = useActionState(
    createProgrammeAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <FormField
        label="Kod Program"
        name="code"
        hint="Kod ringkas dan unik untuk program ini."
        placeholder="Contoh: STC"
        required
      />
      <FormField
        label="Nama Program (Bahasa Malaysia)"
        name="nameMs"
        placeholder="Contoh: Sarjana Muda Sains Komputer"
        required
      />
      <FormField
        label="Nama Program (Bahasa Inggeris)"
        name="nameEn"
        hint="Pilihan — boleh tinggalkan kosong."
        placeholder="Contoh: Bachelor of Computer Science"
      />

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Mencipta..." : "Tambah Program"}
        </Button>
        {state?.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-sm font-medium text-emerald-700">
            Program berjaya ditambah.
          </p>
        )}
      </div>
    </form>
  );
}
