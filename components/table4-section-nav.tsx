import type { CompletionSection } from "@/lib/table4-completion";

const NAV_ITEMS = [
  { key: "basic", href: "#basic", label: "1 Maklumat Kursus" },
  { key: "clo", href: "#clo", label: "2 CLO / PLO" },
  { key: "slt", href: "#slt", label: "3 SLT" },
  { key: "assessment", href: "#assessment", label: "4 Penilaian" },
  { key: "other", href: "#other", label: "5 Maklumat Lain" },
  { key: "review", href: "#review", label: "6 Review" },
];

export function Table4SectionNav({
  percentage,
  sections,
}: {
  percentage: number;
  sections: CompletionSection[];
}) {
  const byKey = new Map(sections.map((section) => [section.key, section]));

  return (
    <div className="sticky top-0 z-20 -mx-2 mb-6 border-y border-border bg-background/95 px-2 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-1.5" aria-label="Navigasi bahagian Table 4">
          {NAV_ITEMS.map((item) => {
            const completion = byKey.get(item.key);
            return (
              <a
                key={item.key}
                href={item.href}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
              >
                {completion ? (completion.complete ? "✓ " : "• ") : ""}
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="min-w-[180px] rounded-md border border-border bg-card px-3 py-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-foreground">Kelengkapan</span>
            <span className="font-semibold text-primary">{percentage}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
