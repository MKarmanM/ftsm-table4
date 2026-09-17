import test from "node:test";
import assert from "node:assert/strict";
import {
  EXCEL_FRAMEWORK_OPTIONS,
  FUTURE_READY_OPTIONS,
  SDG_OPTIONS,
  validateControlledMappings,
} from "../lib/table4-master-data";

test("controlled mappings accept known values and remove duplicates", () => {
  const result = validateControlledMappings({
    futureReadyElements: [FUTURE_READY_OPTIONS[0], FUTURE_READY_OPTIONS[0]],
    excelFramework: [EXCEL_FRAMEWORK_OPTIONS[1]],
    sdgTags: [SDG_OPTIONS[3], SDG_OPTIONS[8]],
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value.futureReadyElements, [FUTURE_READY_OPTIONS[0]]);
    assert.deepEqual(result.value.excelFramework, [EXCEL_FRAMEWORK_OPTIONS[1]]);
    assert.deepEqual(result.value.sdgTags, [SDG_OPTIONS[3], SDG_OPTIONS[8]]);
  }
});

test("controlled mappings reject unknown values", () => {
  const result = validateControlledMappings({
    futureReadyElements: ["Injected option"],
    excelFramework: [],
    sdgTags: [],
  });

  assert.equal(result.ok, false);
});

test("controlled mappings reject more than two SDGs", () => {
  const result = validateControlledMappings({
    futureReadyElements: [],
    excelFramework: [],
    sdgTags: [SDG_OPTIONS[0], SDG_OPTIONS[1], SDG_OPTIONS[2]],
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.error, /Maksimum 2 SDG/);
  }
});
