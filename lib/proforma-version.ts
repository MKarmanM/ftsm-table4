import { Prisma, ProformaStatus } from "./generated/prisma/client";
import { prisma } from "./prisma";

/**
 * Race condition this guards against:
 *
 *   Two people click "create new draft" for the same course at the same
 *   moment. Both read MAX(versionNo) = 3, both compute nextVersionNo = 4,
 *   both try to insert versionNo = 4 → one succeeds, one throws a unique
 *   constraint error on [courseId, versionNo] — or worse, if the unique
 *   constraint were missing, you'd silently get two "version 4" rows.
 *
 * Fix: read-then-write inside a Serializable transaction. Postgres will
 * detect the conflicting concurrent transaction and make one of them fail
 * with a serialization error (P2034 fails through Prisma's interactive
 * transaction with a retriable error code). We retry a few times with a
 * short backoff, which is the standard pattern for serializable
 * transactions — they're expected to fail occasionally under contention
 * and succeed on retry.
 */

const MAX_RETRIES = 5;

export async function createDraftVersion(params: {
  courseId: string;
  createdById: string;
  payload?: Prisma.InputJsonValue;
}) {
  const { courseId, createdById, payload = {} } = params;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
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
      );
    } catch (err) {
      const isSerializationFailure =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        // P2034: transaction failed due to a write conflict or deadlock.
        // Prisma's documented signal to retry a serializable transaction.
        err.code === "P2034";

      const isLastAttempt = attempt === MAX_RETRIES;

      if (!isSerializationFailure || isLastAttempt) {
        throw err;
      }

      // Small jittered backoff before retrying.
      await new Promise((resolve) =>
        setTimeout(resolve, 25 * attempt + Math.random() * 25)
      );
    }
  }

  // Unreachable, but keeps TypeScript happy.
  throw new Error("createDraftVersion: exhausted retries");
}
