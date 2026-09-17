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

type ControlledList = readonly string[];

function unknownValues(values: string[], allowed: ControlledList) {
  const allowedSet = new Set(allowed);
  return values.filter((value) => !allowedSet.has(value));
}

export function validateTable4ControlledValues(input: {
  futureReadyElements: string[];
  excelFramework: string[];
  sdgTags: string[];
}): string | null {
  const invalidFutureReady = unknownValues(
    input.futureReadyElements,
    FUTURE_READY_OPTIONS
  );
  if (invalidFutureReady.length > 0) {
    return "Pilihan Kurikulum Masa Depan tidak sah.";
  }

  const invalidExcel = unknownValues(input.excelFramework, EXCEL_FRAMEWORK_OPTIONS);
  if (invalidExcel.length > 0) {
    return "Pilihan Kerangka EXCEL tidak sah.";
  }

  const invalidSdg = unknownValues(input.sdgTags, SDG_OPTIONS);
  if (invalidSdg.length > 0) {
    return "Pilihan SDG tidak sah.";
  }

  if (new Set(input.sdgTags).size !== input.sdgTags.length) {
    return "Pilihan SDG mengandungi nilai pendua.";
  }

  if (input.sdgTags.length > SDG_MAX_SELECTION) {
    return `Maksimum ${SDG_MAX_SELECTION} SDG boleh dipilih.`;
  }

  return null;
}
