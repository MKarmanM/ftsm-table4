import test from "node:test";
import assert from "node:assert/strict";
import { computeTable4Completion } from "../lib/table4-completion";

const zeroHours = {
  f2fPhysical: { l: 0, t: 0, p: 0, o: 0 },
  f2fOnline: { l: 0, t: 0, p: 0, o: 0 },
  independent: 0,
};

const topicHours = {
  f2fPhysical: { l: 2, t: 1, p: 0, o: 0 },
  f2fOnline: { l: 0, t: 0, p: 0, o: 0 },
  independent: 3,
};

test("completion is 100% when all five main sections are complete", () => {
  const result = computeTable4Completion({
    synopsis: "Sinopsis",
    academicStaffNames: ["Dr A"],
    yearOffered: 2026,
    semesterOffered: 1,
    classification: "TERAS",
    referencesText: "Reference",
    specialRequirements: null,
    clos: [
      {
        text: "CLO1",
        teachingMethods: "Lecture",
        assessmentMethods: "Quiz",
        taxonomyDomain: "KOGNITIF",
        taxonomyLevel: "C2",
        mappedPloIds: ["plo-1"],
      },
    ],
    topics: [{ hours: topicHours }],
    assessments: [
      { phase: "CONTINUOUS", weightagePercent: "60", hours: zeroHours },
      { phase: "FINAL", weightagePercent: "40", hours: zeroHours },
    ],
    isIndustrialTraining50Elt: false,
  });

  assert.equal(result.percentage, 100);
  assert.equal(result.completeCount, 5);
  assert.equal(result.assessmentTotal, 100);
  assert.equal(result.sections.every((section) => section.complete), true);
});

test("completion marks CLO/PLO and assessment incomplete when required data is missing", () => {
  const result = computeTable4Completion({
    synopsis: "Sinopsis",
    academicStaffNames: ["Dr A"],
    yearOffered: 2026,
    semesterOffered: 1,
    classification: "TERAS",
    referencesText: "Reference",
    specialRequirements: null,
    clos: [
      {
        text: "CLO1",
        teachingMethods: null,
        assessmentMethods: "Quiz",
        taxonomyDomain: "KOGNITIF",
        taxonomyLevel: "C2",
        mappedPloIds: [],
      },
    ],
    topics: [{ hours: topicHours }],
    assessments: [
      { phase: "CONTINUOUS", weightagePercent: "50", hours: zeroHours },
    ],
    isIndustrialTraining50Elt: false,
  });

  const byKey = new Map(result.sections.map((section) => [section.key, section]));
  assert.equal(byKey.get("clo")?.complete, false);
  assert.equal(byKey.get("assessment")?.complete, false);
  assert.equal(result.percentage, 60);
});
