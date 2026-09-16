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
        <p className="text-xs text-warning">
          Belum ada PLO didaftarkan untuk program ini. Tambah PLO dahulu di
          Urus Katalog &rarr; Semua Program supaya pemetaan CLO&ndash;PLO
          boleh dibuat.
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
        <form ref={formRef} action={addAction} className="space-y-3 rounded-md border border-border p-4">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <BilingualLabel en="Teaching Methods" ms="Kaedah Penyampaian" />
              <input
                name="teachingMethods"
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <BilingualLabel en="Assessment Methods" ms="Kaedah Penilaian" />
              <input
                name="assessmentMethods"
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
          <TaxonomyPicker />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isAdding}>
              {isAdding ? "Menambah..." : "Tambah CLO"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddOpen(false)}>
              Batal
            </Button>
          </div>
          {addState?.error && (
            <p role="alert" className="text-xs text-destructive">
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
  const [toggleState, toggleAction] = useActionState(
    toggleCloPloMappingAction,
    initialAdd
  );
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
      <li className="rounded-md border border-border p-4">
        <form action={updateAction} className="space-y-3">
          <input type="hidden" name="versionId" value={versionId} />
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="cloId" value={clo.id} />
          <p className="text-xs font-semibold text-muted-foreground uppercase">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <BilingualLabel en="Teaching Methods" ms="Kaedah Penyampaian" />
              <input
                name="teachingMethods"
                defaultValue={clo.teachingMethods ?? ""}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <BilingualLabel en="Assessment Methods" ms="Kaedah Penilaian" />
              <input
                name="assessmentMethods"
                defaultValue={clo.assessmentMethods ?? ""}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
          <TaxonomyPicker defaultDomain={clo.taxonomyDomain} defaultLevel={clo.taxonomyLevel} />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isUpdating}>
              {isUpdating ? "..." : "Simpan"}
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
            <p role="alert" className="text-xs text-destructive">
              {updateState.error}
            </p>
          )}
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-md border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            CLO{clo.orderIndex}: {cloTextSplit.bm}
          </p>
          {cloTextSplit.en && (
            <p className="mt-0.5 text-sm italic text-primary">
              {cloTextSplit.en}
            </p>
          )}
          {(clo.teachingMethods || clo.assessmentMethods) && (
            <p className="mt-1 text-xs text-muted-foreground">
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
              <p className="mt-1 text-xs text-muted-foreground">
                Kluster MQF (auto, ikut PLO):{" "}
                {derivedMqf
                  .map((code) => `${code} \u2014 ${MQF_CODE_LABEL[code]}`)
                  .join("; ")}
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
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-md px-2 py-1 text-xs font-medium text-secondary hover:bg-muted hover:text-foreground"
            >
              Edit
            </button>
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
              <button
                type="submit"
                className="rounded-md px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                Buang
              </button>
            </form>
          </div>
        )}
      </div>

      {plos.length > 0 && (
        <>
          <p className="mt-3 text-xs text-muted-foreground">
            Klik PLO untuk tetapkan pemetaan &mdash; Kluster MQF akan terbit
            automatik ikut PLO yang ditandakan.
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
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
                    className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:cursor-default ${
                      mapped
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    PLO{plo.orderNumber}
                  </button>
                </form>
              );
            })}
            
          </div>

      
        </>
      )}
      {(removeState?.error || toggleState?.error) && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {removeState?.error || toggleState?.error}
        </p>
      )}
    </li>
  );
}
