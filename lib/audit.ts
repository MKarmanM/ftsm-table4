import { prisma } from "./prisma";

export async function getAuditEventsForVersion(versionId: string) {
  const events = await prisma.auditEvent.findMany({
    where: { versionId },
    orderBy: { createdAt: "desc" },
    include: { actor: true },
  });

  return events.map((e) => ({
    id: e.id,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId,
    createdAt: e.createdAt,
    actorName: e.actor.name,
    metadata: e.metadata,
  }));
}

export async function getRecentAuditEvents(limit = 100, search?: string) {
  const events = await prisma.auditEvent.findMany({
    where: search
      ? {
          OR: [
            { actor: { name: { contains: search, mode: "insensitive" } } },
            { action: { contains: search, mode: "insensitive" } },
            {
              version: {
                course: { code: { contains: search, mode: "insensitive" } },
              },
            },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: true,
      version: {
        select: {
          versionNo: true,
          course: { select: { code: true, nameMs: true } },
        },
      },
    },
  });

  return events.map((e) => ({
    id: e.id,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId,
    createdAt: e.createdAt,
    actorName: e.actor.name,
    courseCode: e.version?.course.code ?? null,
    courseName: e.version?.course.nameMs ?? null,
    versionNo: e.version?.versionNo ?? null,
  }));
}
