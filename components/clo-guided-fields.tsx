"use client";

import { useEffect, useMemo, useState } from "react";
import { BilingualLabel } from "@/components/table4-bilingual-label";
import { TaxonomyReferenceLink } from "@/components/taxonomy-reference-modal";
import {
  TAXONOMY_CODE_PREFIX,
  TAXONOMY_DOMAIN_LABEL,
  TAXONOMY_LEVELS,
  type TaxonomyDomainKey,
} from "@/lib/taxonomy-data";
import { getPloCloGuidance } from "@/lib/plo-clo-master-data";

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
  const [mappedPloIds, setMappedPloIds] = useState<string[]>(defaultMappedPloIds);
  const [domain, setDomain] = useState<TaxonomyDomainKey | "">(defaultDomain ?? "");
  const [level, setLevel] = useState<number | "">(defaultLevel ?? "");
  const [teachingMethod, setTeachingMethod] = useState(defaultTeachingMethod ?? "");
  const [assessmentMethod, setAssessmentMethod] = useState(defaultAssessmentMethod ?? "");

  const selectedPloNumbers = useMemo(
    () =>
      plos
        .filter((plo) => mappedPloIds.includes(plo.id))
        .map((plo) => plo.orderNumber),
    [mappedPloIds, plos]
  );

  const guidance = useMemo(
    () => getPloCloGuidance(selectedPloNumbers),
    [selectedPloNumbers]
  );

  useEffect(() => {
    const domains = guidance.taxonomyDomains;
    if (domains.length === 1) {
      setDomain(domains[0]);
    } else if (domain && !domains.includes(domain)) {
      setDomain("");
    }

    if (teachingMethod && !guidance.teachingMethods.includes(teachingMethod)) {
      setTeachingMethod("");
    }
    if (
      assessmentMethod &&
      !guidance.assessmentMethods.includes(assessmentMethod)
    ) {
      setAssessmentMethod("");
    }
  }, [
    assessmentMethod,
    domain,
    guidance.assessmentMethods,
    guidance.taxonomyDomains,
    guidance.teachingMethods,
    teachingMethod,
  ]);

  const allowedLevels = domain ? guidance.taxonomyLevels[domain] ?? [] : [];

  useEffect(() => {
    if (level && !allowedLevels.includes(Number(level))) {
      setLevel("");
    }
  }, [allowedLevels, level]);

  const selectedLevelInfo =
    domain && level
      ? TAXONOMY_LEVELS[domain].find((item) => item.level === Number(level))
      : null;

  const togglePlo = (id: string) => {
    setMappedPloIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <BilingualLabel
          en="Programme Learning Outcome (PLO)"
          ms="Pemetaan Hasil Pembelajaran Program (PLO)"
        />
        <p className="mt-0.5 text-xs text-muted-foreground">
          Pilih PLO dahulu. Sistem akan menapis domain, tahap taksonomi dan
          kaedah yang sesuai berdasarkan master data.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {plos.map((plo) => {
            const selected = mappedPloIds.includes(plo.id);
            return (
              <button
                key={plo.id}
                type="button"
                title={plo.textMs}
                aria-pressed={selected}
                onClick={() => togglePlo(plo.id)}
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
        {mappedPloIds.map((id) => (
          <input key={id} type="hidden" name="programmePloIds" value={id} />
        ))}
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
            value={domain}
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
            value={level}
            disabled={!domain || allowedLevels.length === 0}
            onChange={(event) =>
              setLevel(event.target.value ? Number(event.target.value) : "")
            }
            className={selectClass}
          >
            <option value="">&mdash; Pilih Tahap &mdash;</option>
            {allowedLevels.map((allowedLevel) => {
              const info = TAXONOMY_LEVELS[domain as TaxonomyDomainKey].find(
                (item) => item.level === allowedLevel
              );
              return (
                <option key={allowedLevel} value={allowedLevel}>
                  {TAXONOMY_CODE_PREFIX[domain as TaxonomyDomainKey]}
                  {allowedLevel}
                  {info ? ` — ${info.name}` : ""}
                </option>
              );
            })}
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <BilingualLabel en="Teaching Method" ms="Kaedah Penyampaian" />
          <select
            name="teachingMethods"
            value={teachingMethod}
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
            value={assessmentMethod}
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
