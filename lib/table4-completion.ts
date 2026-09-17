import type { HoursBreakdown } from "./table4-detail";
import { computeSltSummary } from "./table4-detail";

type CompletionInput = {
  synopsis: string | null;
  academicStaffNames: string[];
  yearOffered: number | null;
  semesterOffered: number | null;
  classification: string | null;
  referencesText: string | null;
  specialRequirements: string | null;
  clos: Array<{
    text: string;
    teachingMethods: string | null;
    assessmentMethods: string | null;
    taxonomyDomain: string | null;
    taxonomyLevel: string | null;
    mappedPloIds: string[];
  }>;
  topics: Array<{ hours: HoursBreakdown }>;
  assessments: Array<{
    phase: "CONTINUOUS" | "FINAL";
    weightagePercent: string | null;
    hours: HoursBreakdown;
  }>;
  isIndustrialTraining50Elt: boolean;
};

export type CompletionSection = {
  key: string;
  label: string;
  complete: boolean;
  hint: string;
};

export function computeTable4Completion(input: CompletionInput) {
  const hasText = (value: string | null | undefined) => Boolean(value?.trim());
  const cloComplete =
    input.clos.length > 0 &&
    input.clos.every(
      (clo) =>
        hasText(clo.text) &&
        hasText(clo.teachingMethods) &&
        hasText(clo.assessmentMethods) &&
        hasText(clo.taxonomyDomain) &&
        hasText(clo.taxonomyLevel) &&
        clo.mappedPloIds.length > 0
    );

  const slt = computeSltSummary(
    input.topics,
    input.assessments,
    input.isIndustrialTraining50Elt
  );
  const assessmentTotal = input.assessments.reduce(
    (sum, item) => sum + Number(item.weightagePercent ?? 0),
    0
  );

  const sections: CompletionSection[] = [
    {
      key: "basic",
      label: "Maklumat Kursus",
      complete:
        hasText(input.synopsis) &&
        input.academicStaffNames.length > 0 &&
        Boolean(input.yearOffered) &&
        Boolean(input.semesterOffered) &&
        Boolean(input.classification),
      hint: "Lengkapkan sinopsis, staf, semester/tahun dan klasifikasi.",
    },
    {
      key: "clo",
      label: "CLO / PLO",
      complete: cloComplete,
      hint: "Pastikan CLO, taksonomi, kaedah dan pemetaan PLO lengkap.",
    },
    {
      key: "slt",
      label: "SLT",
      complete: input.topics.length > 0 && slt.grandTotal > 0,
      hint: "Masukkan topik dan agihan jam pembelajaran.",
    },
    {
      key: "assessment",
      label: "Penilaian",
      complete:
        input.assessments.length > 0 && Math.abs(assessmentTotal - 100) <= 0.01,
      hint: "Jumlah wajaran semua penilaian mesti 100%.",
    },
    {
      key: "other",
      label: "Maklumat Lain",
      complete: hasText(input.referencesText),
      hint: "Lengkapkan sekurang-kurangnya rujukan kursus.",
    },
  ];

  const completeCount = sections.filter((section) => section.complete).length;
  const percentage = Math.round((completeCount / sections.length) * 100);

  return {
    percentage,
    completeCount,
    totalSections: sections.length,
    sections,
    assessmentTotal,
    slt,
  };
}
