import test from "node:test";
import assert from "node:assert/strict";
import {
  getPloCloGuidance,
  PLO_CLO_MASTER,
  validateCloGuidanceSelection,
} from "../lib/plo-clo-master-data";

test("PLO1 and PLO2 expose only cognitive C1-C2", () => {
  for (const ploNumber of [1, 2]) {
    const guidance = getPloCloGuidance([ploNumber]);
    assert.deepEqual(guidance.taxonomyDomains, ["KOGNITIF"]);
    assert.deepEqual(guidance.taxonomyLevels.KOGNITIF, [1, 2]);
  }
});

test("PLO3 includes psychomotor P1-P5", () => {
  const guidance = getPloCloGuidance([3]);
  assert.deepEqual(guidance.taxonomyDomains, ["PSIKOMOTOR"]);
  assert.deepEqual(guidance.taxonomyLevels.PSIKOMOTOR, [1, 2, 3, 4, 5]);
});

test("PLO6 exposes cognitive, psychomotor and affective choices", () => {
  const guidance = getPloCloGuidance([6]);
  assert.deepEqual(
    new Set(guidance.taxonomyDomains),
    new Set(["KOGNITIF", "PSIKOMOTOR", "AFEKTIF"])
  );
  assert.deepEqual(guidance.taxonomyLevels.KOGNITIF, [3, 4, 5, 6]);
  assert.deepEqual(guidance.taxonomyLevels.PSIKOMOTOR, [1, 2, 3, 4, 5]);
  assert.deepEqual(guidance.taxonomyLevels.AFEKTIF, [1, 2, 3, 4]);
});

test("guided CLO validation rejects multiple PLOs for one CLO", () => {
  const result = validateCloGuidanceSelection({
    ploNumbers: [1, 2],
    taxonomyDomain: "KOGNITIF",
    taxonomyLevel: 1,
    teachingMethod: PLO_CLO_MASTER[1].teachingMethods[0],
    assessmentMethod: PLO_CLO_MASTER[1].assessmentMethods[0],
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.error, /satu PLO sahaja/i);
  }
});

test("guided CLO validation rejects a taxonomy level outside selected PLO range", () => {
  const teachingMethod = PLO_CLO_MASTER[1].teachingMethods[0];
  const assessmentMethod = PLO_CLO_MASTER[1].assessmentMethods[0];

  const result = validateCloGuidanceSelection({
    ploNumbers: [1],
    taxonomyDomain: "KOGNITIF",
    taxonomyLevel: 4,
    teachingMethod,
    assessmentMethod,
  });

  assert.equal(result.ok, false);
});

test("guided CLO validation accepts a valid master-data selection", () => {
  const teachingMethod = PLO_CLO_MASTER[3].teachingMethods[0];
  const assessmentMethod = PLO_CLO_MASTER[3].assessmentMethods[0];

  const result = validateCloGuidanceSelection({
    ploNumbers: [3],
    taxonomyDomain: "PSIKOMOTOR",
    taxonomyLevel: 1,
    teachingMethod,
    assessmentMethod,
  });

  assert.deepEqual(result, { ok: true });
});
