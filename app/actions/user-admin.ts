"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Prisma, Role } from "@/lib/generated/prisma/client";

const PERMISSION_DENIED_MESSAGE =
  "Hanya Admin boleh mengurus pengguna dan peranan.";

// Roles that apply faculty-wide (no specific programme attached).
// Everything else requires a programmeId.
const FACULTY_WIDE_ROLES = new Set<Role>([Role.ADMIN, Role.FACULTY_OFFICER]);

function isDuplicateError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

export type CreateUserState = { error?: string; success?: boolean };

export async function createUserAction(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }
  if (!canManageUsers(currentUser)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const staffNo = String(formData.get("staffNo") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "Nama, emel, dan kata laluan wajib diisi." };
  }
  if (password.length < 8) {
    return { error: "Kata laluan mesti sekurang-kurangnya 8 aksara." };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        email,
        staffNo: staffNo || null,
        passwordHash,
      },
    });
  } catch (err) {
    if (isDuplicateError(err)) {
      return { error: `Emel "${email}" sudah digunakan.` };
    }
    console.error("createUserAction failed:", err);
    return { error: "Gagal mencipta pengguna. Sila cuba lagi." };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export type AssignRoleState = { error?: string; success?: boolean };

export async function assignRoleAction(
  _prevState: AssignRoleState,
  formData: FormData
): Promise<AssignRoleState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }
  if (!canManageUsers(currentUser)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as Role;
  const programmeId = String(formData.get("programmeId") ?? "").trim();

  if (!userId || !role) {
    return { error: "Pengguna dan peranan wajib dipilih." };
  }

  const isFacultyWide = FACULTY_WIDE_ROLES.has(role);
  if (!isFacultyWide && !programmeId) {
    return { error: "Peranan ini memerlukan program dipilih." };
  }

  try {
    await prisma.userRole.create({
      data: {
        userId,
        role,
        programmeId: isFacultyWide ? null : programmeId,
      },
    });
  } catch (err) {
    if (isDuplicateError(err)) {
      return { error: "Pengguna ini sudah mempunyai peranan tersebut." };
    }
    console.error("assignRoleAction failed:", err);
    return { error: "Gagal memberi peranan. Sila cuba lagi." };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export type RemoveRoleState = { error?: string };

export async function removeRoleAction(
  _prevState: RemoveRoleState,
  formData: FormData
): Promise<RemoveRoleState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }
  if (!canManageUsers(currentUser)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  const userRoleId = String(formData.get("userRoleId") ?? "");
  if (!userRoleId) {
    return { error: "Peranan tidak sah." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const roleToRemove = await tx.userRole.findUnique({
        where: { id: userRoleId },
        select: { role: true },
      });
      if (!roleToRemove) throw new Error("ROLE_NOT_FOUND");

      if (roleToRemove.role === Role.ADMIN) {
        const adminCount = await tx.userRole.count({
          where: { role: Role.ADMIN, programmeId: null, user: { isActive: true } },
        });
        if (adminCount <= 1) throw new Error("LAST_ADMIN");
      }

      await tx.userRole.delete({ where: { id: userRoleId } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (err) {
    if (err instanceof Error && err.message === "LAST_ADMIN") {
      return { error: "Peranan ADMIN terakhir tidak boleh dibuang." };
    }
    if (err instanceof Error && err.message === "ROLE_NOT_FOUND") {
      return { error: "Peranan tidak dijumpai." };
    }
    console.error("removeRoleAction failed:", err);
    return { error: "Gagal membuang peranan. Sila cuba lagi." };
  }

  revalidatePath("/admin/users");
  return {};
}

export type SetUserActiveState = { error?: string };

export async function setUserActiveAction(
  _prevState: SetUserActiveState,
  formData: FormData
): Promise<SetUserActiveState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }
  if (!canManageUsers(currentUser)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  const userId = String(formData.get("userId") ?? "");
  const isActive = formData.get("isActive") === "true";

  if (!userId) {
    return { error: "Pengguna tidak sah." };
  }

  // Never let an Admin deactivate their own account — that would lock
  // them (and potentially everyone) out of the admin area with no way
  // back in short of editing the database directly.
  if (!isActive && userId === currentUser.id) {
    return { error: "Anda tidak boleh menyahaktifkan akaun anda sendiri." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });

  revalidatePath("/admin/users");
  return {};
}

export type AssignCourseState = { error?: string; success?: boolean };

export async function assignCourseAction(
  _prevState: AssignCourseState,
  formData: FormData
): Promise<AssignCourseState> {
  const actor = await getCurrentUser();
  if (!actor) return { error: "Sesi telah tamat. Sila log masuk semula." };
  if (!canManageUsers(actor)) return { error: PERMISSION_DENIED_MESSAGE };

  const userId = String(formData.get("userId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!userId || !courseId) return { error: "Pengguna dan kursus wajib dipilih." };

  const [course, user] = await Promise.all([
    prisma.course.findFirst({ where: { id: courseId, isActive: true }, select: { programmeId: true } }),
    prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: { roles: { select: { role: true, programmeId: true } } },
    }),
  ]);
  if (!course || !user || !user.roles.some(
    (r) => r.role === Role.LECTURER && r.programmeId === course.programmeId
  )) {
    return { error: "Pensyarah mesti aktif dan mempunyai peranan bagi program kursus ini." };
  }

  const existing = await prisma.courseAssignment.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });
  if (existing) return { error: "Pengguna ini sudah ditugaskan kepada kursus tersebut." };

  try {
    await prisma.$transaction(async (tx) => {
      const assignment = await tx.courseAssignment.create({
        data: { courseId, userId, isCoordinator: false },
      });
      await tx.auditEvent.create({
        data: {
          actorId: actor.id, action: "ASSIGN_LECTURER", entityType: "CourseAssignment",
          entityId: assignment.id, metadata: { userId, courseId },
        },
      });
    });
  } catch (err) {
    if (isDuplicateError(err)) return { error: "Pengguna ini sudah ditugaskan kepada kursus tersebut." };
    console.error("assignCourseAction failed:", err);
    return { error: "Gagal menugaskan kursus. Sila cuba lagi." };
  }
  revalidatePath("/admin/users");
  return { success: true };
}

export async function removeCourseAssignmentAction(
  _prevState: AssignCourseState,
  formData: FormData
): Promise<AssignCourseState> {
  const actor = await getCurrentUser();
  if (!actor) return { error: "Sesi telah tamat. Sila log masuk semula." };
  if (!canManageUsers(actor)) return { error: PERMISSION_DENIED_MESSAGE };
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!assignmentId) return { error: "Tugasan tidak sah." };
  try {
    await prisma.$transaction(async (tx) => {
      const assignment = await tx.courseAssignment.findUnique({
        where: { id: assignmentId },
        select: { userId: true, courseId: true, isCoordinator: true },
      });
      if (!assignment || assignment.isCoordinator) throw new Error("NOT_LECTURER_ASSIGNMENT");
      await tx.courseAssignment.delete({ where: { id: assignmentId } });
      await tx.auditEvent.create({
        data: {
          actorId: actor.id, action: "REMOVE_LECTURER", entityType: "CourseAssignment",
          entityId: assignmentId,
          metadata: { userId: assignment.userId, courseId: assignment.courseId },
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_LECTURER_ASSIGNMENT") {
      return { error: "Hanya tugasan Pensyarah biasa boleh dibuang di sini." };
    }
    console.error("removeCourseAssignmentAction failed:", err);
    return { error: "Gagal membuang tugasan. Sila cuba lagi." };
  }
  revalidatePath("/admin/users");
  return { success: true };
}
