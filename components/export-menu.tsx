"use client";

import { useState, useRef, useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";

export function ExportMenu({ courseId, versionId }: { courseId: string; versionId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Eksport &#9662;
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-md border border-border bg-card shadow-sm">
          <a
            href={`/courses/${courseId}/versions/${versionId}/cetak?export=word`}
            className="block px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            Pratonton & Eksport Word
          </a>
          <a
            href={`/courses/${courseId}/versions/${versionId}/cetak?export=excel`}
            className="block border-t border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            Pratonton & Eksport Excel
          </a>
        </div>
      )}
    </div>
  );
}
