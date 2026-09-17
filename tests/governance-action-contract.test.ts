import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("governance save action never writes approval dates", () => {
  const actionPath = path.join(process.cwd(), "app/actions/table4-governance.ts");
  const source = fs.readFileSync(actionPath, "utf8");

  assert.equal(source.includes("facultyApprovalDate:"), false);
  assert.equal(source.includes("senateApprovalDate:"), false);
  assert.equal(source.includes("Approval dates are intentionally omitted"), true);
});
