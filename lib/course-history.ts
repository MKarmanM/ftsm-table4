import { prisma } from "./prisma";

export async function getCourseVersionHistory(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { programme: true },
  });
  if (!course) return null;

  const versions = await prisma.proformaVersion.findMany({
    where: { courseId },
    orderBy: { versionNo: "desc" },
    include: { createdBy: true },
  });

  return {
    course: {
      id: course.id,
      code: course.code,
      nameMs: course.nameMs,
      programme: { code: course.programme.code },
    },
    versions: versions.map((v) => ({
      id: v.id,
      versionNo: v.versionNo,
      status: v.status,
      createdAt: v.createdAt,
      publishedAt: v.publishedAt,
      createdByName: v.createdBy.name,
    })),
  };
}
