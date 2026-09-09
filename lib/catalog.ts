import { prisma } from "./prisma";

export async function getAllProgrammes() {
  return prisma.programme.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, nameMs: true },
  });
}

export async function getProgrammesForAdmin() {
  const programmes = await prisma.programme.findMany({
    orderBy: { code: "asc" },
    include: {
      _count: { select: { courses: { where: { isActive: true } } } },
    },
  });

  return programmes.map((p) => ({
    id: p.id,
    code: p.code,
    nameMs: p.nameMs,
    nameEn: p.nameEn,
    isActive: p.isActive,
    activeCourseCount: p._count.courses,
  }));
}

export async function getCoursesForAdmin() {
  const courses = await prisma.course.findMany({
    orderBy: { code: "asc" },
    include: { programme: { select: { code: true } } },
  });

  return courses.map((c) => ({
    id: c.id,
    code: c.code,
    nameMs: c.nameMs,
    nameEn: c.nameEn,
    creditHours: c.creditHours.toString(),
    programmeId: c.programmeId,
    programmeCode: c.programme.code,
    isActive: c.isActive,
  }));
}

export async function getProgrammePlos(programmeId: string) {
  return prisma.programmePlo.findMany({
    where: { programmeId },
    orderBy: { orderNumber: "asc" },
  });
}
