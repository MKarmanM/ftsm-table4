import { Prisma } from "./generated/prisma/client";
import { ProformaStatus, type ReviewActionType } from "./generated/prisma/enums";
import { prisma } from "./prisma";
import { VALID_TRANSITIONS, ACTION_TO_STATUS } from "./workflow-constants";
import { notifyReviewAction } from "./notifications";
import { after } from "next/server";
import { computeSltSummary, normalizeHours } from "./table4-detail";
import { formatValidationIssues, validateTable4ForSubmission } from "./table4-validation";
import { assertNoActiveDraft } from "./proforma-version";

// Server-only: this file imports "./prisma" (pg driver, Node-only). Never
// import this from a Client Component — import lib/workflow-constants.ts
// instead for the pure status/label data.
export { VALID_TRANSITIONS, ACTION_TO_STATUS, ACTION_LABEL, getAllowedActions } from "./workflow-constants";

class WorkflowError extends Error {}

export async function applyReviewAction(params: {
  versionId: string;
  actorId: string;
  type: ReviewActionType;
  note?: string;
}) {
  const { versionId, actorId, type, note } = params;
  const nextStatus = ACTION_TO_STATUS[type];

  // Submission is the quality gate. A draft cannot enter the review chain
  // until all mandatory Table 4 business rules are satisfied.
  if (type === "SUBMIT") {
    const issues = await validateTable4ForSubmission(versionId);
    if (issues.length > 0) {
      throw new WorkflowError(formatValidationIssues(issues));
    }
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const version = await tx.proformaVersion.findUniqueOrThrow({
        where: { id: versionId },
        include: {
          topics: { select: { hours: true } },
          assessments: { select: { hours: true } },
        },
      });

      const allowed = VALID_TRANSITIONS[version.status];
      if (!allowed.includes(nextStatus)) {
        throw new WorkflowError(
          `Cannot go from ${version.status} to ${nextStatus} via ${type}`
        );
      }

      if (nextStatus === ProformaStatus.DRAFT) {
        await assertNoActiveDraft(tx, version.courseId, version.id);
      }

      const timestampField =
        nextStatus === ProformaStatus.SUBMITTED
          ? { submittedAt: new Date() }
          : nextStatus === ProformaStatus.APPROVED
          ? { approvedAt: new Date(), facultyApprovalDate: new Date() }
          : nextStatus === ProformaStatus.PUBLISHED
          ? { publishedAt: new Date(), senateApprovalDate: new Date() }
          : {};

      let derivedCreditHours: number | null = null;

      if (nextStatus === ProformaStatus.PUBLISHED) {
        const slt = computeSltSummary(
          version.topics.map((topic) => ({ hours: normalizeHours(topic.hours) })),
          version.assessments.map((assessment) => ({
            hours: normalizeHours(assessment.hours),
          })),
          version.isIndustrialTraining50Elt
        );

        if (slt.suggestedCreditHours <= 0) {
          throw new WorkflowError(
            "Jumlah SLT belum mencukupi untuk menghasilkan nilai kredit. Lengkapkan SLT sebelum menerbitkan."
          );
        }

        derivedCreditHours = slt.suggestedCreditHours;

        const currentlyPublished = await tx.proformaVersion.findFirst({
          where: {
            courseId: version.courseId,
            status: ProformaStatus.PUBLISHED,
            NOT: { id: versionId },
          },
        });

        if (currentlyPublished) {
          await tx.proformaVersion.update({
            where: { id: currentlyPublished.id },
            data: { status: ProformaStatus.SUPERSEDED },
          });

          await tx.auditEvent.create({
            data: {
              actorId,
              versionId: currentlyPublished.id,
              action: "AUTO_SUPERSEDE",
              entityType: "ProformaVersion",
              entityId: currentlyPublished.id,
              metadata: { supersededByVersionId: versionId },
            },
          });
        }

        // Credit is derived from the official SLT formula, never entered by a user.
        await tx.course.update({
          where: { id: version.courseId },
          data: { creditHours: derivedCreditHours },
        });
      }

      const updated = await tx.proformaVersion.update({
        where: { id: versionId },
        data: { status: nextStatus, ...timestampField },
      });

      await tx.reviewAction.create({
        data: { versionId, actorId, type, note },
      });

      await tx.auditEvent.create({
        data: {
          actorId,
          versionId,
          action: type,
          entityType: "ProformaVersion",
          entityId: versionId,
          metadata: {
            from: version.status,
            to: nextStatus,
            ...(derivedCreditHours !== null ? { derivedCreditHours } : {}),
          },
        },
      });

      return updated;
    });

    after(async () => {
      try {
        const [course, actor] = await Promise.all([
          prisma.course.findUniqueOrThrow({
            where: { id: updated.courseId },
            select: { id: true, code: true, nameMs: true, programmeId: true },
          }),
          prisma.user.findUniqueOrThrow({
            where: { id: actorId },
            select: { name: true },
          }),
        ]);

        await notifyReviewAction({
          type,
          actorName: actor.name,
          note,
          version: { id: updated.id, versionNo: updated.versionNo, course },
        });
      } catch (notifyErr) {
        console.error("Gagal menghantar notifikasi emel:", notifyErr);
      }
    });

    return updated;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2010" &&
      typeof err.meta?.message === "string" &&
      err.meta.message.includes("one_published_version_per_course")
    ) {
      throw new WorkflowError(
        "This course already has a published version. Supersede it before publishing a new one."
      );
    }
    throw err;
  }
}
