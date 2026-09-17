"use client";

import { useActionState, useRef } from "react";
import {
  saveBasicInfoAction,
  type SaveBasicInfoState,
} from "@/app/actions/table4";
import { BilingualLabel, BilingualTextarea } from "@/components/table4-bilingual-label";
import {
  EXCEL_FRAMEWORK_OPTIONS,
  FUTURE_READY_OPTIONS,
  SDG_MAX_SELECTION,
  SDG_OPTIONS,
} from "@/lib/table4-master-data";

const initialState: SaveBasicInfoState = {};

const CLASSIFICATION_OPTIONS = [
  { value: "", label: "— Pilih —" },
  { value: "WU_CITRA_WAJIB", label: "Compulsory/Wajib Universiti (WU), Citra Wajib (CW)" },
  { value: "WU_CITRA_RENTAS", label: "Compulsory/Wajib Universiti (WU), Citra Rentas (CR) C1-C6" },
  { value: "TERAS", label: "Core / Teras" },
  { value: "ELEKTIF", label: "Elective / Elektif" },
  { value: "AUDIT", label: "Audit" },
];

function fmtDateDisplay(d: Date | null) {
  if (!d) return "Belum ditetapkan";
  return new Date(d).toLocaleDateString("ms-MY");
}

function splitBilingual(combined: string | null): { bm: string; en: string } {
  if (!combined) return { bm: "", en: "" };
  const [first, ...rest] = combined.split("\n");
  return { bm: first ?? "", en: rest.join("\n") };
}

// Auto-saves when focus leaves the whole section (not on every field-to-
// field tab), so there's no separate "Simpan" button to click — content
// saves quietly as the user works, and is finalised for real when the
// draft is sent for review.
function useAutoSaveOnBlur(readOnly: boolean) {
  return (e: React.FocusEvent<HTMLFormElement>) => {
    if (readOnly) return;
    const form = e.currentTarget;
    if (!form.contains(e.relatedTarget as Node)) {
      form.requestSubmit();
    }
  };
}

function SaveStatus({ state, isPending }: { state: SaveBasicInfoState; isPending: boolean }) {
  if (isPending) {
    return (
      <p className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-sm text-muted-foreground">
        Menyimpan&hellip;
      </p>
    );
  }
  if (state?.error) {
    return (
      <p role="alert" className="inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-sm text-destructive">
        {state.error}
      </p>
    );
  }
  if (state?.success) {
    return (
      <p className="inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1.5 text-sm font-medium text-success">
        &#10003; Disimpan
      </p>
    );
  }
  return null;
}

// ---- Part 1: Items 1 (classification) – 6 ---------------------------
// Rendered BEFORE the CLO section, matching official item order.

