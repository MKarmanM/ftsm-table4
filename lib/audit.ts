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

export async function getRecentAuditEvents(
  limit = 100,
  search?: string,
  action?: string
) {
  const events = await prisma.auditEvent.findMany({
    where: {
      ...(action ? { action } : {}),
      ...(search
        ? {
            OR: [
              { actor: { name: { contains: search, mode: "insensitive" as const } } },
              { action: { contains: search, mode: "insensitive" as const } },
              {
                version: {
                  course: { code: { contains: search, mode: "insensitive" as const } },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: true,
      version: {
        select: {
          id: true,
          versionNo: true,
          courseId: true,
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
    versionId: e.version?.id ?? null,
    courseId: e.version?.courseId ?? null,
    courseCode: e.version?.course.code ?? null,
    courseName: e.version?.course.nameMs ?? null,
    versionNo: e.version?.versionNo ?? null,
  }));
}

export async function getAuditActionSummary() {
  const grouped = await prisma.auditEvent.groupBy({
    by: ["action"],
    _count: { _all: true },
    orderBy: { _count: { action: "desc" } },
  });

  return grouped.map((row) => ({
    action: row.action,
    count: row._count._all,
  }));
}
