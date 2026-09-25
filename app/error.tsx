"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the full error only in the browser console for technical diagnosis.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[65vh] items-center justify-center px-4 py-12">
      <section
        role="alert"
        className="w-full max-w-lg rounded-xl border border-border bg-card p-6 text-center shadow-sm sm:p-8"
      >
        <p className="text-sm font-semibold text-destructive">Ralat sistem</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Halaman tidak dapat dimuatkan
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Sambungan ke sistem mungkin terganggu buat sementara waktu. Sila cuba
          semula.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Kod rujukan: {error.digest ?? "Tidak tersedia"}
        </p>
        <Button type="button" className="mt-6" onClick={reset}>
          Cuba semula
        </Button>
      </section>
    </main>
  );
}
