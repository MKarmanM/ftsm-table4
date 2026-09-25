"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          FTSM &middot; UKM
        </p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">
          Log Masuk
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sistem Pengurusan Proforma Kursus (Table 4)
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <FormField
            label="Emel"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@ftsm.ukm.edu.my"
          />
          <FormField
            label="Kata Laluan"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />

          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Log masuk..." : "Log Masuk"}
          </Button>
        </form>

        <Link
          href="/forgot-password"
          className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Lupa kata laluan?
        </Link>
      </div>
    </div>
  );
}
