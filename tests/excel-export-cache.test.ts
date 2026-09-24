import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import ExcelJS from "exceljs";
import { cacheSltFormulaResults } from "../lib/excel-slt-cache";

test("Excel export retains formula and caches version SLT credit for first open", async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(process.cwd(), "resources", "table4-template.xlsx"));
  const sheet = workbook.getWorksheet("FORM");
  assert.ok(sheet);

  const hours = {
    f2fPhysical: { l: 20, t: 0, p: 0, o: 0 },
    f2fOnline: { l: 0, t: 0, p: 0, o: 0 },
    independent: 39,
  };
  cacheSltFormulaResults(sheet, [{ hours }], [{ hours: {
    f2fPhysical: { l: 1, t: 0, p: 0, o: 0 },
    f2fOnline: { l: 0, t: 0, p: 0, o: 0 }, independent: 0,
  } }], [], false);

  const reopened = new ExcelJS.Workbook();
  await reopened.xlsx.load(await workbook.xlsx.writeBuffer());
  const exported = reopened.getWorksheet("FORM");
  assert.ok(exported);
  assert.deepEqual(exported.getCell("F13").value, {
    formula: 'IF(X107 ="√",INT(X99/80),INT(X99/40))', result: 1,
  });
  assert.deepEqual(exported.getCell("X99").value, {
    formula: "X98+X80", result: 60,
  });
});
