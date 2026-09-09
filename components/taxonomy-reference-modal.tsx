"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { TaxonomyDomainKey } from "@/lib/taxonomy-data";

const TAXONOMY_IMAGES: Record<TaxonomyDomainKey, { src: string; alt: string }> = {
  KOGNITIF: { src: "/taxonomy/kognitif.png", alt: "Jadual Kata Kerja Taksonomi Kognitif" },
  AFEKTIF: { src: "/taxonomy/afektif.png", alt: "Jadual Kata Kerja Taksonomi Afektif" },
  PSIKOMOTOR: { src: "/taxonomy/psikomotor.png", alt: "Jadual Kata Kerja Taksonomi Psikomotor" },
};

export function TaxonomyReferenceLink({ domain }: { domain: TaxonomyDomainKey | "" }) {
  const [open, setOpen] = useState(false);
  // Portals need a browser document to attach to — guard against
  // running during server rendering.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!domain) return null;
  const img = TAXONOMY_IMAGES[domain];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 text-xs font-medium text-primary hover:underline"
      >
        Lihat carta rujukan kata kerja &rarr;
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="relative max-h-[90vh] max-w-3xl overflow-auto rounded-lg bg-card p-3 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-foreground/80 text-lg leading-none text-white hover:bg-foreground"
              >
                &times;
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} className="h-auto w-full rounded" />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
