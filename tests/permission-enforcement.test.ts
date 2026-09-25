import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { NextRequest } from "next/server";
import { Role } from "../lib/generated/prisma/enums";
import type { PermissionUser } from "../lib/permissions";

type ModuleMockOptions = {
  namedExports: Record<string, unknown>;
};

type ModuleMock = (
  specifier: string,
  options: ModuleMockOptions
) => { restore: () => void };

const mockModule = (mock as unknown as { module: ModuleMock }).module.bind(mock);

const restrictedUser: PermissionUser = {
  id: "user-outside-scope",
  roles: [{ role: Role.LECTURER, programmeId: null }],
  assignments: [{ courseId: "course-allowed", isCoordinator: false }],
};

const authorizedUser: PermissionUser = {
  id: "faculty-officer",
  roles: [{ role: Role.FACULTY_OFFICER, programmeId: null }],
  assignments: [],
};

let currentUser: PermissionUser = restrictedUser;

const sharedTable4 = {
  id: "version-restricted",
  versionNo: 1,
  status: "DRAFT" as const,
  publishedAt: null,
  createdByName: "Pentadbir Ujian",
  synopsis: null,
  academicStaffNames: [],
  yearOffered: null,
  semesterOffered: null,
  offeringRemarks: null,
  prerequisite: null,
  classification: null,
  classificationDomain: null,
  transferableSkills: [],
  specialRequirements: null,
  referencesText: null,
  futureReadyElements: [],
  excelFramework: [],
  sdgTags: [],
  aiElement: false,
  isIndustrialTraining50Elt: false,
  facultyApprovalDate: null,
  senateApprovalDate: null,
  course: {
    id: "course-restricted",
    code: "TEST1001",
    nameMs: "Kursus Ujian Kebenaran",
    creditHours: "0",
    programmeId: "programme-restricted",
    programmeCode: "TEST",
  },
  programmePlos: [],
  clos: [],
  topics: [],
  assessments: [],
};

const sharedVersion = {
  id: "version-restricted",
  versionNo: 1,
  status: "DRAFT" as const,
  payload: null,
  submittedAt: null,
  approvedAt: null,
  publishedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  createdBy: { name: "Pentadbir Ujian", email: "admin@example.test" },
  course: {
    id: sharedTable4.course.id,
    code: sharedTable4.course.code,
    nameMs: sharedTable4.course.nameMs,
    creditHours: sharedTable4.course.creditHours,
    programme: {
      id: sharedTable4.course.programmeId,
      code: sharedTable4.course.programmeCode,
      nameMs: "Program Ujian",
    },
  },
  reviewActions: [],
  comments: [],
};

const sharedSltSummary = {
  totalF2fPhysical: 0,
  totalF2fOnline: 0,
  totalIndependent: 0,
  grandTotal: 0,
  pctF2fPhysical: 0,
  pctOnlineIndependent: 0,
  pctPractical: 0,
  suggestedCreditHours: 0,
};

mockModule(new URL("../lib/auth.ts", import.meta.url).href, {
  namedExports: {
    getCurrentUser: async () => currentUser,
  },
});

mockModule(new URL("../lib/table4-detail.ts", import.meta.url).href, {
  namedExports: {
    getTable4Detail: async () => sharedTable4,
    computeSltSummary: () => sharedSltSummary,
    computeGroupTotal: () => 0,
  },
});

mockModule(new URL("../lib/proforma-detail.ts", import.meta.url).href, {
  namedExports: {
    getVersionDetail: async () => sharedVersion,
  },
});

mockModule(new URL("../lib/audit.ts", import.meta.url).href, {
  namedExports: {
    getAuditEventsForVersion: async () => [],
  },
});

test("export DOCX returns 404 when the user is outside the course scope", async () => {
  currentUser = restrictedUser;
  const { GET } = await import("../app/api/export/[versionId]/route");
  const response = await GET(
    new NextRequest("http://localhost/api/export/version-restricted"),
    { params: Promise.resolve({ versionId: "version-restricted" }) }
  );

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-disposition"), null);
  assert.deepEqual(await response.json(), { error: "Versi tidak dijumpai." });
});

test("export DOCX returns a file when the user is authorized", async () => {
  currentUser = authorizedUser;
  const { GET } = await import("../app/api/export/[versionId]/route");
  const response = await GET(
    new NextRequest("http://localhost/api/export/version-restricted"),
    { params: Promise.resolve({ versionId: "version-restricted" }) }
  );

  assert.equal(response.status, 200);
  assert.notEqual(response.headers.get("content-disposition"), null);
});

test("export Excel returns 404 when the user is outside the course scope", async () => {
  currentUser = restrictedUser;
  const { GET } = await import("../app/api/export-excel/[versionId]/route");
  const response = await GET(
    new NextRequest("http://localhost/api/export-excel/version-restricted"),
    { params: Promise.resolve({ versionId: "version-restricted" }) }
  );

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-disposition"), null);
  assert.deepEqual(await response.json(), { error: "Versi tidak dijumpai." });
});

test("export Excel returns a file when the user is authorized", async () => {
  currentUser = authorizedUser;
  const { GET } = await import("../app/api/export-excel/[versionId]/route");
  const response = await GET(
    new NextRequest("http://localhost/api/export-excel/version-restricted"),
    { params: Promise.resolve({ versionId: "version-restricted" }) }
  );

  assert.equal(response.status, 200);
  assert.notEqual(response.headers.get("content-disposition"), null);
});

test("version page calls notFound when versionId belongs to another course", async () => {
  currentUser = restrictedUser;
  const { default: VersionDetailPage } = await import(
    "../app/courses/[courseId]/versions/[versionId]/page"
  );

  await assert.rejects(
    VersionDetailPage({
      params: Promise.resolve({
        courseId: "course-allowed",
        versionId: "version-restricted",
      }),
    }),
    (error: unknown) => {
      if (!(error instanceof Error) || !("digest" in error)) return false;
      // This digest is an internal Next.js detail and may change during framework upgrades.
      return error.digest === "NEXT_HTTP_ERROR_FALLBACK;404";
    }
  );
});

test("version page renders when versionId belongs to the course and user is authorized", async () => {
  currentUser = authorizedUser;
  const { default: VersionDetailPage } = await import(
    "../app/courses/[courseId]/versions/[versionId]/page"
  );

  const result = await VersionDetailPage({
    params: Promise.resolve({
      courseId: sharedVersion.course.id,
      versionId: sharedVersion.id,
    }),
  });

  assert.ok(result);
});
