import { Prisma } from "./generated/prisma/client";
import { ProformaStatus, type ReviewActionType } from "./generated/prisma/enums";
import { prisma } from "./prisma";
import { VALID_TRANSITIONS, ACTION_TO_STATUS } from "./workflow-constants";
import { notifyReviewAction } from "./notifications";

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

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const version = await tx.proformaVersion.findUniqueOrThrow({
        where: { id: versionId },
      });

      const allowed = VALID_TRANSITIONS[version.status];
      if (!allowed.includes(nextStatus)) {
        throw new WorkflowError(
          `Cannot go from ${version.status} to ${nextStatus} via ${type}`
        );
      }

      const timestampField =
        nextStatus === ProformaStatus.SUBMITTED
          ? { submittedAt: new Date() }
          : nextStatus === ProformaStatus.APPROVED
          ? // Item 15 ("Tarikh Kelulusan Terkini / Faculty") is derived
            // from the Programme Coordinator's approval — not typed
            // manually — per the official Table 4 convention that
            // Faculty approval = Programme Coordinator sign-off date.
            { approvedAt: new Date(), facultyApprovalDate: new Date() }
          : nextStatus === ProformaStatus.PUBLISHED
          ? // Item 15's Senate date is likewise derived — from the
            // Faculty Officer's publish action.
            { publishedAt: new Date(), senateApprovalDate: new Date() }
          : {};

      // Publishing a new version automatically supersedes whichever
      // version of this course is currently PUBLISHED (if any) — this is
      // a system-triggered transition, not something a user clicks a
      // button for, which is why SUPERSEDED has no corresponding
      // ReviewActionType. Doing this inside the same transaction as the
      // PUBLISH update means the partial unique index
      // (one_published_version_per_course, see manual-fixes.sql) never
      // actually gets violated in the normal flow — the old row moves
      // out of the way first.
      if (nextStatus === ProformaStatus.PUBLISHED) {
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
          metadata: { from: version.status, to: nextStatus },
        },
      });

      return updated;
    });

    // Fire the notification email after the transaction has committed —
    // a failed/slow email must never roll back or block the actual
    // status change, and must never make this action report failure
    // when the status change itself succeeded. Wrapped in its own
    // try/catch so nothing here can propagate to the outer catch below.
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

    return updated;
  } catch (err) {
    // Translate the partial-unique-index violation (see manual-fixes.sql)
    // into a message a UI can actually show someone, instead of a raw
    // Postgres constraint error.
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
