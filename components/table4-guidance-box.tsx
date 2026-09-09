"use client";

import { useState } from "react";

export function GuidanceBox() {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-6 rounded-md border border-warning/30 bg-warning/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold tracking-wide text-warning uppercase">
          <span aria-hidden>&#9432;</span> Panduan / Guidance
        </span>
        <span className="text-xs text-warning">{open ? "Sorok \u25B2" : "Lihat \u25BC"}</span>
      </button>
      {open && (
        <ol className="list-decimal space-y-1 px-4 pb-4 pl-9 text-xs text-foreground/80">
          <li>Borang ini perlu diisi dengan lengkap dalam dwibahasa.</li>
          <li>
            Perkataan Bahasa Inggeris perlu ditaip <span className="italic">condong (italic)</span>.
          </li>
          <li>Senarai rujukan perlu rujuk &lsquo;Panduan Penulisan Tesis Gaya UKM&rsquo;.</li>
        </ol>
      )}
    </div>
  );
}
