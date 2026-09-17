import { prisma } from "./prisma";

export type LtpoBreakdown = { l: number; t: number; p: number; o: number };
export type HoursBreakdown = {
  f2fPhysical: LtpoBreakdown;
  f2fOnline: LtpoBreakdown;
  independent: number;
};

const EMPTY_LTPO: LtpoBreakdown = { l: 0, t: 0, p: 0, o: 0 };

export function normalizeHours(raw: unknown): HoursBreakdown {
  const r = (raw ?? {}) as Partial<HoursBreakdown>;
  return {
    f2fPhysical: { ...EMPTY_LTPO, ...(r.f2fPhysical ?? {}) },
    f2fOnline: { ...EMPTY_LTPO, ...(r.f2fOnline ?? {}) },
    independent: r.independent ?? 0,
  };
}

function ltpoSum(b: LtpoBreakdown): number {
  return (b.l ?? 0) + (b.t ?? 0) + (b.p ?? 0) + (b.o ?? 0);
}

export async function getTable4Detail(versionId: string) {
  const version = await prisma.proformaVersion.findUnique({
    where: { id: versionId },
    include: {
      course: { include: { programme: true } },
      createdBy: true,
      clos: {
        orderBy: { orderIndex: "asc" },
        include: { mappings: true },
      },
      topics: {
        orderBy: { orderIndex: "asc" },
        include: {
          cloMappings: {
            include: { clo: { select: { id: true, orderIndex: true } } },
          },
        },
      },
      assessments: { orderBy: [{ phase: "asc" }, { orderIndex: "asc" }] },
    },
  });
  if (!version) return null;

  const programmePlos = await prisma.programmePlo.findMany({
    where: { programmeId: version.course.programmeId },
    orderBy: { orderNumber: "asc" },
  });

  return {
    id: version.id,
    versionNo: version.versionNo,
    status: version.status,
    publishedAt: version.publishedAt,
    createdByName: version.createdBy.name,
    synopsis: version.synopsis,
    academicStaffNames: version.academicStaffNames,
    yearOffered: version.yearOffered,
    semesterOffered: version.semesterOffered,
    offeringRemarks: version.offeringRemarks,
    prerequisite: version.prerequisite,
    classification: version.classification,
    classificationDomain: version.classificationDomain,
    transferableSkills: version.transferableSkills,
    specialRequirements: version.specialRequirements,
    referencesText: version.referencesText,
    futureReadyElements: version.futureReadyElements,
    excelFramework: version.excelFramework,
    sdgTags: version.sdgTags,
    aiElement: version.aiElement,
    isIndustrialTraining50Elt: version.isIndustrialTraining50Elt,
    facultyApprovalDate: version.facultyApprovalDate,
    senateApprovalDate: version.senateApprovalDate,
    course: {
      id: version.course.id,
      code: version.course.code,
      nameMs: version.course.nameMs,
      creditHours: version.course.creditHours.toString(),
      programmeId: version.course.programmeId,
      programmeCode: version.course.programme.code,
    },
    programmePlos: programmePlos.map((p) => ({
      id: p.id,
      orderNumber: p.orderNumber,
      textMs: p.textMs,
    })),
    clos: version.clos.map((c) => ({
      id: c.id,
      orderIndex: c.orderIndex,
      text: c.text,
      teachingMethods: c.teachingMethods,
      assessmentMethods: c.assessmentMethods,
      mqfClusters: c.mqfClusters,
      taxonomyDomain: c.taxonomyDomain,
      taxonomyLevel: c.taxonomyLevel,
      mappedPloIds: c.mappings.map((m) => m.programmePloId),
    })),
    topics: version.topics.map((t) => {
      const mappedClos = t.cloMappings
        .map((m) => m.clo)
        .sort((a, b) => a.orderIndex - b.orderIndex);
      return {
        id: t.id,
        orderIndex: t.orderIndex,
        topicMs: t.topicMs,
        topicEn: t.topicEn,
        mappedCloIds: mappedClos.map((c) => c.id),
        cloRef:
          mappedClos.length > 0
            ? mappedClos.map((c) => `CLO${c.orderIndex}`).join(", ")
            : t.cloRef,
        hours: normalizeHours(t.hours),
      };
    }),
    assessments: version.assessments.map((a) => ({
      id: a.id,
      phase: a.phase,
      orderIndex: a.orderIndex,
      nameMs: a.nameMs,
      nameEn: a.nameEn,
      weightagePercent: a.weightagePercent?.toString() ?? null,
      hours: normalizeHours(a.hours),
    })),
  };
}

export type Table4Detail = Awaited<ReturnType<typeof getTable4Detail>>;

export function computeGroupTotal(rows: { hours: HoursBreakdown }[]): number {
  let total = 0;
  for (const row of rows) {
    total += ltpoSum(row.hours.f2fPhysical);
    total += ltpoSum(row.hours.f2fOnline);
    total += row.hours.independent ?? 0;
  }
  return total;
}

// SLT percentages and credit are derived values; users never key in the
// official credit value manually. When a version is published, the derived
// credit is persisted to Course.creditHours for catalog/reporting display.
export function computeSltSummary(
  topics: { hours: HoursBreakdown }[],
  assessments: { hours: HoursBreakdown }[],
  isIndustrialTraining50Elt = false
) {
  let f2fPhysical = 0;
  let f2fOnline = 0;
  let independent = 0;
  let practical = 0;

  for (const row of [...topics, ...assessments]) {
    f2fPhysical += ltpoSum(row.hours.f2fPhysical);
    f2fOnline += ltpoSum(row.hours.f2fOnline);
    independent += row.hours.independent ?? 0;
    practical += (row.hours.f2fPhysical.p ?? 0) + (row.hours.f2fOnline.p ?? 0);
  }

  const grandTotal = f2fPhysical + f2fOnline + independent;
  const pct = (n: number) =>
    grandTotal > 0 ? Math.round((n / grandTotal) * 10000) / 100 : 0;

  // Official Table 4 formula (item 5, Nilai Kredit):
  // normal course: INT(total SLT / 40)
  // Industrial Training/Clinical Placement with 50% ELT: INT(total SLT / 80)
  const suggestedCreditHours = Math.floor(
    grandTotal / (isIndustrialTraining50Elt ? 80 : 40)
  );

  return {
    f2fPhysical,
    f2fOnline,
    independent,
    practical,
    grandTotal,
    pctF2fPhysical: pct(f2fPhysical),
    pctOnlineIndependent: pct(f2fOnline + independent),
    pctPractical: pct(practical),
    suggestedCreditHours,
  };
}
