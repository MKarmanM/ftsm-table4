"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createCourseAction,
  type CreateCourseState,
} from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";
import { FormField, FormSelect } from "@/components/form-field";

const initialState: CreateCourseState = {};

export function AddCourseForm({
  programmes,
}: {
  programmes: { id: string; code: string; nameMs: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    createCourseAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  if (programmes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Sila tambah program dahulu sebelum boleh tambah kursus.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
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

      <FormField
        label="Kod Kursus"
        name="code"
        placeholder="Contoh: TTTB1024"
        required
      />

      <FormField
        label="Nama Kursus (Bahasa Malaysia)"
        name="nameMs"
        placeholder="Contoh: Pengaturcaraan Berstruktur"
        required
      />
      <FormField
        label="Nama Kursus (Bahasa Inggeris)"
        name="nameEn"
        hint="Pilihan — boleh tinggalkan kosong."
        placeholder="Contoh: Structured Programming"
      />
      <p className="text-xs text-muted-foreground">
        Nilai kredit akan dikira automatik daripada jam SLT bila draf Table
        4 diisi — tidak perlu ditetapkan semasa tambah kursus.
      </p>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Mencipta..." : "Tambah Kursus"}
        </Button>
        {state?.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-sm font-medium text-emerald-700">
            Kursus berjaya ditambah.
          </p>
        )}
      </div>
    </form>
  );
}
