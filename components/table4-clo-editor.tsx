"use client";

import { useActionState, useRef, useState } from "react";
import {
  addCloAction,
  removeCloAction,
  updateCloAction,
  type CloFormState,
} from "@/app/actions/table4";
import { Button } from "@/components/ui/button";
import { BilingualTextarea } from "@/components/table4-bilingual-label";
import { CloGuidedFields } from "@/components/clo-guided-fields";
import { taxonomyCode, type TaxonomyDomainKey } from "@/lib/taxonomy-data";
import { deriveMqfClusters, MQF_CODE_LABEL } from "@/lib/mqf-legend";
import { getPloCloGuidance } from "@/lib/plo-clo-master-data";

function splitBilingual(combined: string): { bm: string; en: string } {
  const [first, ...rest] = combined.split("\n");
  return { bm: first ?? "", en: rest.join("\n") };
}

type Clo = {
  id: string;
  orderIndex: number;
  text: string;
  teachingMethods: string | null;
  assessmentMethods: string | null;
  mqfClusters: string[];
  taxonomyDomain: TaxonomyDomainKey | null;
  taxonomyLevel: number | null;
  mappedPloIds: string[];
};

type Plo = { id: string; orderNumber: number; textMs: string };

const initialState: CloFormState = {};

export function CloEditor({
  versionId,
  courseId,
  readOnly,
  clos,
  plos,
}: {
  versionId: string;
  courseId: string;
  readOnly: boolean;
  clos: Clo[];
  plos: Plo[];
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [addState, addAction, isAdding] = useActionState(
    async (previousState: CloFormState, formData: FormData) => {
      const result = await addCloAction(previousState, formData);
      if (!result.error) {
        formRef.current?.reset();
        setIsAddOpen(false);
      }
      return result;
    },
    initialState
  );

  return (
    <div className="space-y-4">
      {plos.length === 0 && (
        <p className="rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-sm text-warning sm:text-xs">
          PLO rujukan bagi program ini belum tersedia. Hubungi pentadbir sistem
          sebelum menyediakan pemetaan CLO&ndash;PLO.
        </p>
      )}

      {clos.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Belum ada CLO.</p>
      ) : (
        <ul className="space-y-3">
          {clos.map((clo) => (
            <CloRow
              key={clo.id}
              clo={clo}
              plos={plos}
              versionId={versionId}
              courseId={courseId}
              readOnly={readOnly}
            />
          ))}
        </ul>
      )}

      {!readOnly && !isAddOpen && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddOpen(true)}
          disabled={plos.length === 0}
        >
          + Tambah CLO
        </Button>
      )}

      {!readOnly && isAddOpen && (
        <form
          ref={formRef}
          action={addAction}
          className="space-y-4 rounded-lg border border-border bg-card p-3.5 sm:p-4"
        >
          <input type="hidden" name="versionId" value={versionId} />
          <input type="hidden" name="courseId" value={courseId} />
          <p className="text-sm font-semibold text-foreground">Tambah CLO</p>

          <BilingualTextarea
            labelEn="Course Learning Outcome"
            labelMs="Hasil Pembelajaran Kursus"
            nameBm="textBm"
            nameEn="textEn"
            required
            rows={2}
          />

          <CloGuidedFields plos={plos} />

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" disabled={isAdding}>
              {isAdding ? "Menambah..." : "Tambah CLO"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddOpen(false)}
            >
              Batal
            </Button>
          </div>

          {addState?.error && (
            <p role="alert" className="text-sm text-destructive sm:text-xs">
              {addState.error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function CloRow({
  clo,
  plos,
  versionId,
  courseId,
  readOnly,
}: {
  clo: Clo;
  plos: Plo[];
  versionId: string;
  courseId: string;
  readOnly: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [removeState, removeAction] = useActionState(removeCloAction, initialState);
  const [updateState, updateAction, isUpdating] = useActionState(
    async (previousState: CloFormState, formData: FormData) => {
      const result = await updateCloAction(previousState, formData);
      if (!result.error) setIsEditing(false);
      return result;
    },
    initialState
  );

  const cloTextSplit = splitBilingual(clo.text);
  const mappedPlos = plos.filter((plo) => clo.mappedPloIds.includes(plo.id));
  const mappedPloNumbers = mappedPlos.map((plo) => plo.orderNumber);
  const derivedMqf = deriveMqfClusters(mappedPloNumbers);
  const guidance = getPloCloGuidance(mappedPloNumbers);

  if (isEditing) {
    return (
      <li className="rounded-lg border border-primary/20 bg-primary/[0.02] p-3.5 sm:p-4">
        <form action={updateAction} className="space-y-4">
          <input type="hidden" name="versionId" value={versionId} />
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="cloId" value={clo.id} />

          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Edit CLO{clo.orderIndex}
          </p>

          <BilingualTextarea
            labelEn="Course Learning Outcome"
            labelMs="Hasil Pembelajaran Kursus"
            nameBm="textBm"
            nameEn="textEn"
            defaultValueBm={cloTextSplit.bm}
            defaultValueEn={cloTextSplit.en}
            required
            rows={2}
          />

          <CloGuidedFields
            plos={plos}
            defaultMappedPloIds={clo.mappedPloIds}
            defaultDomain={clo.taxonomyDomain}
            defaultLevel={clo.taxonomyLevel}
            defaultTeachingMethod={clo.teachingMethods}
            defaultAssessmentMethod={clo.assessmentMethods}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" disabled={isUpdating}>
              {isUpdating ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Batal
            </Button>
          </div>

          {updateState?.error && (
            <p role="alert" className="text-sm text-destructive sm:text-xs">
              {updateState.error}
            </p>
          )}
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-primary/15 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            CLO{clo.orderIndex}: {cloTextSplit.bm}
          </p>

          {cloTextSplit.en && (
            <p className="mt-0.5 text-sm italic text-primary">{cloTextSplit.en}</p>
          )}

          {mappedPlos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {mappedPlos.map((plo) => (
                <span
                  key={plo.id}
                  title={plo.textMs}
                  className="inline-flex min-h-7 items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary"
                >
                  PLO{plo.orderNumber}
                </span>
              ))}
            </div>
          )}

          {guidance.entries.length > 0 && (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Domain hasil pembelajaran:{" "}
              {guidance.entries
                .map(
                  ({ number, entry }) =>
                    `PLO${number} — ${entry.learningOutcomeDomain}`
                )
                .join("; ")}
            </p>
          )}

          {(clo.teachingMethods || clo.assessmentMethods) && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {clo.teachingMethods && <>Penyampaian: {clo.teachingMethods}</>}
              {clo.teachingMethods && clo.assessmentMethods && " · "}
              {clo.assessmentMethods && <>Penilaian: {clo.assessmentMethods}</>}
            </p>
          )}

          {derivedMqf.length > 0 && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Kluster MQF:{" "}
              {derivedMqf
                .map((code) => `${code} — ${MQF_CODE_LABEL[code]}`)
                .join("; ")}
            </p>
          )}

          {clo.taxonomyDomain && clo.taxonomyLevel && (
            <p className="mt-1 text-xs text-muted-foreground">
              Taksonomi: {taxonomyCode(clo.taxonomyDomain, clo.taxonomyLevel)}
            </p>
          )}
        </div>

        {!readOnly && (
          <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
            <form
              action={removeAction}
              onSubmit={(event) => {
                if (
                  !confirm(
                    `Adakah anda pasti mahu membuang CLO${clo.orderIndex} ini?`
                  )
                ) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="versionId" value={versionId} />
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="cloId" value={clo.id} />
              <Button type="submit" variant="destructive" size="xs">
                Buang
              </Button>
            </form>
          </div>
        )}
      </div>

      {removeState?.error && (
        <p role="alert" className="mt-2 text-sm text-destructive sm:text-xs">
          {removeState.error}
        </p>
      )}
    </li>
  );
}
