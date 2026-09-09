"use client";

import { useState } from "react";
import {
  TAXONOMY_LEVELS,
  TAXONOMY_DOMAIN_LABEL,
  TAXONOMY_CODE_PREFIX,
  type TaxonomyDomainKey,
} from "@/lib/taxonomy-data";
import { BilingualLabel } from "@/components/table4-bilingual-label";
import { TaxonomyReferenceLink } from "@/components/taxonomy-reference-modal";

const DOMAIN_OPTIONS: TaxonomyDomainKey[] = ["KOGNITIF", "AFEKTIF", "PSIKOMOTOR"];

export function TaxonomyPicker({
  defaultDomain,
  defaultLevel,
  readOnly,
}: {
  defaultDomain?: TaxonomyDomainKey | null;
  defaultLevel?: number | null;
  readOnly?: boolean;
}) {
  const [domain, setDomain] = useState<TaxonomyDomainKey | "">(defaultDomain ?? "");
  const [level, setLevel] = useState<number | "">(defaultLevel ?? "");

  const levels = domain ? TAXONOMY_LEVELS[domain] : [];
  const selectedLevelInfo = domain && level ? levels.find((l) => l.level === level) : null;

  return (
    <div>
      <BilingualLabel en="Taxonomy Level" ms="Tahap Taksonomi" />
      <p className="mt-0.5 text-xs text-muted-foreground">
        Pilih domain dan tahap untuk dapatkan cadangan kata kerja CLO.
      </p>
      <div className="mt-1.5 grid grid-cols-2 gap-3">
        <select
          name="taxonomyDomain"
          value={domain}
          disabled={readOnly}
          onChange={(e) => {
            setDomain(e.target.value as TaxonomyDomainKey | "");
            setLevel("");
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
        >
          <option value="">&mdash; Pilih Domain &mdash;</option>
          {DOMAIN_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {TAXONOMY_DOMAIN_LABEL[d]}
            </option>
          ))}
        </select>
        <select
          name="taxonomyLevel"
          value={level}
          disabled={readOnly || !domain}
          onChange={(e) => setLevel(e.target.value ? Number(e.target.value) : "")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
        >
          <option value="">&mdash; Pilih Tahap &mdash;</option>
          {levels.map((l) => (
            <option key={l.level} value={l.level}>
              {TAXONOMY_CODE_PREFIX[domain as TaxonomyDomainKey]}
              {l.level} &mdash; {l.name}
            </option>
          ))}
        </select>
      </div>
      <TaxonomyReferenceLink domain={domain} />

      {selectedLevelInfo && (
        <div className="mt-2 rounded-md border border-border bg-muted/20 p-3 text-xs">
          <p className="font-medium text-foreground">
            Cadangan kata kerja untuk{" "}
            {TAXONOMY_CODE_PREFIX[domain as TaxonomyDomainKey]}
            {selectedLevelInfo.level} ({selectedLevelInfo.name}):
          </p>
          <p className="mt-1 text-muted-foreground">
            {selectedLevelInfo.verbs.slice(0, 12).join(", ")}
            {selectedLevelInfo.verbs.length > 12 && ", ..."}
          </p>
        </div>
      )}
    </div>
  );
}
