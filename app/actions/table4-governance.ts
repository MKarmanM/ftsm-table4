"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { canManageDraft } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { validateControlledTable4Selections } from "@/lib/table4-master-data";

export type SaveGovernanceInfoState = { error?: string; success?: boolean };

const PERMISSION_DENIED = "Anda tidak mempunyai kebenaran untuk mengedit draf ini.";
const NOT_DRAFT = "Draf ini tidak lagi berstatus DRAFT — kandungan tidak boleh diedit.";

function splitLines(raw: string) {
  return raw
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function saveGovernanceInfoAction(
  _prevState: SaveGovernanceInfoState,
  formData: FormData
): Promise<SaveGovernanceInfoState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Sesi telah tamat. Sila log masuk semula." };

  const versionId = String(formData.get("versionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!versionId || !courseId) return { error: "Versi atau kursus tidak sah." };

  const version = await prisma.proformaVersion.findUnique({
    where: { id: versionId },
    select: {
      status: true,
      course: { select: { id: true, programmeId: true } },
    },
  });

  if (!version) return { error: "Versi tidak dijumpai." };
  if (!canManageDraft(currentUser, version.course)) return { error: PERMISSION_DENIED };
  if (version.status !== "DRAFT") return { error: NOT_DRAFT };

  const controlledSelections = {
    futureReadyElements: formData.getAll("futureReadyElements").map(String),
    excelFramework: formData.getAll("excelFramework").map(String),
    sdgTags: formData.getAll("sdgTags").map(String),
  };

  const controlledError = validateControlledTable4Selections(controlledSelections);
  if (controlledError) return { error: controlledError };

  try {
    await prisma.proformaVersion.update({
      where: { id: versionId },
      data: {
        transferableSkills: splitLines(String(formData.get("transferableSkills") ?? "")),
        specialRequirements: String(formData.get("specialRequirements") ?? "").trim() || null,
        referencesText: String(formData.get("referencesText") ?? "").trim() || null,
        ...controlledSelections,
        aiElement: formData.get("aiElement") === "on",
        isIndustrialTraining50Elt: formData.get("isIndustrialTraining50Elt") === "on",
        // Approval dates are intentionally omitted. They are workflow-owned
        // fields and can only be changed by APPROVE/PUBLISH transitions.
      },
    });
  } catch (error) {
    console.error("saveGovernanceInfoAction failed:", error);
    return { error: "Gagal menyimpan. Sila cuba lagi." };
  }

  revalidatePath(`/courses/${courseId}/versions/${versionId}`);
  return { success: true };
}
