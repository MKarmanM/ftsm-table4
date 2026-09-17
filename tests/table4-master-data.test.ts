import test from "node:test";
import assert from "node:assert/strict";
import {
  EXCEL_FRAMEWORK_OPTIONS,
  FUTURE_READY_OPTIONS,
  SDG_OPTIONS,
  validateControlledTable4Selections,
} from "../lib/table4-master-data";

test("controlled Table 4 selections accept valid master-data values", () => {
  const error = validateControlledTable4Selections({
    futureReadyElements: [FUTURE_READY_OPTIONS[0]],
    excelFramework: [EXCEL_FRAMEWORK_OPTIONS[1]],
    sdgTags: [SDG_OPTIONS[3], SDG_OPTIONS[8]],
  });

  assert.equal(error, null);
});

test("controlled Table 4 selections reject unknown values", () => {
  const error = validateControlledTable4Selections({
    futureReadyElements: ["Unknown future-ready value"],
    excelFramework: [],
    sdgTags: [],
  });

  assert.equal(error, "Pilihan Future Ready Curriculum tidak sah.");
});

test("controlled Table 4 selections enforce maximum two SDGs", () => {
  const error = validateControlledTable4Selections({
    futureReadyElements: [],
    excelFramework: [],
    sdgTags: [SDG_OPTIONS[0], SDG_OPTIONS[1], SDG_OPTIONS[2]],
  });

  assert.equal(error, "Maksimum 2 SDG sahaja dibenarkan.");
});
