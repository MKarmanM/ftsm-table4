import test from "node:test";
import assert from "node:assert/strict";
import { auditActionLabel, reviewActionLabel } from "../lib/activity-labels";

test("review actions use readable Malay labels", () => {
  assert.equal(reviewActionLabel("REQUEST_CHANGES"), "Minta pindaan");
  assert.equal(reviewActionLabel("APPROVE"), "Lulus di peringkat fakulti");
});

test("unknown audit actions still render safely", () => {
  assert.equal(auditActionLabel("CUSTOM_ACTION"), "CUSTOM ACTION");
});
