import test from "node:test";
import assert from "node:assert/strict";
import { computeDashboardAnalytics } from "../lib/dashboard-analytics";

test("dashboard analytics use one latest status per course", () => {
  const result = computeDashboardAnalytics([
    { latestStatus: "PUBLISHED" },
    { latestStatus: "SUBMITTED" },
    { latestStatus: "APPROVED" },
    { latestStatus: "CHANGES_REQUESTED" },
    { latestStatus: "DRAFT" },
    { latestStatus: null },
  ]);

  assert.deepEqual(result, {
    totalCourses: 6,
    withTable4: 5,
    withoutTable4: 1,
    published: 1,
    inReview: 2,
    changesRequested: 1,
    drafts: 1,
    coveragePercent: 83,
    publishedPercent: 17,
  });
});

test("dashboard analytics avoid division by zero", () => {
  const result = computeDashboardAnalytics([]);
  assert.equal(result.coveragePercent, 0);
  assert.equal(result.publishedPercent, 0);
});
