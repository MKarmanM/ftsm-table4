export const FUTURE_READY_OPTIONS = [
  "Element 1: Fluid & Organic Curriculum Structure / Elemen 1: Struktur Kurikulum Lentur dan Organik",
  "Element 2: Transformative Learning & Teaching Delivery / Elemen 2: Pembelajaran Transformatif dan Penyampaian Pengajaran",
  "Element 3: Alternative Assessments / Elemen 3: Penilaian Alternatif",
] as const;

export const EXCEL_FRAMEWORK_OPTIONS = [
  "REAL (Research Infused Experiential Learning)",
  "IDEAL (Industry Driven Experiential Learning)",
  "POISE (Personalized Experiential Learning)",
  "CARE (Community Resilience Experiential Learning)",
] as const;

export const SDG_OPTIONS = [
  "SDG1: No Poverty/Tiada Kemiskinan",
  "SDG2: Zero Hunger/Kelaparan Sifar",
  "SDG3: Good Health and Well Being/Kesihatan dan Kesejahteraan yang Baik",
  "SDG4: Quality Education/Pendidikan Berkualiti",
  "SDG5: Gender Equality/Kesamarataan Gender",
  "SDG6: Clean Water and Sanitation/Kebersihan Air dan Sanitasi",
  "SDG7: Affordable and Clean Energy/Tenaga yang Berpatutan dan Bersih",
  "SDG8: Decent Work and Economic Growth/Pekerjaan Baik dan Kemajuan Ekonomi",
  "SDG9: Industry, Innovation and Infrastructure/Industri, Inovasi dan Infrastruktur",
  "SDG10: Reduced Inequalities/Mengurangkan Ketidaksamarataan",
  "SDG11: Sustainable Cities and Communities/Bandar dan Komuniti Mampan",
  "SDG12: Responsible Consumption and Production/Penggunaan dan Penghasilan yang Bertanggungjawab",
  "SDG13: Climate Action/Tindakan Iklim",
  "SDG14: Life Below Water/Kehidupan di dalam Air",
  "SDG15: Life on Land/Kehidupan di atas Darat",
  "SDG16: Peace, Justice and Strong Institutions/Keamanan, Keadilan dan Institusi yang Kukuh",
  "SDG17: Partnerships for the Goals/Rakan Kerjasama untuk Matlamat",
] as const;

export const SDG_MAX_SELECTION = 2;

const FUTURE_READY_SET = new Set<string>(FUTURE_READY_OPTIONS);
const EXCEL_FRAMEWORK_SET = new Set<string>(EXCEL_FRAMEWORK_OPTIONS);
const SDG_SET = new Set<string>(SDG_OPTIONS);

export type ControlledMappingInput = {
  futureReadyElements: string[];
  excelFramework: string[];
  sdgTags: string[];
};

export type ControlledMappingValidation =
  | { ok: true; value: ControlledMappingInput }
  | { ok: false; error: string };

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function validateControlledMappings(
  input: ControlledMappingInput
): ControlledMappingValidation {
  const futureReadyElements = unique(input.futureReadyElements);
  const excelFramework = unique(input.excelFramework);
  const sdgTags = unique(input.sdgTags);

  if (futureReadyElements.some((value) => !FUTURE_READY_SET.has(value))) {
    return { ok: false, error: "Pilihan Future Ready Curriculum tidak sah." };
  }

  if (excelFramework.some((value) => !EXCEL_FRAMEWORK_SET.has(value))) {
    return { ok: false, error: "Pilihan kerangka EXCEL tidak sah." };
  }

  if (sdgTags.some((value) => !SDG_SET.has(value))) {
    return { ok: false, error: "Pilihan SDG tidak sah." };
  }

  if (sdgTags.length > SDG_MAX_SELECTION) {
    return {
      ok: false,
      error: `Maksimum ${SDG_MAX_SELECTION} SDG boleh dipilih.`,
    };
  }

  return {
    ok: true,
    value: { futureReadyElements, excelFramework, sdgTags },
  };
}
