export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Memuatkan halaman"
      className="flex min-h-[65vh] w-full items-center justify-center px-4 py-12"
    >
      <div
        aria-hidden="true"
        className="w-full max-w-md animate-pulse space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <div className="mx-auto size-12 rounded-full bg-muted" />
        <div className="space-y-3">
          <div className="mx-auto h-6 w-3/5 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="mx-auto h-4 w-4/5 rounded bg-muted" />
        </div>
        <div className="mx-auto h-9 w-32 rounded-lg bg-muted" />
      </div>
    </main>
  );
}
