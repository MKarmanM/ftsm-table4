import test from "node:test";
import assert from "node:assert/strict";
import {
  canManageDraft,
  canViewDraft,
  filterActionsByPermission,
  type PermissionUser,
} from "../lib/permissions";
import { Role, ReviewActionType } from "../lib/generated/prisma/enums";

const course = { id: "course-a", programmeId: "programme-a" };

function user(
  roles: PermissionUser["roles"] = [],
  assignments: PermissionUser["assignments"] = []
): PermissionUser {
  return { id: "user", roles, assignments };
}

test("faculty-wide roles can view every course", () => {
  for (const role of [Role.ADMIN, Role.FACULTY_OFFICER]) {
    assert.equal(canViewDraft(user([{ role, programmeId: null }]), course), true);
  }
});

test("programme coordinator can only view their programme", () => {
  const coordinator = user([
    { role: Role.PROGRAMME_COORDINATOR, programmeId: "programme-a" },
  ]);
  assert.equal(canViewDraft(coordinator, course), true);
  assert.equal(
    canViewDraft(coordinator, { id: "course-b", programmeId: "programme-b" }),
    false
  );
});

test("assigned lecturer can view but cannot edit a course", () => {
  const lecturer = user(
    [{ role: Role.LECTURER, programmeId: "programme-a" }],
    [{ courseId: course.id, isCoordinator: false }]
  );
  assert.equal(canViewDraft(lecturer, course), true);
  assert.equal(canManageDraft(lecturer, course), false);
});

test("course coordinator can edit and submit only assigned course", () => {
  const coordinator = user(
    [{ role: Role.COURSE_COORDINATOR, programmeId: "programme-a" }],
    [{ courseId: course.id, isCoordinator: true }]
  );
  assert.equal(canManageDraft(coordinator, course), true);
  assert.deepEqual(
    filterActionsByPermission(
      coordinator,
      [ReviewActionType.SUBMIT, ReviewActionType.APPROVE],
      course
    ),
    [ReviewActionType.SUBMIT]
  );
});
