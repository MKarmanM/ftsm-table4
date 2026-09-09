import { prisma } from "./prisma";
import { ProformaStatus } from "./generated/prisma/client";

export async function getCoursesOverview(search?: string) {
  const courses = await prisma.course.findMany({
    where: {
      isActive: true,
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { nameMs: { contains: search, mode: "insensitive" } },
              { nameEn: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { code: "asc" },
    include: {
      programme: true,
      assignments: {
        where: { isCoordinator: true },
        include: { user: true },
      },
      versions: {
        orderBy: { versionNo: "desc" },
        take: 1,
      },
    },
  });

  return courses.map((course) => {
    const coordinator = course.assignments[0]?.user ?? null;
    const latestVersion = course.versions[0] ?? null;

    return {
      id: course.id,
      code: course.code,
      nameMs: course.nameMs,
      nameEn: course.nameEn,
      creditHours: course.creditHours.toString(),
      programme: {
        id: course.programme.id,
        code: course.programme.code,
        nameMs: course.programme.nameMs,
      },
      coordinatorName: coordinator?.name ?? null,
      latestVersion: latestVersion
        ? { id: latestVersion.id, versionNo: latestVersion.versionNo, status: latestVersion.status }
        : null,
    };
  });
}

export type CourseOverview = Awaited<
  ReturnType<typeof getCoursesOverview>
>[number];

// Small helper so the status badge wording/coloring stays in one place
// as more of the UI needs to show a ProformaStatus.
export const STATUS_LABEL: Record<ProformaStatus, string> = {
  DRAFT: "Draf",
  SUBMITTED: "Dihantar",
  CHANGES_REQUESTED: "Perlu Pembetulan",
  APPROVED: "Diluluskan",
  PUBLISHED: "Diterbitkan",
  SUPERSEDED: "Digantikan",
  ARCHIVED: "Diarkibkan",
};
