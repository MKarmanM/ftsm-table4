import type { TaxonomyDomainKey } from "./taxonomy-data";

export type PloCloMasterEntry = {
  learningOutcomeDomain: string;
  taxonomy: Partial<Record<TaxonomyDomainKey, number[]>>;
  teachingMethods: string[];
  assessmentMethods: string[];
};

// Centralised master mapping for CLO guidance.
// MQF cluster derivation remains in lib/mqf-legend.ts and is intentionally unchanged.
// Taxonomy ranges are the current working mapping agreed for the FTSM Table 4 prototype
// and can be revised here once the faculty confirms the final curriculum mapping.
export const PLO_CLO_MASTER: Record<number, PloCloMasterEntry> = {
  1: {
    learningOutcomeDomain: "Pengetahuan dan Pemahaman",
    taxonomy: { KOGNITIF: [1, 2] },
    teachingMethods: [
      "Lecture/Kuliah",
      "Tutorial/Tutoran",
      "Interactive Value-Based Lecture/Kuliah Interaktif Berasaskan Nilai",
      "Ethics Case or Moral Dilemma/Kes Etika atau Dilema Moral",
    ],
    assessmentMethods: [
      "Quiz/Kuiz",
      "Test/Ujian",
      "Final Exam/Peperiksaan Akhir",
      "Ethics Situation Quiz/Kuiz Berasaskan Situasi Etika",
      "Value Concept Understanding Exam/Peperiksaan Berasaskan Kefahaman Konsep Nilai",
    ],
  },
  2: {
    learningOutcomeDomain: "Kemahiran Kognitif",
    taxonomy: { KOGNITIF: [1, 2] },
    teachingMethods: [
      "Case Study/Kajian Kes",
      "Project/Projek",
      "Tutorial/Tutoran",
      "Group Work/Kerja Berkumpulan",
      "Value Dilemma Case Study/Kajian Kes Dilema Nilai",
      "Value Dialogue/Dialog Nilai",
      "Ethics Debate/Sesi Debat Etika",
    ],
    assessmentMethods: [
      "Quiz/Kuiz",
      "Test/Ujian",
      "Final Exam/Peperiksaan Akhir",
      "Presentation/Pembentangan",
      "Essay/Esei",
      "Problem Solving/Penyelesaian Masalah",
      "Moral Case Analysis/Analisis Kes Moral",
    ],
  },
  3: {
    learningOutcomeDomain: "Kemahiran Praktikal",
    taxonomy: { PSIKOMOTOR: [1, 2, 3, 4, 5] },
    teachingMethods: [
      "Practical/Praktikal",
      "Demonstration/Demonstrasi",
      "Simulation/Simulasi",
      "Role Play/Main Peranan",
      "Workplace Ethics/Etika Pekerjaan",
      "Practical Project/Projek Praktikal",
    ],
    assessmentMethods: [
      "Practical Test/Ujian Praktikal",
      "Practical Report/Laporan Amali",
      "Professional Practical Report/Laporan Amali dengan Rubrik Profesional",
    ],
  },
  4: {
    learningOutcomeDomain: "Kemahiran Interpersonal",
    taxonomy: { AFEKTIF: [1, 2, 3, 4] },
    teachingMethods: [
      "Case Study/Kajian Kes",
      "Project/Projek",
      "Tutorial/Tutoran",
      "Group Work/Kerja Berkumpulan",
      "Group Learning and Reflection/Pembelajaran Berkumpulan dan Refleksi",
    ],
    assessmentMethods: [
      "Presentation/Pembentangan",
      "Report/Laporan",
      "Peer Assessment/Penilaian Rakan Sebaya",
      "Teamwork Assessment/Penilaian Kerja Berpasukan",
    ],
  },
  5: {
    learningOutcomeDomain: "Kemahiran Komunikasi",
    taxonomy: { AFEKTIF: [1, 2, 3, 4] },
    teachingMethods: [
      "Case Study/Kajian Kes",
      "Project/Projek",
      "Tutorial/Tutoran",
      "Dialogue and Narrative Learning/Pembelajaran Berasaskan Dialog dan Naratif",
      "Communication Simulation/Simulasi Komunikasi",
    ],
    assessmentMethods: [
      "Presentation/Pembentangan",
      "Report/Laporan",
      "Oral Presentation/Pembentangan Lisan",
      "Ethical Communication Assessment/Penilaian Komunikasi Beretika",
      "Project Report/Laporan Projek",
    ],
  },
  6: {
    learningOutcomeDomain: "Kemahiran Digital",
    taxonomy: {
      KOGNITIF: [3, 4, 5, 6],
      PSIKOMOTOR: [1, 2, 3, 4, 5],
      AFEKTIF: [1, 2, 3, 4],
    },
    teachingMethods: [
      "Case Study/Kajian Kes",
      "Project/Projek",
      "Group Work/Kerja Berkumpulan",
      "Ethical Digital Module/Modul Digital Beretika",
      "e-Portfolio Project/Projek e-Portfolio",
      "Digital Communication Simulation/Simulasi Komunikasi Digital",
    ],
    assessmentMethods: [
      "Portfolio",
      "Presentation/Pembentangan",
      "Report/Laporan",
      "Digital Ethics Reflection e-Portfolio/e-Portfolio Refleksi Etika Digital",
      "Social Media Ethics Simulation/Simulasi Etika Penggunaan Media Sosial",
    ],
  },
  7: {
    learningOutcomeDomain: "Kemahiran Numerasi",
    taxonomy: { KOGNITIF: [3, 4, 5, 6] },
    teachingMethods: [
      "Case Study/Kajian Kes",
      "Project/Projek",
      "Tutorial/Tutoran",
      "Group Work/Kerja Berkumpulan",
      "Social Data Analysis Activity/Aktiviti Analisis Kes Berkaitan Data Sosial",
    ],
    assessmentMethods: [
      "Quiz/Kuiz",
      "Test/Ujian",
      "Final Exam/Peperiksaan Akhir",
      "Presentation/Pembentangan",
      "Essay/Esei",
      "Data Accuracy and Integrity Assessment/Penilaian Ketepatan dan Integriti Data",
    ],
  },
  8: {
    learningOutcomeDomain: "Kepimpinan, Autonomi dan Kebertanggungjawaban",
    taxonomy: { AFEKTIF: [1, 2, 3, 4, 5] },
    teachingMethods: [
      "Case Study/Kajian Kes",
      "Project/Projek",
      "Group Work/Kerja Berkumpulan",
      "Industrial Attachment/Sangkutan Industri",
      "Discussion/Perbincangan",
      "Community Leadership Project/Projek Kepimpinan Komuniti",
      "Leadership Role Simulation/Simulasi Peranan Kepimpinan",
    ],
    assessmentMethods: [
      "Presentation/Pembentangan",
      "Report/Laporan",
      "Ethical Leadership Reflection/Refleksi Kepimpinan Beretika",
      "Social Impact Assessment Report/Laporan Penilaian Impak Sosial",
    ],
  },
  9: {
    learningOutcomeDomain: "Kemahiran Peribadi",
    taxonomy: { AFEKTIF: [1, 2, 3, 4, 5] },
    teachingMethods: [
      "Case Study/Kajian Kes",
      "Project/Projek",
      "Group Work/Kerja Berkumpulan",
      "Self-Reflection Journal/Jurnal Refleksi Kendiri",
      "Mindfulness and Value Reflection/Aktiviti Mindfulness dan Refleksi Nilai",
    ],
    assessmentMethods: [
      "Portfolio",
      "Presentation/Pembentangan",
      "Report/Laporan",
      "Value Reflection Journal/Jurnal Reflektif Nilai",
      "Personal Development Assessment/Penilaian Perkembangan Peribadi",
    ],
  },
  10: {
    learningOutcomeDomain: "Kemahiran Keusahawanan",
    taxonomy: { AFEKTIF: [1, 2, 3, 4, 5] },
    teachingMethods: [
      "Case Study/Kajian Kes",
      "Project/Projek",
      "Group Work/Kerja Berkumpulan",
      "Industrial Attachment/Sangkutan Industri",
      "Discussion/Perbincangan",
      "Social Entrepreneurship Project/Projek Keusahawanan Sosial",
    ],
    assessmentMethods: [
      "Presentation/Pembentangan",
      "Essay/Esei",
      "Report/Laporan",
      "Entrepreneurship Project Essay/Esei Projek Keusahawanan",
      "Ethical Entrepreneurship Project Presentation/Pembentangan Projek Keusahawanan Beretika",
    ],
  },
  11: {
    learningOutcomeDomain: "Etika dan Profesionalisme",
    taxonomy: { AFEKTIF: [1, 2, 3, 4, 5] },
    teachingMethods: [
      "Case Study/Kajian Kes",
      "Project/Projek",
      "Industrial Attachment/Sangkutan Industri",
      "Tutorial/Tutoran",
      "Discussion/Perbincangan",
      "Professional Values Lecture and Reflection/Kuliah Nilai dan Refleksi Kes Profesional",
    ],
    assessmentMethods: [
      "Essay/Esei",
      "Presentation/Pembentangan",
      "Report/Laporan",
      "Final Reflective Assessment/Penilaian Reflektif Akhir",
      "Professionalism and Values Portfolio/Portfolio Profesionalisme dan Nilai",
    ],
  },
};

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function getPloCloGuidance(ploNumbers: number[]) {
  const entries = unique(ploNumbers)
    .map((number) => ({ number, entry: PLO_CLO_MASTER[number] }))
    .filter((item): item is { number: number; entry: PloCloMasterEntry } => Boolean(item.entry));

  const taxonomyDomains = unique(
    entries.flatMap(({ entry }) => Object.keys(entry.taxonomy) as TaxonomyDomainKey[])
  );

  const taxonomyLevels = taxonomyDomains.reduce(
    (acc, domain) => {
      acc[domain] = unique(
        entries.flatMap(({ entry }) => entry.taxonomy[domain] ?? [])
      ).sort((a, b) => a - b);
      return acc;
    },
    {} as Record<TaxonomyDomainKey, number[]>
  );

  return {
    entries,
    taxonomyDomains,
    taxonomyLevels,
    teachingMethods: unique(entries.flatMap(({ entry }) => entry.teachingMethods)),
    assessmentMethods: unique(entries.flatMap(({ entry }) => entry.assessmentMethods)),
  };
}

