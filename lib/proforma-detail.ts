import { prisma } from "./prisma";

export async function getVersionDetail(versionId: string) {
  const version = await prisma.proformaVersion.findUnique({
    where: { id: versionId },
    include: {
      course: { include: { programme: true } },
      createdBy: true,
      reviewActions: {
        orderBy: { createdAt: "desc" },
        include: { actor: { include: { roles: true } } },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: true },
      },
    },
  });

  if (!version) return null;

  return {
    id: version.id,
    versionNo: version.versionNo,
    status: version.status,
    payload: version.payload,
    submittedAt: version.submittedAt,
    approvedAt: version.approvedAt,
    publishedAt: version.publishedAt,
    createdAt: version.createdAt,
    createdBy: { name: version.createdBy.name, email: version.createdBy.email },
    course: {
      id: version.course.id,
      code: version.course.code,
      nameMs: version.course.nameMs,
      creditHours: version.course.creditHours.toString(),
      programme: {
        id: version.course.programme.id,
        code: version.course.programme.code,
        nameMs: version.course.programme.nameMs,
      },
    },
    reviewActions: version.reviewActions.map((a) => ({
      id: a.id,
      type: a.type,
      note: a.note,
      createdAt: a.createdAt,
      actorName: a.actor.name,
      actorRoles: Array.from(new Set(a.actor.roles.map((r) => r.role))),
    })),
    comments: version.comments.map((c) => ({
      id: c.id,
      body: c.body,
      sectionKey: c.sectionKey,
      createdAt: c.createdAt,
      authorName: c.author.name,
    })),
  };
}

export type VersionDetail = Awaited<ReturnType<typeof getVersionDetail>>;
