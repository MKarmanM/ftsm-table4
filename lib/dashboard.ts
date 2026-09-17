import { prisma } from "./prisma";
import { getAllowedActions } from "./workflow-constants";
import {
  filterActionsByPermission,
  isAdmin,
  isFacultyOfficer,
  type PermissionUser,
} from "./permissions";
import { ProformaStatus, Role } from "./generated/prisma/enums";
import { computeDashboardAnalytics } from "./dashboard-analytics";

// Only "in-flight" statuses can ever need someone's action next; PUBLISHED/
// SUPERSEDED/ARCHIVED are terminal for that version (a new draft might
// follow, but that's a separate row).
const ACTIONABLE_STATUSES: ProformaStatus[] = [
  ProformaStatus.DRAFT,
  ProformaStatus.SUBMITTED,
  ProformaStatus.CHANGES_REQUESTED,
  ProformaStatus.APPROVED,
];

export async function getPendingActionsForUser(user: PermissionUser) {
  const canSeeFacultyWide = isAdmin(user) || isFacultyOfficer(user);
  const programmeIds = user.roles
    .filter((role) => role.role === Role.PROGRAMME_COORDINATOR && role.programmeId)
    .map((role) => role.programmeId as string);
  const courseIds = user.assignments
    .filter((assignment) => assignment.isCoordinator)
    .map((assignment) => assignment.courseId);

  const versions = await prisma.proformaVersion.findMany({
    where: {
      status: { in: ACTIONABLE_STATUSES },
      ...(!canSeeFacultyWide
        ? {
            course: {
              OR: [
                ...(programmeIds.length ? [{ programmeId: { in: programmeIds } }] : []),
                ...(courseIds.length ? [{ id: { in: courseIds } }] : []),
              ],
            },
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { course: { include: { programme: true } } },
  });

  return versions
    .filter((v) => {
      const allowed = getAllowedActions(v.status);
      const permitted = filterActionsByPermission(user, allowed, {
        id: v.course.id,
        programmeId: v.course.programmeId,
      });
      return permitted.length > 0;
    })
    .map((v) => ({
      id: v.id,
      versionNo: v.versionNo,
      status: v.status,
      updatedAt: v.updatedAt,
      courseId: v.course.id,
      courseCode: v.course.code,
      courseName: v.course.nameMs,
      programmeCode: v.course.programme.code,
    }));
}

const SUMMARY_STATUSES: ProformaStatus[] = [
  ProformaStatus.DRAFT,
  ProformaStatus.SUBMITTED,
  ProformaStatus.CHANGES_REQUESTED,
  ProformaStatus.APPROVED,
  ProformaStatus.PUBLISHED,
];

export async function getStatusCounts() {
  const grouped = await prisma.proformaVersion.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};
  for (const status of SUMMARY_STATUSES) counts[status] = 0;
  for (const g of grouped) counts[g.status] = g._count._all;

  return SUMMARY_STATUSES.map((status) => ({
    status,
    count: counts[status] ?? 0,
  }));
}

export async function getDashboardAnalytics() {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: {
      versions: {
        orderBy: { versionNo: "desc" },
        take: 1,
        select: { status: true },
      },
    },
  });

  return computeDashboardAnalytics(
    courses.map((course) => ({
      latestStatus: course.versions[0]?.status ?? null,
    }))
  );
}
