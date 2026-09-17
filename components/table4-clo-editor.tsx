"use client";

import { useActionState, useRef, useState } from "react";
import {
  addCloAction,
  removeCloAction,
  updateCloAction,
  toggleCloPloMappingAction,
  type CloFormState,
} from "@/app/actions/table4";
import { Button } from "@/components/ui/button";
import { BilingualLabel, BilingualTextarea } from "@/components/table4-bilingual-label";
import { TaxonomyPicker } from "@/components/taxonomy-picker";
import { taxonomyCode, type TaxonomyDomainKey } from "@/lib/taxonomy-data";
import { deriveMqfClusters, MQF_CODE_LABEL } from "@/lib/mqf-legend";

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

const initialAdd: CloFormState = {};
const inputClass = "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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
    initialAdd
  );

  return (
    <div className="space-y-4">
      {plos.length === 0 && (
        <p className="rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-sm text-warning sm:text-xs">
          Belum ada PLO didaftarkan untuk program ini. Tambah PLO dahulu di
          Urus Katalog &rarr; Semua Program supaya pemetaan CLO&ndash;PLO boleh dibuat.
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
        <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
          + Tambah CLO
        </Button>
      )}

      {!readOnly && isAddOpen && (
        <form ref={formRef} action={addAction} className="space-y-4 rounded-lg border border-border bg-card p-3.5 sm:p-4">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <BilingualLabel en="Teaching Methods" ms="Kaedah Penyampaian" />
              <input name="teachingMethods" className={inputClass} />
            </div>
            <div>
              <BilingualLabel en="Assessment Methods" ms="Kaedah Penilaian" />
              <input name="assessmentMethods" className={inputClass} />
            </div>
          </div>
          <TaxonomyPicker />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" disabled={isAdding}>
              {isAdding ? "Menambah..." : "Tambah CLO"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddOpen(false)}>
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

const initialUpdate: CloFormState = {};

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
  const [removeState, removeAction] = useActionState(removeCloAction, initialAdd);
  const [toggleState, toggleAction] = useActionState(toggleCloPloMappingAction, initialAdd);
  const [updateState, updateAction, isUpdating] = useActionState(
    async (previousState: CloFormState, formData: FormData) => {
      const result = await updateCloAction(previousState, formData);
      if (!result.error) setIsEditing(false);
      return result;
    },
    initialUpdate
  );

  const cloTextSplit = splitBilingual(clo.text);

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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <BilingualLabel en="Teaching Methods" ms="Kaedah Penyampaian" />
              <input name="teachingMethods" defaultValue={clo.teachingMethods ?? ""} className={inputClass} />
            </div>
            <div>
              <BilingualLabel en="Assessment Methods" ms="Kaedah Penilaian" />
              <input name="assessmentMethods" defaultValue={clo.assessmentMethods ?? ""} className={inputClass} />
            </div>
          </div>
          <TaxonomyPicker defaultDomain={clo.taxonomyDomain} defaultLevel={clo.taxonomyLevel} />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" disabled={isUpdating}>
              {isUpdating ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
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
          {(clo.teachingMethods || clo.assessmentMethods) && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {clo.teachingMethods && <>Penyampaian: {clo.teachingMethods}</>}
              {clo.teachingMethods && clo.assessmentMethods && " · "}
              {clo.assessmentMethods && <>Penilaian: {clo.assessmentMethods}</>}
            </p>
          )}
          {(() => {
            const mappedPloNumbers = plos
              .filter((p) => clo.mappedPloIds.includes(p.id))
              .map((p) => p.orderNumber);
            const derivedMqf = deriveMqfClusters(mappedPloNumbers);
            return derivedMqf.length > 0 ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Kluster MQF (auto, ikut PLO): {derivedMqf.map((code) => `${code} — ${MQF_CODE_LABEL[code]}`).join("; ")}
              </p>
            ) : null;
          })()}
          {clo.taxonomyDomain && clo.taxonomyLevel && (
            <p className="mt-1 text-xs text-muted-foreground">
              Taksonomi: {taxonomyCode(clo.taxonomyDomain, clo.taxonomyLevel)}
            </p>
          )}
        </div>
        {!readOnly && (
          <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
            <Button type="button" variant="ghost" size="xs" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <form
              action={removeAction}
              onSubmit={(e) => {
                if (!confirm(`Adakah anda pasti mahu membuang CLO${clo.orderIndex} ini?`)) {
                  e.preventDefault();
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

      {plos.length > 0 && (
        <>
          <p className="mt-3 text-sm text-muted-foreground sm:text-xs">
            Pilih PLO yang berkaitan. PLO yang dipilih ditanda dengan ✓ dan Kluster MQF akan dikira automatik.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {plos.map((plo) => {
              const mapped = clo.mappedPloIds.includes(plo.id);
              return (
                <form key={plo.id} action={toggleAction}>
                  <input type="hidden" name="versionId" value={versionId} />
                  <input type="hidden" name="courseId" value={courseId} />
                  <input type="hidden" name="cloId" value={clo.id} />
                  <input type="hidden" name="programmePloId" value={plo.id} />
                  <button
                    type="submit"
                    disabled={readOnly}
                    title={plo.textMs}
                    aria-pressed={mapped}
                    className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-[background-color,border-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] disabled:cursor-default ${
                      mapped
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    {mapped && <span aria-hidden>✓</span>}
                    PLO{plo.orderNumber}
                  </button>
                </form>
              );
            })}
          </div>
        </>
      )}
      {(removeState?.error || toggleState?.error) && (
        <p role="alert" className="mt-2 text-sm text-destructive sm:text-xs">
          {removeState?.error || toggleState?.error}
        </p>
      )}
    </li>
  );
}
