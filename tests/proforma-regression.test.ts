import test from "node:test";
import assert from "node:assert/strict";
import { createDraftVersion, ActiveDraftExistsError } from "../lib/proforma-version";
import { getTable4Detail } from "../lib/table4-detail";
import { prisma } from "../lib/prisma";

test("M06: creating a draft checks the locked course for an active draft", async () => {
  const operations: string[] = [];
  const tx = {
    $queryRaw: async (parts: TemplateStringsArray) => {
      operations.push("lock course");
      assert.match(parts.join("?"), /FROM "Course"[\s\S]*FOR UPDATE/);
      return [{ id: "course-1" }];
    },
    proformaVersion: {
      findFirst: async (query: { where: { courseId: string; status: string } }) => {
        operations.push("find draft");
        assert.deepEqual(query.where, { courseId: "course-1", status: "DRAFT" });
        return { id: "existing-draft" };
      },
      create: async () => {
        operations.push("create draft");
        throw new Error("A second draft must never be created");
      },
    },
  };
  const db = {
    $transaction: async (work: (value: typeof tx) => Promise<unknown>) => work(tx),
  } as unknown as typeof prisma;

  await assert.rejects(
    createDraftVersion({ courseId: "course-1", createdById: "admin" }, db),
    ActiveDraftExistsError
  );
  assert.deepEqual(operations, ["lock course", "find draft"]);
});

test("M19: print detail derives credit from version SLT when catalogue credit is zero", async () => {
  const db = {
    proformaVersion: {
      findUnique: async () => ({
        id: "version-1", versionNo: 1, status: "DRAFT", publishedAt: null,
        createdBy: { name: "Admin" },
        course: {
          id: "course-1", code: "RPT2309", nameMs: "Kursus Ujian",
          creditHours: 0, programmeId: "programme-1", programme: { code: "UAT26" },
        },
        clos: [], assessments: [], isIndustrialTraining50Elt: false,
        topics: [{
          id: "topic-1", orderIndex: 1, topicMs: "Topik", topicEn: "Topic",
          cloRef: null, cloMappings: [],
          hours: {
            f2fPhysical: { l: 20, t: 0, p: 0, o: 0 },
            f2fOnline: { l: 0, t: 0, p: 0, o: 0 },
            independent: 40,
          },
        }],
      }),
    },
    programmePlo: { findMany: async () => [] },
  } as unknown as typeof prisma;

  const detail = await getTable4Detail("version-1", db);
  assert.equal(detail?.course.creditHours, "1");
});
