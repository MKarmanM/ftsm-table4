// Coordinate map for resources/table4-template.xlsx (FORM sheet), derived
// from the official UKM Table 4 v2.0 template (Jadual_4__Table_4_.xlsm)
// and a filled sample (TTTX6124) provided by the user.
//
// IMPORTANT: Cells like X80, X88, X96, X98, X99, X100-X105, and F13
// (Credit Value) already contain live Excel formulas in the template
// (=SUM(...), =IF(...)) that automatically compute SLT totals and
// percentages from the raw input cells below. We NEVER write to those
// cells — only to the plain input cells listed here — so Excel
// recalculates everything correctly when the file is opened.

export const TABLE4_CELLS = {
  courseName: "F5", // Item 1 — combined Ms/En text
  courseCode: "F6",
  classification: "F7", // Item — one of CLASSIFICATION_TEXT below
  classificationDomain: "Y7", // Only relevant if classification is Citra Rentas
  synopsis: "F8", // Item 2 — combined Ms/En text
  staffNameCells: ["G9", "G10", "G11"], // Item 3 — up to 3 slots
  yearOffered: "I12", // Item 4
  semesterOffered: "L12",
  offeringRemarks: "M12",
  // F13 (Credit Value) is a LIVE FORMULA — do not write.
  prerequisite: "F14", // Item 6

  // Item 7 — CLO text. F16..F23 ("CLO1/HPK1" etc.) are already pre-filled
  // labels in the template; only the H column (text) is empty/writable.
  cloTextCells: ["H16", "H17", "H18", "H19", "H20", "H21", "H22", "H23"], // up to 8 CLOs

  // Item 8 — CLO-PLO mapping grid. F28..P28 (PLO1..PLO11 headers) are
  // pre-filled. Rows 29..36 correspond to CLO1..CLO8 (D29../D36 already
  // auto-link back to F16../F23 via formula — do not write column D).
  cloMappingRows: [29, 30, 31, 32, 33, 34, 35, 36], // up to 8 CLOs
  ploTickColumns: ["F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"], // PLO1..PLO11
  teachingMethodColumn: "R",
  assessmentMethodColumn: "W",

  // Item 9 — Transferable skills, up to 4 entries.
  transferableSkillCells: ["J46", "J47", "J48", "J50"],

  // Item 10 — Weekly topics / SLT. Rows 60..79 = Week 1..20. Column D
  // (week number) is pre-filled — only write E (topic) onward.
  topicFirstRow: 60,
  topicMaxRows: 20,
  topicTextColumn: "E",
  cloRefColumn: "K", // numeric CLO index, e.g. 1 for CLO1
  hoursColumns: {
    f2fPhysical: { l: "M", t: "N", p: "O", o: "P" },
    f2fOnline: { l: "Q", t: "R", p: "S", o: "T" },
    independent: "U",
  },

  // Continuous assessment: rows 83..87 (up to 5 items). Same hour columns
  // as topics.
  continuousFirstRow: 83,
  continuousMaxRows: 5,
  // Final assessment: rows 91..95 (up to 5 items).
  finalFirstRow: 91,
  finalMaxRows: 5,
  assessmentNameColumn: "E",
  assessmentWeightageColumn: "K",

  // 50% ELT checkbox (Industrial Training/Clinical Placement).
  industrialTraining50EltCheckbox: "X107",

  specialRequirements: "K112", // Item 11
  references: "K114", // Item 12
  futureReadyElements: "K116", // Item 13 (left)
  excelFramework: "X116", // Item 13 (right, "Mapping to EXCEL Framework")
  sdgTags: "K118", // Item 14 — first of two SDG boxes in the template
  sdgTagsSecondary: "R118", // Item 14 — second SDG box (template only has 2)
  facultyApprovalDate: "O120", // Item 15
  senateApprovalDate: "X120",
} as const;

// Matches the exact option text used by the template's dropdown/reference
// list (AI19:AI23 in the blank template), so the written value lines up
// with what Excel's data validation expects.
export const CLASSIFICATION_TEXT: Record<string, string> = {
  WU_CITRA_WAJIB: "Compulsory/ Wajib Universiti (WU)\nCitra Wajib (CW)\n",
  WU_CITRA_RENTAS: "Compulsory/Wajib Universiti (WU)\nCitra Rentas (CR) C1 - C6",
  TERAS: "Core / Teras",
  ELEKTIF: "Elective / Elektif",
  AUDIT: "Audit",
};

// The MQF cluster grid (rows 37-39, "Mapping with MQF Cluster of
// Learning Outcomes") only has 3 rows. Verified against a real filled
// sample: each CLO's MQF code goes in the SAME PLO column as that
// CLO's own tick in the main CLO-PLO grid above — NOT a fixed
// code-to-PLO legend (the D42 note text listing "C1 = ... (HPP1)" etc.
// is just informational guidance for whoever fills the form by hand,
// not a mechanical placement rule). When two CLOs share a PLO column,
// the second CLO's code stacks down to the next row for that column.
export const MQF_CLUSTER_GRID_ROWS = [37, 38, 39];
