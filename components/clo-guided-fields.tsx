"use client";

import { useMemo, useState } from "react";
import { BilingualLabel } from "@/components/table4-bilingual-label";
import { TaxonomyReferenceLink } from "@/components/taxonomy-reference-modal";
import {
  TAXONOMY_CODE_PREFIX,
  TAXONOMY_DOMAIN_LABEL,
  TAXONOMY_LEVELS,
  type TaxonomyDomainKey,
} from "@/lib/taxonomy-data";
import { getPloCloGuidance, PLO_CLO_MASTER } from "@/lib/plo-clo-master-data";

type Plo = { id: string; orderNumber: number; textMs: string };

const selectClass =
  "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted/30 disabled:text-muted-foreground";

export function CloGuidedFields({
  plos,
  defaultMappedPloIds = [],
  defaultDomain,
  defaultLevel,
  defaultTeachingMethod,
  defaultAssessmentMethod,
}: {
  plos: Plo[];
  defaultMappedPloIds?: string[];
  defaultDomain?: TaxonomyDomainKey | null;
  defaultLevel?: number | null;
  defaultTeachingMethod?: string | null;
  defaultAssessmentMethod?: string | null;
}) {
  const [mappedPloId, setMappedPloId] = useState<string>(defaultMappedPloIds[0] ?? "");
  const [domain, setDomain] = useState<TaxonomyDomainKey | "">(defaultDomain ?? "");
  const [level, setLevel] = useState<number | "">(defaultLevel ?? "");
  const [teachingMethod, setTeachingMethod] = useState(defaultTeachingMethod ?? "");
  const [assessmentMethod, setAssessmentMethod] = useState(defaultAssessmentMethod ?? "");

  const selectedPloNumbers = useMemo(() => {
    const selected = plos.find((plo) => plo.id === mappedPloId);
    return selected ? [selected.orderNumber] : [];
  }, [mappedPloId, plos]);

  const guidance = useMemo(
    () => getPloCloGuidance(selectedPloNumbers),
    [selectedPloNumbers]
  );

  const effectiveDomain: TaxonomyDomainKey | "" =
    guidance.taxonomyDomains.length === 1
      ? guidance.taxonomyDomains[0]
      : domain && guidance.taxonomyDomains.includes(domain)
        ? domain
        : "";

  const allowedLevels = effectiveDomain
    ? guidance.taxonomyLevels[effectiveDomain] ?? []
    : [];

  const effectiveLevel =
    level && allowedLevels.includes(Number(level)) ? level : "";

  const effectiveTeachingMethod = guidance.teachingMethods.includes(teachingMethod)
    ? teachingMethod
    : "";

  const effectiveAssessmentMethod =
    guidance.assessmentMethods.includes(assessmentMethod)
      ? assessmentMethod
      : "";

  const selectedLevelInfo =
    effectiveDomain && effectiveLevel
      ? TAXONOMY_LEVELS[effectiveDomain].find((item) => item.level === Number(effectiveLevel))
      : null;

  const selectPlo = (id: string) => {
    setMappedPloId(id);
    setDomain("");
    setLevel("");
    setTeachingMethod("");
    setAssessmentMethod("");
  };


  return (
    <div className="space-y-4">
      <div>
        <BilingualLabel
          en="Programme Learning Outcome (PLO)"
          ms="Pemetaan Hasil Pembelajaran Program (PLO)"
        />
        <p className="mt-0.5 text-xs text-muted-foreground">
          Pilih satu PLO sahaja. Sistem akan menapis domain, tahap taksonomi dan
          kaedah yang sesuai berdasarkan master data.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {plos.map((plo) => {
            const selected = mappedPloId === plo.id;
            return (
              <button
                key={plo.id}
                type="button"
                title={PLO_CLO_MASTER[plo.orderNumber]?.learningOutcomeDomain ?? plo.textMs}
                aria-pressed={selected}
                onClick={() => selectPlo(plo.id)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-[background-color,border-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                }`}
              >
                {selected && <span aria-hidden>✓</span>}
                PLO{plo.orderNumber}
              </button>
            );
          })}
        </div>
        {mappedPloId && (
          <input type="hidden" name="programmePloIds" value={mappedPloId} />
        )}
        {guidance.entries.length > 0 && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Domain hasil pembelajaran:{" "}
            {guidance.entries
              .map(
                ({ number, entry }) =>
                  `PLO${number} — ${entry.learningOutcomeDomain}`
              )
              .join("; ")}
          </p>
        )}
      </div>

      <div>
        <BilingualLabel en="Taxonomy Level" ms="Tahap Taksonomi" />
        <p className="mt-0.5 text-xs text-muted-foreground">
          Domain ditentukan oleh PLO. Untuk PLO yang mempunyai lebih daripada
          satu domain, pilih domain yang sesuai dahulu.
        </p>
        <div className="mt-1.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            name="taxonomyDomain"
            value={effectiveDomain}
            disabled={guidance.taxonomyDomains.length === 0}
            onChange={(event) => {
              setDomain(event.target.value as TaxonomyDomainKey | "");
              setLevel("");
            }}
            className={selectClass}
          >
            <option value="">&mdash; Pilih Domain &mdash;</option>
            {guidance.taxonomyDomains.map((item) => (
              <option key={item} value={item}>
                {TAXONOMY_DOMAIN_LABEL[item]}
              </option>
            ))}
          </select>
          <select
            name="taxonomyLevel"
            value={effectiveLevel}
            disabled={!effectiveDomain || allowedLevels.length === 0}
            onChange={(event) =>
              setLevel(event.target.value ? Number(event.target.value) : "")
            }
            className={selectClass}
          >
            <option value="">&mdash; Pilih Tahap &mdash;</option>
            {allowedLevels.map((allowedLevel) => {
              const info = TAXONOMY_LEVELS[effectiveDomain as TaxonomyDomainKey].find(
                (item) => item.level === allowedLevel
              );
              return (
                <option key={allowedLevel} value={allowedLevel}>
                  {TAXONOMY_CODE_PREFIX[effectiveDomain as TaxonomyDomainKey]}
                  {allowedLevel}
                  {info ? ` — ${info.name}` : ""}
                </option>
              );
            })}
          </select>
        </div>
        <TaxonomyReferenceLink domain={effectiveDomain} />

        {selectedLevelInfo && (
          <div className="mt-2 rounded-md border border-border bg-muted/20 p-3 text-xs">
            <p className="font-medium text-foreground">
              Cadangan kata kerja untuk{" "}
              {TAXONOMY_CODE_PREFIX[effectiveDomain as TaxonomyDomainKey]}
              {selectedLevelInfo.level} ({selectedLevelInfo.name}):
            </p>
            <p className="mt-1 text-muted-foreground">
              {selectedLevelInfo.verbs.slice(0, 12).join(", ")}
              {selectedLevelInfo.verbs.length > 12 && ", ..."}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <BilingualLabel en="Teaching Method" ms="Kaedah Penyampaian" />
          <select
            name="teachingMethods"
            value={effectiveTeachingMethod}
            disabled={guidance.teachingMethods.length === 0}
            onChange={(event) => setTeachingMethod(event.target.value)}
            className={selectClass}
          >
            <option value="">&mdash; Pilih satu cadangan &mdash;</option>
            {guidance.teachingMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
        <div>
          <BilingualLabel en="Assessment Method" ms="Kaedah Penilaian" />
          <select
            name="assessmentMethods"
            value={effectiveAssessmentMethod}
            disabled={guidance.assessmentMethods.length === 0}
            onChange={(event) => setAssessmentMethod(event.target.value)}
            className={selectClass}
          >
            <option value="">&mdash; Pilih satu cadangan &mdash;</option>
            {guidance.assessmentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
