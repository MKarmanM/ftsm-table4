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
          <span aria-hidden>&#9432;</span> Panduan Pengisian
        </span>
        <span className="text-xs text-warning">{open ? "Sorok ▲" : "Lihat ▼"}</span>
      </button>
      {open && (
        <ol className="list-decimal space-y-1 px-4 pb-4 pl-9 text-xs text-foreground/80">
          <li>Lengkapkan maklumat Table 4 dalam Bahasa Melayu dan Bahasa Inggeris mengikut ruangan yang disediakan.</li>
          <li>Teks Bahasa Inggeris akan dipaparkan secara condong secara automatik oleh sistem.</li>
          <li>Senarai rujukan hendaklah mengikut &lsquo;Panduan Penulisan Tesis Gaya UKM&rsquo;.</li>
          <li>Status kelengkapan di atas boleh digunakan untuk melihat bahagian yang masih belum lengkap.</li>
        </ol>
      )}
    </div>
  );
}
