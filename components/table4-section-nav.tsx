"use client";

import { useEffect, useMemo, useState } from "react";
import type { CompletionSection } from "@/lib/table4-completion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { key: "basic", href: "#basic", label: "1 Maklumat Kursus" },
  { key: "clo", href: "#clo", label: "2 CLO / PLO" },
  { key: "slt", href: "#slt", label: "3 SLT" },
  { key: "assessment", href: "#assessment", label: "4 Penilaian" },
  { key: "other", href: "#other", label: "5 Maklumat Lain" },
  { key: "review", href: "#review", label: "6 Semakan" },
] as const;

export function Table4SectionNav({
  percentage,
  sections,
}: {
  percentage: number;
  sections: CompletionSection[];
}) {
  const byKey = useMemo(
    () => new Map(sections.map((section) => [section.key, section])),
    [sections]
  );
  const [activeKey, setActiveKey] = useState("basic");

  useEffect(() => {
    const sectionIds = NAV_ITEMS.map((item) => item.key);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveKey(visible.target.id);
      },
      { rootMargin: "-22% 0px -62% 0px", threshold: [0.01, 0.2, 0.5] }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-5 border-y border-border bg-background/95 px-4 py-2.5 shadow-[0_1px_0_rgb(15_42_67_/_0.03)] backdrop-blur supports-[backdrop-filter]:bg-background/88 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-3">
        <nav
          className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Navigasi bahagian Table 4"
        >
          {NAV_ITEMS.map((item) => {
            const completion = byKey.get(item.key);
            const active = activeKey === item.key;
            return (
              <a
                key={item.key}
                href={item.href}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : completion?.complete
                      ? "border-success/20 bg-success/5 text-foreground hover:border-success/30 hover:bg-success/10"
                      : "border-border bg-card text-foreground hover:border-primary/25 hover:bg-primary/5"
                )}
              >
                {completion?.complete ? (
                  <span className={cn("text-xs", active ? "text-primary-foreground" : "text-success")}>✓</span>
                ) : (
                  <span className={cn("text-xs", active ? "text-primary-foreground" : "text-warning")}>•</span>
                )}
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm sm:flex">
          <span className="text-muted-foreground">Lengkap</span>
          <span className="font-semibold text-primary">{percentage}%</span>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted lg:w-28">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
