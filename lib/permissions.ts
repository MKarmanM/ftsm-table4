import { Role, type ReviewActionType } from "./generated/prisma/enums";

// Pure logic only — takes an already-loaded user (with roles + course
// assignments) and course context, and returns a yes/no or a filtered
// list. No Prisma calls here, so this is safe to import from anywhere
// (though in practice it's only used server-side, alongside a
// getCurrentUser() call that did the actual DB lookup).

export type PermissionUser = {
  id: string;
  roles: { role: Role; programmeId: string | null }[];
  assignments: { courseId: string; isCoordinator: boolean }[];
};

export type CourseContext = {
  id: string;
  programmeId: string;
};

function hasFacultyWideRole(user: PermissionUser, role: Role): boolean {
  return user.roles.some((r) => r.role === role && r.programmeId === null);
}

function hasProgrammeRole(
  user: PermissionUser,
  role: Role,
  programmeId: string
): boolean {
  return user.roles.some(
    (r) => r.role === role && r.programmeId === programmeId
  );
}

export function isAdmin(user: PermissionUser): boolean {
  return hasFacultyWideRole(user, Role.ADMIN);
}

export function isFacultyOfficer(user: PermissionUser): boolean {
  return hasFacultyWideRole(user, Role.FACULTY_OFFICER);
}

// Creating/editing the Programme & Course catalog is an office-level task
// — same pair of roles as the "office-first" MVP decision for drafts.
export function canManageCatalog(user: PermissionUser): boolean {
  return isAdmin(user) || isFacultyOfficer(user);
}

// User/role management (including granting ADMIN itself) is Admin-only —
// letting Faculty Officer create accounts is fine, but letting them grant
// arbitrary roles (including ADMIN) would be a privilege-escalation path.
export function canManageUsers(user: PermissionUser): boolean {
  return isAdmin(user);
}

function isProgrammeCoordinatorOf(
  user: PermissionUser,
  programmeId: string
): boolean {
  return hasProgrammeRole(user, Role.PROGRAMME_COORDINATOR, programmeId);
}

function isCourseCoordinatorOf(user: PermissionUser, courseId: string): boolean {
  return user.assignments.some(
    (a) => a.courseId === courseId && a.isCoordinator
  );
}

// Who can create a new draft / edit an existing draft's payload for this
// course. Matches the "office-first" MVP decision: Faculty Officer can
// key in on behalf of any course, Course Coordinator can manage their
// own course, Admin can do anything.
export function canManageDraft(
  user: PermissionUser,
  course: CourseContext
): boolean {
  return (
    isAdmin(user) ||
    isFacultyOfficer(user) ||
    isCourseCoordinatorOf(user, course.id)
  );
}

// Which of the statuses-allow-this-transition actions this specific user
// is actually permitted to perform, given the approval chain:
// Course Coordinator submits → Programme Coordinator reviews/approves →
// Faculty Officer publishes. Admin can do anything.
export function filterActionsByPermission(
  user: PermissionUser,
  actions: ReviewActionType[],
  course: CourseContext
): ReviewActionType[] {
  return actions.filter((type) => {
    if (isAdmin(user)) return true;

    switch (type) {
      case "SUBMIT":
      case "REOPEN_DRAFT":
        return isCourseCoordinatorOf(user, course.id);
      case "REQUEST_CHANGES":
      case "APPROVE":
        return isProgrammeCoordinatorOf(user, course.programmeId);
      case "PUBLISH":
      case "ARCHIVE":
        return isFacultyOfficer(user);
      default:
        return false;
    }
  });
}

// Convenience single-action check, used inside Server Actions to reject
// a request even if someone bypasses the UI and calls the action
// directly with a disallowed `type`.
export function isActionPermitted(
  user: PermissionUser,
  type: ReviewActionType,
  course: CourseContext
): boolean {
  return filterActionsByPermission(user, [type], course).includes(type);
}
