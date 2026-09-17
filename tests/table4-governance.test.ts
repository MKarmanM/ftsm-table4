import test from "node:test";
import assert from "node:assert/strict";
import {
  FUTURE_READY_OPTIONS,
  EXCEL_FRAMEWORK_OPTIONS,
  SDG_OPTIONS,
  validateGovernanceFields,
} from "../lib/table4-master-data";

test("governance fields accept canonical Table 4 master data", () => {
  const issues = validateGovernanceFields({
    futureReadyElements: [FUTURE_READY_OPTIONS[0]],
    excelFramework: [EXCEL_FRAMEWORK_OPTIONS[0]],
    sdgTags: [SDG_OPTIONS[3], SDG_OPTIONS[8]],
    facultyApprovalDate: null,
    senateApprovalDate: null,
  });

  assert.deepEqual(issues, []);
});

test("governance fields reject unknown master data values", () => {
  const issues = validateGovernanceFields({
    futureReadyElements: ["Injected Future Ready"],
    excelFramework: ["Injected EXCEL"],
    sdgTags: ["SDG99"],
    facultyApprovalDate: null,
    senateApprovalDate: null,
  });

  const codes = new Set(issues.map((issue) => issue.code));
  assert.equal(codes.has("FUTURE_READY_INVALID"), true);
  assert.equal(codes.has("EXCEL_FRAMEWORK_INVALID"), true);
  assert.equal(codes.has("SDG_INVALID"), true);
});

test("governance fields enforce maximum two SDGs", () => {
  const issues = validateGovernanceFields({
    futureReadyElements: [],
    excelFramework: [],
    sdgTags: [SDG_OPTIONS[0], SDG_OPTIONS[1], SDG_OPTIONS[2]],
    facultyApprovalDate: null,
    senateApprovalDate: null,
  });

  assert.equal(
    issues.some((issue) => issue.code === "SDG_LIMIT_EXCEEDED"),
    true
  );
});

test("draft governance rejects manually populated approval dates", () => {
  const issues = validateGovernanceFields({
    futureReadyElements: [],
    excelFramework: [],
    sdgTags: [],
    facultyApprovalDate: new Date("2026-09-17"),
    senateApprovalDate: null,
  });

  assert.equal(
    issues.some((issue) => issue.code === "APPROVAL_DATE_DERIVED"),
    true
  );
});
