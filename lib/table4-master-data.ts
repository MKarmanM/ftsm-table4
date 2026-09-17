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

export type GovernanceFieldIssue = {
  code: string;
  message: string;
};

export function validateGovernanceFields(input: {
  futureReadyElements: string[];
  excelFramework: string[];
  sdgTags: string[];
  facultyApprovalDate: Date | string | null;
  senateApprovalDate: Date | string | null;
}): GovernanceFieldIssue[] {
  const issues: GovernanceFieldIssue[] = [];

  const invalidFutureReady = input.futureReadyElements.filter(
    (value) => !FUTURE_READY_SET.has(value)
  );
  if (invalidFutureReady.length > 0) {
    issues.push({
      code: "FUTURE_READY_INVALID",
      message: "Pemetaan Future Ready mengandungi nilai yang tidak sah.",
    });
  }

  const invalidExcel = input.excelFramework.filter(
    (value) => !EXCEL_FRAMEWORK_SET.has(value)
  );
  if (invalidExcel.length > 0) {
    issues.push({
      code: "EXCEL_FRAMEWORK_INVALID",
      message: "Pemetaan Kerangka EXCEL mengandungi nilai yang tidak sah.",
    });
  }

  const invalidSdg = input.sdgTags.filter((value) => !SDG_SET.has(value));
  if (invalidSdg.length > 0) {
    issues.push({
      code: "SDG_INVALID",
      message: "Pemetaan SDG mengandungi nilai yang tidak sah.",
    });
  }

  if (input.sdgTags.length > SDG_MAX_SELECTION) {
    issues.push({
      code: "SDG_LIMIT_EXCEEDED",
      message: `Maksimum ${SDG_MAX_SELECTION} SDG boleh dipilih.`,
    });
  }

  if (input.facultyApprovalDate || input.senateApprovalDate) {
    issues.push({
      code: "APPROVAL_DATE_DERIVED",
      message:
        "Tarikh kelulusan mesti dijana oleh workflow kelulusan dan tidak boleh ditetapkan semasa draf.",
    });
  }

  return issues;
}
