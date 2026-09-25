import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[65vh] items-center justify-center px-4 py-12">
      <section className="w-full max-w-lg rounded-xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-primary">Ralat 404</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Halaman tidak dapat dibuka
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Halaman tidak dijumpai atau anda tiada akses kepadanya.
        </p>
        <Link href="/" className={buttonVariants({ className: "mt-6" })}>
          Kembali ke Senarai Kursus
        </Link>
      </section>
    </main>
  );
}
