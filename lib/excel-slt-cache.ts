import type ExcelJS from "exceljs";
import { computeGroupTotal, computeSltSummary } from "./table4-detail";

type HoursRow = Parameters<typeof computeGroupTotal>[0][number];

function setFormulaResult(sheet: ExcelJS.Worksheet, address: string, result: number) {
  const cell = sheet.getCell(address);
  const value = cell.value;
  if (!value || typeof value !== "object" || !("formula" in value) || typeof value.formula !== "string") {
    throw new Error(`Formula not found in Table 4 template: ${address}`);
  }
  cell.value = { formula: value.formula, result };
}

/** Keep the official template formulas and give non-recalculating viewers correct initial values. */
export function cacheSltFormulaResults(
  sheet: ExcelJS.Worksheet,
  topics: HoursRow[],
  continuous: HoursRow[],
  final: HoursRow[],
  isIndustrialTraining50Elt: boolean
) {
  const topicTotal = computeGroupTotal(topics);
  const continuousTotal = computeGroupTotal(continuous);
  const finalTotal = computeGroupTotal(final);
  const assessmentTotal = continuousTotal + finalTotal;
  const slt = computeSltSummary(topics, [...continuous, ...final], isIndustrialTraining50Elt);

  setFormulaResult(sheet, "X80", topicTotal);
  setFormulaResult(sheet, "X88", continuousTotal);
  setFormulaResult(sheet, "X96", finalTotal);
  setFormulaResult(sheet, "X98", assessmentTotal);
  setFormulaResult(sheet, "X99", slt.grandTotal);
  setFormulaResult(sheet, "F13", slt.suggestedCreditHours);
}