export function BasicInfoFormPart1({
  versionId,
  courseId,
  readOnly,
  suggestedCreditHours,
  initial,
}: {
  versionId: string;
  courseId: string;
  readOnly: boolean;
  suggestedCreditHours: number;
  initial: {
    synopsis: string | null;
    academicStaffNames: string[];
    yearOffered: number | null;
    semesterOffered: number | null;
    offeringRemarks: string | null;
    prerequisite: string | null;
    classification: string | null;
    classificationDomain: string | null;
  };
}) {
  const [state, formAction, isPending] = useActionState(saveBasicInfoAction, initialState);
  const synopsisSplit = splitBilingual(initial.synopsis);
  const handleBlur = useAutoSaveOnBlur(readOnly);

  return (
    <form action={formAction} onBlur={handleBlur} className="space-y-5">
      <input type="hidden" name="versionId" value={versionId} />
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="formPart" value="1" />

      <BilingualTextarea
        labelEn="Synopsis"
        labelMs="Sinopsis"
        nameBm="synopsisBm"
        nameEn="synopsisEn"
        defaultValueBm={synopsisSplit.bm}
        defaultValueEn={synopsisSplit.en}
        readOnly={readOnly}
        rows={4}
        required
      />

      <div>
        <BilingualLabel en="Name(s) of Academic Staff" ms="Nama Staf Akademik" />
        <p className="mt-1 text-xs text-muted-foreground">Satu nama setiap baris.</p>
        <textarea
          name="academicStaffNames"
          defaultValue={initial.academicStaffNames.join("\n")}
          readOnly={readOnly}
          rows={2}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none focus:border-primary disabled:opacity-60"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field labelEn="Year Offered" labelMs="Tahun Ditawarkan" name="yearOffered" type="number"
          defaultValue={initial.yearOffered?.toString() ?? ""} readOnly={readOnly} />
        <Field labelEn="Semester" labelMs="Semester" name="semesterOffered" type="number"
          defaultValue={initial.semesterOffered?.toString() ?? ""} readOnly={readOnly} />
        <Field labelEn="Remarks" labelMs="Catatan Penawaran" name="offeringRemarks"
          defaultValue={initial.offeringRemarks ?? ""} readOnly={readOnly} />
      </div>

      <div>
        <BilingualLabel en="Credit Value" ms="Nilai Kredit" />
        <p className="mt-1 text-xs text-muted-foreground">
          Dikira automatik daripada jumlah SLT &mdash; tidak boleh ditaip terus.
        </p>
        <div className="mt-1.5 inline-flex w-24 items-center justify-center rounded-md border border-input bg-muted/40 px-3 py-2.5 text-sm font-semibold text-foreground">
          {suggestedCreditHours}
        </div>
      </div>

      <Field labelEn="Pre-requisite" labelMs="Pra-syarat" name="prerequisite"
        defaultValue={initial.prerequisite ?? ""} readOnly={readOnly} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <BilingualLabel en="Course Classification" ms="Klasifikasi Kursus" />
          <select
            name="classification"
            defaultValue={initial.classification ?? ""}
            disabled={readOnly}
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
          >
            {CLASSIFICATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <Field labelEn="Domain" labelMs="Domain (jika Citra Rentas)" name="classificationDomain"
          defaultValue={initial.classificationDomain ?? ""} readOnly={readOnly} />
      </div>

      {!readOnly && <SaveStatus state={state} isPending={isPending} />}
    </form>
  );
}

// ---- Part 2: Item 9 (Transferable Skills) + Items 11–15 ---------------
// Rendered AFTER the SLT/assessment sections, matching official item order.

export function BasicInfoFormPart2({
  versionId,
  courseId,
  readOnly,
  initial,
}: {
  versionId: string;
  courseId: string;
  readOnly: boolean;
  initial: {
    transferableSkills: string[];
    specialRequirements: string | null;
    referencesText: string | null;
    futureReadyElements: string[];
    excelFramework: string[];
    sdgTags: string[];
    aiElement: boolean;
    isIndustrialTraining50Elt: boolean;
    facultyApprovalDate: Date | null;
    senateApprovalDate: Date | null;
  };
}) {
  const [state, formAction, isPending] = useActionState(saveBasicInfoAction, initialState);
  const handleBlur = useAutoSaveOnBlur(readOnly);
  const formRef = useRef<HTMLFormElement>(null);

  function enforceSdgLimit(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.checked || !formRef.current) return;
    const checked = formRef.current.querySelectorAll<HTMLInputElement>(
      'input[name="sdgTags"]:checked'
    );
    if (checked.length > SDG_MAX_SELECTION) {
      e.target.checked = false;
    }
  }

  return (
    <form ref={formRef} action={formAction} onBlur={handleBlur} className="space-y-6">
      <input type="hidden" name="versionId" value={versionId} />
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="formPart" value="2" />

      <div>
        <BilingualLabel en="Transferable Skills" ms="Kemahiran Boleh Pindah" />
        <p className="mt-1 text-xs text-muted-foreground">Satu kemahiran setiap baris.</p>
        <textarea
          name="transferableSkills"
          defaultValue={initial.transferableSkills.join("\n")}
          readOnly={readOnly}
          rows={2}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none focus:border-primary disabled:opacity-60"
        />
      </div>

      <div>
        <BilingualLabel en="Special Requirements" ms="Keperluan Khas" />
        <textarea
          name="specialRequirements"
          defaultValue={initial.specialRequirements ?? ""}
          readOnly={readOnly}
          rows={2}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none focus:border-primary disabled:opacity-60"
        />
      </div>

      <div>
        <BilingualLabel en="References" ms="Rujukan" />
        <p className="mt-1 text-xs text-muted-foreground">
          Rujuk &lsquo;Panduan Penulisan Tesis Gaya UKM&rsquo;.
        </p>
        <textarea
          name="referencesText"
          defaultValue={initial.referencesText ?? ""}
          readOnly={readOnly}
          rows={4}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none focus:border-primary disabled:opacity-60"
        />
      </div>

      <div className="space-y-4">
        <CheckboxGroup
          labelEn="Mapping to Future Ready Curriculum Element"
          labelMs="Pemetaan Kurikulum Masa Depan"
          name="futureReadyElements"
          options={FUTURE_READY_OPTIONS}
          selected={initial.futureReadyElements}
          readOnly={readOnly}
        />
        <CheckboxGroup
          labelEn="Mapping to EXCEL Framework"
          labelMs="Pemetaan Kerangka EXCEL"
          name="excelFramework"
          options={EXCEL_FRAMEWORK_OPTIONS}
          selected={initial.excelFramework}
          readOnly={readOnly}
        />
      </div>

      <div className="space-y-3">
        <div>
          <BilingualLabel en="Mapping to Sustainable Development Goals (SDGs)" ms="Pemetaan Matlamat Pembangunan Mampan" />
          <p className="mt-1 text-xs text-muted-foreground">
            Pilih maksimum {SDG_MAX_SELECTION} SDG (templat rasmi hanya ada {SDG_MAX_SELECTION} kotak).
          </p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2.5">
            {SDG_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-start gap-2.5 rounded-md p-1.5 text-sm text-foreground hover:bg-muted/40">
                <input
                  type="checkbox"
                  name="sdgTags"
                  value={opt}
                  defaultChecked={initial.sdgTags.includes(opt)}
                  disabled={readOnly}
                  onChange={enforceSdgLimit}
                  className="mt-0.5 size-4"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div>
        <BilingualLabel en="Artificial Intelligence (AI) Element" ms="Elemen AI" />
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="italic text-primary">Yes/No</span>
          &mdash; Sila tandakan jika <span className="italic text-primary">Yes</span>/Ya.
          Jika <span className="italic text-primary">No</span>/Tidak, biarkan sahaja.
        </p>
        <label className="mt-2 flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="aiElement" defaultChecked={initial.aiElement} disabled={readOnly} />
          <span>
            <span className="italic text-primary">Yes</span>/Ya
          </span>
        </label>
      </div>

      {/* Item 15 is workflow-owned governance data, never submitted by this editor. */}
      <div>
        <BilingualLabel en="Latest Approval Date" ms="Tarikh Kelulusan Terkini" />
        <p className="mt-1 text-xs text-muted-foreground">
          Ditetapkan automatik oleh aliran kelulusan &mdash; pengguna draf tidak boleh mengubahnya.
        </p>
        <div className="mt-1.5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">
              <span className="italic text-primary">Faculty</span>/Fakulti
            </p>
            <div className="mt-1 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-foreground">
              {fmtDateDisplay(initial.facultyApprovalDate)}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              <span className="italic text-primary">Senate</span>/Senat
            </p>
            <div className="mt-1 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-foreground">
              {fmtDateDisplay(initial.senateApprovalDate)}
            </div>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="isIndustrialTraining50Elt"
          defaultChecked={initial.isIndustrialTraining50Elt}
          disabled={readOnly}
          className="mt-0.5"
        />
        <span>
          <span className="italic text-primary">
            Industrial Training/Clinical Placement using 50% ELT
          </span>
          /Latihan Industri/Penempatan Klinikal menggunakan 50% ELT
        </span>
      </label>

      {!readOnly && <SaveStatus state={state} isPending={isPending} />}
    </form>
  );
}

function Field({
  labelEn, labelMs, name, defaultValue, readOnly, type = "text",
}: {
  labelEn: string; labelMs: string; name: string; defaultValue: string; readOnly: boolean; type?: string;
}) {
  return (
    <div>
      <BilingualLabel en={labelEn} ms={labelMs} />
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        readOnly={readOnly}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
      />
    </div>
  );
}

function CheckboxGroup({
  labelEn, labelMs, name, options, selected, readOnly,
}: {
  labelEn: string; labelMs: string; name: string; options: readonly string[]; selected: string[]; readOnly: boolean;
}) {
  return (
    <div>
      <BilingualLabel en={labelEn} ms={labelMs} />
      <div className="mt-2 grid grid-cols-1 gap-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-start gap-2.5 rounded-md p-1.5 text-sm text-foreground hover:bg-muted/40">
            <input
              type="checkbox"
              name={name}
              value={opt}
              defaultChecked={selected.includes(opt)}
              disabled={readOnly}
              className="mt-0.5 size-4"
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
