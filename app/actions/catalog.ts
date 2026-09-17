"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { canManageCatalog } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

const PERMISSION_DENIED_MESSAGE =
  "Anda tidak mempunyai kebenaran untuk mengurus katalog program/kursus.";

function isDuplicateCodeError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

export type CreateProgrammeState = { error?: string; success?: boolean };

export async function createProgrammeAction(
  _prevState: CreateProgrammeState,
  formData: FormData
): Promise<CreateProgrammeState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }
  if (!canManageCatalog(currentUser)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const nameMs = String(formData.get("nameMs") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();

  if (!code || !nameMs) {
    return { error: "Kod dan nama program (BM) wajib diisi." };
  }

  try {
    await prisma.programme.create({
      data: { code, nameMs, nameEn: nameEn || null },
    });
  } catch (err) {
    if (isDuplicateCodeError(err)) {
      return { error: `Kod program "${code}" sudah wujud.` };
    }
    console.error("createProgrammeAction failed:", err);
    return { error: "Gagal mencipta program. Sila cuba lagi." };
  }

  revalidatePath("/admin");
  return { success: true };
}

export type CreateCourseState = { error?: string; success?: boolean };

export async function createCourseAction(
  _prevState: CreateCourseState,
  formData: FormData
): Promise<CreateCourseState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }
  if (!canManageCatalog(currentUser)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const nameMs = String(formData.get("nameMs") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const programmeId = String(formData.get("programmeId") ?? "").trim();

  if (!code || !nameMs || !programmeId) {
    return { error: "Kod, nama kursus (BM), dan program wajib diisi." };
  }

  const programme = await prisma.programme.findUnique({
    where: { id: programmeId },
    select: { id: true },
  });
  if (!programme) {
    return { error: "Program yang dipilih tidak sah." };
  }

  try {
    await prisma.course.create({
      data: {
        code,
        nameMs,
        nameEn: nameEn || null,
        // Nilai rasmi dikira daripada jumlah SLT apabila Table 4 diterbitkan.
        creditHours: 0,
        programmeId,
      },
    });
  } catch (err) {
    if (isDuplicateCodeError(err)) {
      return { error: `Kod kursus "${code}" sudah wujud.` };
    }
    console.error("createCourseAction failed:", err);
    return { error: "Gagal mencipta kursus. Sila cuba lagi." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export type UpdateProgrammeState = { error?: string; success?: boolean };

export async function updateProgrammeAction(
  _prevState: UpdateProgrammeState,
  formData: FormData
): Promise<UpdateProgrammeState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }
  if (!canManageCatalog(currentUser)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  const programmeId = String(formData.get("programmeId") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const nameMs = String(formData.get("nameMs") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();

  if (!programmeId || !code || !nameMs) {
    return { error: "Kod dan nama program (BM) wajib diisi." };
  }

  try {
    await prisma.programme.update({
      where: { id: programmeId },
      data: { code, nameMs, nameEn: nameEn || null },
    });
  } catch (err) {
    if (isDuplicateCodeError(err)) {
      return { error: `Kod program "${code}" sudah digunakan program lain.` };
    }
    console.error("updateProgrammeAction failed:", err);
    return { error: "Gagal mengemaskini program. Sila cuba lagi." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export type SetProgrammeActiveState = { error?: string };

export async function setProgrammeActiveAction(
  _prevState: SetProgrammeActiveState,
  formData: FormData
): Promise<SetProgrammeActiveState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }
  if (!canManageCatalog(currentUser)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  const programmeId = String(formData.get("programmeId") ?? "");
  const isActive = formData.get("isActive") === "true";

  if (!programmeId) {
    return { error: "Program tidak sah." };
  }

  if (!isActive) {
    const activeCourseCount = await prisma.course.count({
      where: { programmeId, isActive: true },
    });
    if (activeCourseCount > 0) {
      return {
        error: `Tidak boleh nyahaktifkan — masih ada ${activeCourseCount} kursus aktif di bawah program ini. Nyahaktifkan kursus tersebut dahulu.`,
      };
    }
  }

  await prisma.programme.update({
    where: { id: programmeId },
    data: { isActive },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}

export type UpdateCourseState = { error?: string; success?: boolean };

export async function updateCourseAction(
  _prevState: UpdateCourseState,
  formData: FormData
): Promise<UpdateCourseState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }
  if (!canManageCatalog(currentUser)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  const courseId = String(formData.get("courseId") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const nameMs = String(formData.get("nameMs") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const programmeId = String(formData.get("programmeId") ?? "").trim();

  if (!courseId || !code || !nameMs || !programmeId) {
    return { error: "Kod, nama kursus (BM), dan program wajib diisi." };
  }

  const programme = await prisma.programme.findUnique({
    where: { id: programmeId },
    select: { id: true },
  });
  if (!programme) {
    return { error: "Program yang dipilih tidak sah." };
  }

  try {
    await prisma.course.update({
      where: { id: courseId },
      // creditHours intentionally omitted: it is system-derived from SLT.
      data: { code, nameMs, nameEn: nameEn || null, programmeId },
    });
  } catch (err) {
    if (isDuplicateCodeError(err)) {
      return { error: `Kod kursus "${code}" sudah digunakan kursus lain.` };
    }
    console.error("updateCourseAction failed:", err);
    return { error: "Gagal mengemaskini kursus. Sila cuba lagi." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export type SetCourseActiveState = { error?: string };

export async function setCourseActiveAction(
  _prevState: SetCourseActiveState,
  formData: FormData
): Promise<SetCourseActiveState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }
  if (!canManageCatalog(currentUser)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  const courseId = String(formData.get("courseId") ?? "");
  const isActive = formData.get("isActive") === "true";

  if (!courseId) {
    return { error: "Kursus tidak sah." };
  }

  await prisma.course.update({
    where: { id: courseId },
    data: { isActive },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}

export type AddPloState = { error?: string; success?: boolean };

export async function addPloAction(
  _prevState: AddPloState,
  formData: FormData
): Promise<AddPloState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }
  if (!canManageCatalog(currentUser)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  const programmeId = String(formData.get("programmeId") ?? "");
  const orderNumberRaw = String(formData.get("orderNumber") ?? "").trim();
  const textMs = String(formData.get("textMs") ?? "").trim();
  const textEn = String(formData.get("textEn") ?? "").trim();

  if (!programmeId || !orderNumberRaw || !textMs) {
    return { error: "Nombor PLO dan teks (BM) wajib diisi." };
  }

  const orderNumber = Number(orderNumberRaw);
  if (!Number.isInteger(orderNumber) || orderNumber <= 0) {
    return { error: "Nombor PLO mesti nombor bulat positif." };
  }

  try {
    await prisma.programmePlo.create({
      data: { programmeId, orderNumber, textMs, textEn: textEn || null },
    });
  } catch (err) {
    if (isDuplicateCodeError(err)) {
      return { error: `PLO${orderNumber} sudah wujud untuk program ini.` };
    }
    console.error("addPloAction failed:", err);
    return { error: "Gagal menambah PLO. Sila cuba lagi." };
  }

  revalidatePath("/admin/programmes");
  return { success: true };
}

export type RemovePloState = { error?: string };

export async function removePloAction(
  _prevState: RemovePloState,
  formData: FormData
): Promise<RemovePloState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }
  if (!canManageCatalog(currentUser)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  const ploId = String(formData.get("ploId") ?? "");
  if (!ploId) return { error: "PLO tidak sah." };

  try {
    await prisma.programmePlo.delete({ where: { id: ploId } });
  } catch (err) {
    console.error("removePloAction failed:", err);
    return {
      error:
        "Gagal membuang PLO. Ia mungkin masih dipetakan pada CLO kursus sedia ada.",
    };
  }

  revalidatePath("/admin/programmes");
  return {};
}

export type UpdatePloState = { error?: string; success?: boolean };

export async function updatePloAction(
  _prevState: UpdatePloState,
  formData: FormData
): Promise<UpdatePloState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }
  if (!canManageCatalog(currentUser)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  const ploId = String(formData.get("ploId") ?? "");
  const orderNumberRaw = String(formData.get("orderNumber") ?? "").trim();
  const textMs = String(formData.get("textMs") ?? "").trim();
  const textEn = String(formData.get("textEn") ?? "").trim();

  if (!ploId || !orderNumberRaw || !textMs) {
    return { error: "Nombor PLO dan teks (BM) wajib diisi." };
  }

  const orderNumber = Number(orderNumberRaw);
  if (!Number.isInteger(orderNumber) || orderNumber <= 0) {
    return { error: "Nombor PLO mesti nombor bulat positif." };
  }

  try {
    await prisma.programmePlo.update({
      where: { id: ploId },
      data: { orderNumber, textMs, textEn: textEn || null },
    });
  } catch (err) {
    if (isDuplicateCodeError(err)) {
      return { error: `PLO${orderNumber} sudah digunakan PLO lain dalam program ini.` };
    }
    console.error("updatePloAction failed:", err);
    return { error: "Gagal mengemaskini PLO. Sila cuba lagi." };
  }

  revalidatePath("/admin/programmes");
  return { success: true };
}
