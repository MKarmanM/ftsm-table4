"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  requestPasswordResetAction,
  type RequestResetState,
} from "@/app/actions/password-reset";
import { Button } from "@/components/ui/button";

const initialState: RequestResetState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    initialState
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          FTSM &middot; UKM
        </p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">
          Lupa Kata Laluan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Masukkan emel anda untuk menerima pautan set semula kata laluan.
        </p>

        {state?.message ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-foreground">{state.message}</p>
            <Link
              href="/login"
              className="text-sm font-medium text-primary hover:underline"
            >
              &larr; Kembali ke log masuk
            </Link>
          </div>
        ) : (
          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Emel
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nama@ftsm.ukm.edu.my"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            {state?.error && (
              <p role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Menghantar..." : "Hantar Pautan Set Semula"}
            </Button>

            <Link
              href="/login"
              className="block text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Kembali ke log masuk
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