export type CloGuidanceSelection = {
  ploNumbers: number[];
  taxonomyDomain: TaxonomyDomainKey | null;
  taxonomyLevel: number | null;
  teachingMethod: string | null;
  assessmentMethod: string | null;
};

export function validateCloGuidanceSelection(selection: CloGuidanceSelection):
  | { ok: true }
  | { ok: false; error: string } {
  if (selection.ploNumbers.length === 0) {
    return { ok: false, error: "Pilih sekurang-kurangnya satu PLO dahulu." };
  }

  const guidance = getPloCloGuidance(selection.ploNumbers);
  if (guidance.entries.length !== unique(selection.ploNumbers).length) {
    return { ok: false, error: "PLO yang dipilih belum mempunyai master data yang sah." };
  }

  if (!selection.taxonomyDomain) {
    return { ok: false, error: "Domain taksonomi wajib dipilih berdasarkan PLO." };
  }

  const allowedLevels = guidance.taxonomyLevels[selection.taxonomyDomain] ?? [];
  if (
    !selection.taxonomyLevel ||
    !allowedLevels.includes(selection.taxonomyLevel)
  ) {
    return { ok: false, error: "Tahap taksonomi tidak sah untuk PLO yang dipilih." };
  }

  if (
    !selection.teachingMethod ||
    !guidance.teachingMethods.includes(selection.teachingMethod)
  ) {
    return { ok: false, error: "Kaedah penyampaian mesti dipilih daripada cadangan PLO." };
  }

  if (
    !selection.assessmentMethod ||
    !guidance.assessmentMethods.includes(selection.assessmentMethod)
  ) {
    return { ok: false, error: "Kaedah penilaian mesti dipilih daripada cadangan PLO." };
  }

  return { ok: true };
}
