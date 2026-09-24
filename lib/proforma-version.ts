import { Prisma, ProformaStatus } from "./generated/prisma/client";
import { prisma } from "./prisma";

/**
 * Race condition this guards against:
 *
 *   Two people click "create new draft" for the same course at the same
 *   moment. Both read MAX(versionNo) = 3, both compute nextVersionNo = 4,
 *   both try to insert versionNo = 4 → one succeeds, one throws a unique
 *   constraint error on [courseId, versionNo].
 */

const MAX_RETRIES = 5;

export class ActiveDraftExistsError extends Error {
  constructor() {
    super("Kursus ini sudah mempunyai draf aktif. Buka draf tersebut sebelum mencipta versi baharu.");
  }
}

/** Serialize every transition into DRAFT on the parent course row. */
export async function assertNoActiveDraft(
  tx: Prisma.TransactionClient,
  courseId: string,
  exceptVersionId?: string
) {
  const locked = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Course" WHERE "id" = ${courseId} FOR UPDATE
  `;
  if (locked.length === 0) throw new Error("Kursus tidak dijumpai.");

  const existing = await tx.proformaVersion.findFirst({
    where: {
      courseId,
      status: ProformaStatus.DRAFT,
      ...(exceptVersionId ? { NOT: { id: exceptVersionId } } : {}),
    },
    select: { id: true },
  });
  if (existing) throw new ActiveDraftExistsError();
}

async function withVersionRetry<T>(work: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await work();
    } catch (err) {
      const isRetriable =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === "P2034" || err.code === "P2002");

      if (!isRetriable || attempt === MAX_RETRIES) throw err;

      await new Promise((resolve) =>
        setTimeout(resolve, 25 * attempt + Math.random() * 25)
      );
    }
  }

  throw new Error("Version operation exhausted retries");
}

export async function createDraftVersion(params: {
  courseId: string;
  createdById: string;
  payload?: Prisma.InputJsonValue;
}, db = prisma) {
  const { courseId, createdById, payload = {} } = params;

  return withVersionRetry(() =>
    db.$transaction(
      async (tx) => {
        await assertNoActiveDraft(tx, courseId);
        const latest = await tx.proformaVersion.findFirst({
          where: { courseId },
          orderBy: { versionNo: "desc" },
          select: { versionNo: true },
        });

        const nextVersionNo = (latest?.versionNo ?? 0) + 1;

        return tx.proformaVersion.create({
          data: {
            courseId,
            versionNo: nextVersionNo,
            status: ProformaStatus.DRAFT,
            payload,
            createdById,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )
  );
}

export async function copyDraftVersion(params: {
  sourceVersionId: string;
  courseId: string;
  createdById: string;
}) {
  const { sourceVersionId, courseId, createdById } = params;

  return withVersionRetry(() =>
    prisma.$transaction(
      async (tx) => {
        await assertNoActiveDraft(tx, courseId);
        const source = await tx.proformaVersion.findFirst({
          where: { id: sourceVersionId, courseId },
          include: {
            clos: {
              orderBy: { orderIndex: "asc" },
              include: { mappings: true },
            },
            topics: {
              orderBy: { orderIndex: "asc" },
              include: { cloMappings: true },
            },
            assessments: {
              orderBy: [{ phase: "asc" }, { orderIndex: "asc" }],
            },
          },
        });

        if (!source) throw new Error("Versi sumber tidak dijumpai.");

        const latest = await tx.proformaVersion.findFirst({
          where: { courseId },
          orderBy: { versionNo: "desc" },
          select: { versionNo: true },
        });
        const nextVersionNo = (latest?.versionNo ?? 0) + 1;

        const draft = await tx.proformaVersion.create({
          data: {
            courseId,
            versionNo: nextVersionNo,
            status: ProformaStatus.DRAFT,
            schemaFormatVersion: source.schemaFormatVersion,
            payload: source.payload as Prisma.InputJsonValue,
            createdById,
            synopsis: source.synopsis,
            academicStaffNames: source.academicStaffNames,
            yearOffered: source.yearOffered,
            semesterOffered: source.semesterOffered,
            offeringRemarks: source.offeringRemarks,
            prerequisite: source.prerequisite,
            classification: source.classification,
            classificationDomain: source.classificationDomain,
            transferableSkills: source.transferableSkills,
            specialRequirements: source.specialRequirements,
            referencesText: source.referencesText,
            futureReadyElements: source.futureReadyElements,
            excelFramework: source.excelFramework,
            sdgTags: source.sdgTags,
            aiElement: source.aiElement,
            isIndustrialTraining50Elt: source.isIndustrialTraining50Elt,
            // Approval dates are governance data and must not be copied.
            facultyApprovalDate: null,
            senateApprovalDate: null,
          },
        });

        const cloIdMap = new Map<string, string>();
        for (const clo of source.clos) {
          const created = await tx.courseLearningOutcome.create({
            data: {
              versionId: draft.id,
              orderIndex: clo.orderIndex,
              text: clo.text,
              teachingMethods: clo.teachingMethods,
              assessmentMethods: clo.assessmentMethods,
              mqfClusters: clo.mqfClusters,
              taxonomyDomain: clo.taxonomyDomain,
              taxonomyLevel: clo.taxonomyLevel,
            },
          });
          cloIdMap.set(clo.id, created.id);

          if (clo.mappings.length > 0) {
            await tx.cloPloMapping.createMany({
              data: clo.mappings.map((mapping) => ({
                cloId: created.id,
                programmePloId: mapping.programmePloId,
              })),
              skipDuplicates: true,
            });
          }
        }

        for (const topic of source.topics) {
          const createdTopic = await tx.courseTopic.create({
            data: {
              versionId: draft.id,
              orderIndex: topic.orderIndex,
              topicMs: topic.topicMs,
              topicEn: topic.topicEn,
              cloRef: topic.cloRef,
              hours: topic.hours as Prisma.InputJsonValue,
            },
          });

          const newMappings = topic.cloMappings
            .map((mapping) => cloIdMap.get(mapping.cloId))
            .filter((id): id is string => Boolean(id));

          if (newMappings.length > 0) {
            await tx.topicCloMapping.createMany({
              data: newMappings.map((cloId) => ({
                topicId: createdTopic.id,
                cloId,
              })),
              skipDuplicates: true,
            });
          }
        }

        if (source.assessments.length > 0) {
          await tx.assessmentItem.createMany({
            data: source.assessments.map((item) => ({
              versionId: draft.id,
              phase: item.phase,
              orderIndex: item.orderIndex,
              nameMs: item.nameMs,
              nameEn: item.nameEn,
              weightagePercent: item.weightagePercent,
              hours: item.hours as Prisma.InputJsonValue,
            })),
          });
        }

        await tx.auditEvent.create({
          data: {
            actorId: createdById,
            versionId: draft.id,
            action: "COPY_PREVIOUS_VERSION",
            entityType: "ProformaVersion",
            entityId: draft.id,
            metadata: {
              sourceVersionId: source.id,
              sourceVersionNo: source.versionNo,
            },
          },
        });

        return draft;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )
  );
}
