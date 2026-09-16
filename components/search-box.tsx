export function SearchBox({
  placeholder,
  defaultValue,
}: {
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <form method="GET" className="mb-4 flex max-w-sm gap-2">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <button
        type="submit"
        className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
      >
        Cari
      </button>
    </form>
  );
}
