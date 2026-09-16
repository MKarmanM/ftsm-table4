"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createDraftVersion } from "@/lib/proforma-version";
import { applyReviewAction } from "@/lib/proforma-workflow";
import { canManageDraft, canViewDraft, isActionPermitted } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Prisma, ReviewActionType } from "@/lib/generated/prisma/client";

const PERMISSION_DENIED_MESSAGE =
  "Anda tidak mempunyai kebenaran untuk tindakan ini.";

export type CreateDraftState = { error?: string };

export async function createDraftAction(
  _prevState: CreateDraftState,
  formData: FormData
): Promise<CreateDraftState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }

  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) {
    return { error: "Kursus tidak sah." };
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, programmeId: true },
  });
  if (!course) {
    return { error: "Kursus tidak dijumpai." };
  }

  if (!canManageDraft(currentUser, course)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  try {
    await createDraftVersion({
      courseId,
      createdById: currentUser.id,
      payload: {},
    });
  } catch (err) {
    console.error("createDraftAction failed:", err);
    return {
      error:
        "Gagal mencipta draf. Sila cuba lagi, atau hubungi Pegawai Akademik jika berterusan.",
    };
  }

  revalidatePath("/");
  return {};
}

export type SavePayloadState = { error?: string; success?: boolean };

export async function savePayloadAction(
  _prevState: SavePayloadState,
  formData: FormData
): Promise<SavePayloadState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }

  const versionId = String(formData.get("versionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const payloadRaw = String(formData.get("payload") ?? "");

  if (!versionId) {
    return { error: "Versi tidak sah." };
  }

  const version = await prisma.proformaVersion.findUnique({
    where: { id: versionId },
    select: {
      status: true,
      course: { select: { id: true, programmeId: true } },
    },
  });
  if (!version) {
    return { error: "Versi tidak dijumpai." };
  }

  if (!canManageDraft(currentUser, version.course)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  if (version.status !== "DRAFT") {
    return {
      error:
        "Draf ini tidak lagi berstatus DRAFT — kandungan tidak boleh diedit.",
    };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    return { error: "Format JSON tidak sah. Sila semak semula sebelum simpan." };
  }

  try {
    await prisma.$transaction([
      prisma.proformaVersion.update({
        where: { id: versionId },
        data: { payload: payload as Prisma.InputJsonValue },
      }),
      prisma.auditEvent.create({
        data: {
          actorId: currentUser.id,
          versionId,
          action: "UPDATE_PAYLOAD",
          entityType: "ProformaVersion",
          entityId: versionId,
        },
      }),
    ]);
  } catch (err) {
    console.error("savePayloadAction failed:", err);
    return { error: "Gagal menyimpan. Sila cuba lagi." };
  }

  revalidatePath(`/courses/${courseId}/versions/${versionId}`);
  return { success: true };
}

export type ReviewActionFormState = { error?: string };

export async function reviewActionFormAction(
  _prevState: ReviewActionFormState,
  formData: FormData
): Promise<ReviewActionFormState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }

  const versionId = String(formData.get("versionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const type = String(formData.get("type") ?? "") as ReviewActionType;
  const noteRaw = String(formData.get("note") ?? "").trim();

  if (!versionId || !type) {
    return { error: "Data tidak lengkap." };
  }

  const version = await prisma.proformaVersion.findUnique({
    where: { id: versionId },
    select: {
      course: { select: { id: true, programmeId: true } },
    },
  });
  if (!version) {
    return { error: "Versi tidak dijumpai." };
  }

  if (!isActionPermitted(currentUser, type, version.course)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  try {
    await applyReviewAction({
      versionId,
      actorId: currentUser.id,
      type,
      note: noteRaw || undefined,
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Tindakan gagal.",
    };
  }

  revalidatePath(`/courses/${courseId}/versions/${versionId}`);
  revalidatePath("/");
  return {};
}

export type CreateCommentState = { error?: string };

export async function createCommentAction(
  _prevState: CreateCommentState,
  formData: FormData
): Promise<CreateCommentState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi telah tamat. Sila log masuk semula." };
  }

  const versionId = String(formData.get("versionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const sectionKey = String(formData.get("sectionKey") ?? "").trim();

  if (!versionId || !body) {
    return { error: "Komen tidak boleh kosong." };
  }
  if (body.length > 2000) {
    return { error: "Komen terlalu panjang (maksimum 2000 aksara)." };
  }

  const version = await prisma.proformaVersion.findUnique({
    where: { id: versionId },
    select: { course: { select: { id: true, programmeId: true } } },
  });
  if (!version || !canViewDraft(currentUser, version.course)) {
    return { error: PERMISSION_DENIED_MESSAGE };
  }

  try {
    await prisma.reviewComment.create({
      data: {
        versionId,
        authorId: currentUser.id,
        body,
        sectionKey: sectionKey || null,
      },
    });
  } catch (err) {
    console.error("createCommentAction failed:", err);
    return { error: "Gagal menghantar komen. Sila cuba lagi." };
  }

  revalidatePath(`/courses/${courseId}/versions/${versionId}`);
  return {};
}
