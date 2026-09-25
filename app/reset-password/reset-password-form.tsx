"use client";

import { useActionState } from "react";
import {
  resetPasswordAction,
  type ResetPasswordState,
} from "@/app/actions/password-reset";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    initialState
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <FormField
        label="Kata Laluan Baharu"
        name="password"
        type="password"
        required
        autoComplete="new-password"
        placeholder="Sekurang-kurangnya 8 aksara"
      />
      <FormField
        label="Sahkan Kata Laluan Baharu"
        name="confirmPassword"
        type="password"
        required
        autoComplete="new-password"
      />

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Menyimpan..." : "Set Semula Kata Laluan"}
      </Button>
    </form>
  );
}
