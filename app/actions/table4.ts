"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { canManageDraft } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { validateTable4ControlledValues } from "@/lib/table4-master-data";
import {
  Prisma,
  CourseClassification,
  AssessmentPhase,
  TaxonomyDomain,
} from "@/lib/generated/prisma/client";

const PERMISSION_DENIED = "Anda tidak mempunyai kebenaran untuk mengedit draf ini.";
const NOT_DRAFT = "Draf ini tidak lagi berstatus DRAFT — kandungan tidak boleh diedit.";

async function assertEditable(versionId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Sesi telah tamat. Sila log masuk semula." };

  const version = await prisma.proformaVersion.findUnique({
    where: { id: versionId },
    select: { status: true, course: { select: { id: true, programmeId: true } } },
  });
  if (!version) return { error: "Versi tidak dijumpai." };
  if (!canManageDraft(currentUser, version.course)) return { error: PERMISSION_DENIED };
  if (version.status !== "DRAFT") return { error: NOT_DRAFT };

  return { currentUser, course: version.course };
}

function num(formData: FormData, name: string): number {
  return Number(formData.get(name) ?? 0) || 0;
}

function parseHours(formData: FormData, prefix: string) {
  return {
    f2fPhysical: {
      l: num(formData, `${prefix}PhysicalL`),
      t: num(formData, `${prefix}PhysicalT`),
      p: num(formData, `${prefix}PhysicalP`),
      o: num(formData, `${prefix}PhysicalO`),
    },
    f2fOnline: {
      l: num(formData, `${prefix}OnlineL`),
      t: num(formData, `${prefix}OnlineT`),
      p: num(formData, `${prefix}OnlineP`),
      o: num(formData, `${prefix}OnlineO`),
    },
    independent: num(formData, `${prefix}Independent`),
  };
}

// Assessment items only have a single Physical and single Online total
// each (the official template merges those cells into one) — unlike
// weekly topics, which have genuine separate L/T/P/O columns. The
// single value is stored in the "l" slot so it still sums correctly
// wherever the shared HoursBreakdown shape is totalled.
function parseAssessmentHours(formData: FormData) {
  return {
    f2fPhysical: { l: num(formData, "assessmentPhysical"), t: 0, p: 0, o: 0 },
    f2fOnline: { l: num(formData, "assessmentOnline"), t: 0, p: 0, o: 0 },
    independent: num(formData, "assessmentIndependent"),
  };
}

function revalidateVersion(courseId: string, versionId: string) {
  revalidatePath(`/courses/${courseId}/versions/${versionId}`);
}

async function withSerializableRetry<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || error.code === "P2002");
      if (!retryable || attempt === 3) throw error;
    }
  }
  throw new Error("Transaksi tidak dapat diselesaikan.");
}

function validWeightage(raw: string): number | null {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : NaN;
}

function parseTaxonomy(formData: FormData) {
  const domainRaw = String(formData.get("taxonomyDomain") ?? "");
  const levelRaw = String(formData.get("taxonomyLevel") ?? "");

  if (domainRaw && !Object.values(TaxonomyDomain).includes(domainRaw as TaxonomyDomain)) {
    return { error: "Domain taksonomi tidak sah." } as const;
  }

  const taxonomyLevel = levelRaw ? Number(levelRaw) : null;
  if (
    taxonomyLevel !== null &&
    (!Number.isInteger(taxonomyLevel) || taxonomyLevel < 1 || taxonomyLevel > 6)
  ) {
    return { error: "Tahap taksonomi mesti nombor bulat antara 1 hingga 6." } as const;
  }

  return {
    taxonomyDomain: domainRaw ? (domainRaw as TaxonomyDomain) : null,
    taxonomyLevel,
  } as const;
}

// ---- Basic info (synopsis, staff, classification, etc.) ---------------

export type SaveBasicInfoState = { error?: string; success?: boolean };

export async function saveBasicInfoAction(
  _prevState: SaveBasicInfoState,
  formData: FormData
): Promise<SaveBasicInfoState> {
  const versionId = String(formData.get("versionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const check = await assertEditable(versionId);
  if ("error" in check) return { error: check.error };

  const splitLines = (raw: string) =>
    raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  // Combine the two-part bilingual box (Bahasa Malaysia + ENG) into the
  // single stored string, joined by a newline.
  const combineBilingual = (bmName: string, enName: string) => {
    const bm = String(formData.get(bmName) ?? "").trim();
    const en = String(formData.get(enName) ?? "").trim();
    if (bm && en) return `${bm}\n${en}`;
    return bm || en || null;
  };

  // This action is submitted from two separate, independent forms on the
  // page. `formPart` ensures a save only touches fields rendered by that form.
  const formPart = String(formData.get("formPart") ?? "");

  const optionalInteger = (name: string) => {
    const raw = String(formData.get(name) ?? "").trim();
    if (!raw) return null;
    const value = Number(raw);
    return Number.isInteger(value) && value > 0 ? value : NaN;
  };
  const yearOffered = optionalInteger("yearOffered");
  const semesterOffered = optionalInteger("semesterOffered");
  if (
    formPart !== "2" &&
    (Number.isNaN(yearOffered) || Number.isNaN(semesterOffered))
  ) {
    return { error: "Tahun dan semester mesti nombor bulat positif." };
  }

  const classificationRaw = String(formData.get("classification") ?? "");
  if (
    formPart !== "2" &&
    classificationRaw &&
    !Object.values(CourseClassification).includes(classificationRaw as CourseClassification)
  ) {
    return { error: "Klasifikasi kursus tidak sah." };
  }

  const dataPart1 = {
    synopsis: combineBilingual("synopsisBm", "synopsisEn"),
    academicStaffNames: splitLines(String(formData.get("academicStaffNames") ?? "")),
    yearOffered,
    semesterOffered,
    offeringRemarks: String(formData.get("offeringRemarks") ?? "") || null,
    prerequisite: String(formData.get("prerequisite") ?? "") || null,
    classification: classificationRaw
      ? (classificationRaw as CourseClassification)
      : null,
    classificationDomain: String(formData.get("classificationDomain") ?? "") || null,
  };

  const futureReadyElements = formData.getAll("futureReadyElements").map(String);
  const excelFramework = formData.getAll("excelFramework").map(String);
  const sdgTags = formData.getAll("sdgTags").map(String);

  if (formPart === "2") {
    const controlledValueError = validateTable4ControlledValues({
      futureReadyElements,
      excelFramework,
      sdgTags,
    });
    if (controlledValueError) return { error: controlledValueError };
  }

  const dataPart2 = {
    transferableSkills: splitLines(String(formData.get("transferableSkills") ?? "")),
    specialRequirements: String(formData.get("specialRequirements") ?? "") || null,
    referencesText: String(formData.get("referencesText") ?? "") || null,
    futureReadyElements,
    excelFramework,
    sdgTags,
    aiElement: formData.get("aiElement") === "on",
    isIndustrialTraining50Elt: formData.get("isIndustrialTraining50Elt") === "on",
    // Approval dates intentionally omitted: they are workflow-owned fields
    // set only by APPROVE/PUBLISH transitions in lib/proforma-workflow.ts.
  };

  try {
    await prisma.proformaVersion.update({
      where: { id: versionId },
      data: formPart === "2" ? dataPart2 : dataPart1,
    });
  } catch (err) {
    console.error("saveBasicInfoAction failed:", err);
    return { error: "Gagal menyimpan. Sila cuba lagi." };
  }

  revalidateVersion(courseId, versionId);
  return { success: true };
}

// ---- CLOs ---------------------------------------------------------------

export type CloFormState = { error?: string };

export async function addCloAction(
  _prevState: CloFormState,
  formData: FormData
): Promise<CloFormState> {
  const versionId = String(formData.get("versionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const check = await assertEditable(versionId);
  if ("error" in check) return { error: check.error };

  const textBm = String(formData.get("textBm") ?? "").trim();
  const textEn = String(formData.get("textEn") ?? "").trim();
  if (!textBm) return { error: "Teks CLO (Bahasa Malaysia) wajib diisi." };
  const text = textEn ? `${textBm}\n${textEn}` : textBm;

  const taxonomy = parseTaxonomy(formData);
  if ("error" in taxonomy) return { error: taxonomy.error };

  try {
    await withSerializableRetry(async (tx) => {
      const count = await tx.courseLearningOutcome.count({ where: { versionId } });
      await tx.courseLearningOutcome.create({
        data: {
          versionId,
          orderIndex: count + 1,
          text,
          teachingMethods: String(formData.get("teachingMethods") ?? "") || null,
          assessmentMethods: String(formData.get("assessmentMethods") ?? "") || null,
          taxonomyDomain: taxonomy.taxonomyDomain,
          taxonomyLevel: taxonomy.taxonomyLevel,
        },
      });
    });
  } catch (error) {
    console.error("addCloAction failed:", error);
    return { error: "Gagal menambah CLO. Sila cuba lagi." };
  }

  revalidateVersion(courseId, versionId);
  return {};
}

export async function removeCloAction(
  _prevState: CloFormState,
  formData: FormData
): Promise<CloFormState> {
  const versionId = String(formData.get("versionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const cloId = String(formData.get("cloId") ?? "");
  const check = await assertEditable(versionId);
  if ("error" in check) return { error: check.error };

  const result = await prisma.courseLearningOutcome.deleteMany({
    where: { id: cloId, versionId },
  });
  if (result.count === 0) return { error: "CLO tidak sah untuk versi ini." };

  revalidateVersion(courseId, versionId);
  return {};
}

export async function updateCloAction(
  _prevState: CloFormState,
  formData: FormData
): Promise<CloFormState> {
  const versionId = String(formData.get("versionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const cloId = String(formData.get("cloId") ?? "");
  const check = await assertEditable(versionId);
  if ("error" in check) return { error: check.error };

  const textBm = String(formData.get("textBm") ?? "").trim();
  const textEn = String(formData.get("textEn") ?? "").trim();
  if (!textBm) return { error: "Teks CLO (Bahasa Malaysia) wajib diisi." };
  const text = textEn ? `${textBm}\n${textEn}` : textBm;

  const taxonomy = parseTaxonomy(formData);
  if ("error" in taxonomy) return { error: taxonomy.error };

  const result = await prisma.courseLearningOutcome.updateMany({
    where: { id: cloId, versionId },
    data: {
      text,
      teachingMethods: String(formData.get("teachingMethods") ?? "") || null,
      assessmentMethods: String(formData.get("assessmentMethods") ?? "") || null,
      taxonomyDomain: taxonomy.taxonomyDomain,
      taxonomyLevel: taxonomy.taxonomyLevel,
    },
  });
  if (result.count === 0) return { error: "CLO tidak sah untuk versi ini." };

  revalidateVersion(courseId, versionId);
  return {};
}

export async function toggleCloPloMappingAction(
  _prevState: CloFormState,
  formData: FormData
): Promise<CloFormState> {
  const versionId = String(formData.get("versionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const cloId = String(formData.get("cloId") ?? "");
  const programmePloId = String(formData.get("programmePloId") ?? "");
  const check = await assertEditable(versionId);
  if ("error" in check) return { error: check.error };

  const [clo, programmePlo] = await Promise.all([
    prisma.courseLearningOutcome.findFirst({ where: { id: cloId, versionId } }),
    prisma.programmePlo.findFirst({
      where: { id: programmePloId, programmeId: check.course.programmeId },
    }),
  ]);
  if (!clo || !programmePlo) {
    return { error: "Pemetaan CLO–PLO tidak sah untuk versi ini." };
  }

  const existing = await prisma.cloPloMapping.findUnique({
    where: { cloId_programmePloId: { cloId, programmePloId } },
  });

  if (existing) {
    await prisma.cloPloMapping.delete({ where: { id: existing.id } });
  } else {
    await prisma.cloPloMapping.create({ data: { cloId, programmePloId } });
  }

  revalidateVersion(courseId, versionId);
  return {};
}

// ---- Topics (SLT) ---------------------------------------------------------

export type TopicFormState = { error?: string };

export async function addTopicAction(
  _prevState: TopicFormState,
  formData: FormData
): Promise<TopicFormState> {
  const versionId = String(formData.get("versionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const check = await assertEditable(versionId);
  if ("error" in check) return { error: check.error };

  const topicMs = String(formData.get("topicMs") ?? "").trim();
  if (!topicMs) return { error: "Nama topik (BM) wajib diisi." };

  try {
    await withSerializableRetry(async (tx) => {
      const count = await tx.courseTopic.count({ where: { versionId } });
      await tx.courseTopic.create({
        data: {
          versionId,
          orderIndex: count + 1,
          topicMs,
          topicEn: String(formData.get("topicEn") ?? "") || null,
          cloRef: String(formData.get("cloRef") ?? "") || null,
          hours: parseHours(formData, "topic"),
        },
      });
    });
  } catch (error) {
    console.error("addTopicAction failed:", error);
    return { error: "Gagal menambah topik. Sila cuba lagi." };
  }

  revalidateVersion(courseId, versionId);
  return {};
}

export async function removeTopicAction(
  _prevState: TopicFormState,
  formData: FormData
): Promise<TopicFormState> {
  const versionId = String(formData.get("versionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const topicId = String(formData.get("topicId") ?? "");
  const check = await assertEditable(versionId);
  if ("error" in check) return { error: check.error };

  const result = await prisma.courseTopic.deleteMany({
    where: { id: topicId, versionId },
  });
  if (result.count === 0) return { error: "Topik tidak sah untuk versi ini." };

  revalidateVersion(courseId, versionId);
  return {};
}

export async function updateTopicAction(
  _prevState: TopicFormState,
  formData: FormData
): Promise<TopicFormState> {
  const versionId = String(formData.get("versionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const topicId = String(formData.get("topicId") ?? "");
  const check = await assertEditable(versionId);
  if ("error" in check) return { error: check.error };

  const topicMs = String(formData.get("topicMs") ?? "").trim();
  if (!topicMs) return { error: "Nama topik (BM) wajib diisi." };

  const result = await prisma.courseTopic.updateMany({
    where: { id: topicId, versionId },
    data: {
      topicMs,
      topicEn: String(formData.get("topicEn") ?? "") || null,
      cloRef: String(formData.get("cloRef") ?? "") || null,
      hours: parseHours(formData, "topic"),
    },
  });
  if (result.count === 0) return { error: "Topik tidak sah untuk versi ini." };

  revalidateVersion(courseId, versionId);
  return {};
}

// ---- Assessment items -----------------------------------------------------

export type AssessmentFormState = { error?: string };

export async function addAssessmentAction(
  _prevState: AssessmentFormState,
  formData: FormData
): Promise<AssessmentFormState> {
  const versionId = String(formData.get("versionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const check = await assertEditable(versionId);
  if ("error" in check) return { error: check.error };

  const nameMs = String(formData.get("nameMs") ?? "").trim();
  if (!nameMs) return { error: "Nama penilaian (BM) wajib diisi." };

  const phaseRaw = String(formData.get("phase") ?? "CONTINUOUS");
  if (!Object.values(AssessmentPhase).includes(phaseRaw as AssessmentPhase)) {
    return { error: "Fasa penilaian tidak sah." };
  }
  const phase = phaseRaw as AssessmentPhase;
  const weightageRaw = String(formData.get("weightagePercent") ?? "").trim();
  const weightagePercent = validWeightage(weightageRaw);
  if (Number.isNaN(weightagePercent)) {
    return { error: "Wajaran mesti nombor antara 0 hingga 100." };
  }

  try {
    await withSerializableRetry(async (tx) => {
      const count = await tx.assessmentItem.count({ where: { versionId, phase } });
      await tx.assessmentItem.create({
        data: {
          versionId,
          phase,
          orderIndex: count + 1,
          nameMs,
          nameEn: String(formData.get("nameEn") ?? "") || null,
          weightagePercent,
          hours: parseAssessmentHours(formData),
        },
      });
    });
  } catch (error) {
    console.error("addAssessmentAction failed:", error);
    return { error: "Gagal menambah item penilaian. Sila cuba lagi." };
  }

  revalidateVersion(courseId, versionId);
  return {};
}

export async function removeAssessmentAction(
  _prevState: AssessmentFormState,
  formData: FormData
): Promise<AssessmentFormState> {
  const versionId = String(formData.get("versionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const check = await assertEditable(versionId);
  if ("error" in check) return { error: check.error };

  const result = await prisma.assessmentItem.deleteMany({
    where: { id: assessmentId, versionId },
  });
  if (result.count === 0) {
    return { error: "Item penilaian tidak sah untuk versi ini." };
  }

  revalidateVersion(courseId, versionId);
  return {};
}

export async function updateAssessmentAction(
  _prevState: AssessmentFormState,
  formData: FormData
): Promise<AssessmentFormState> {
  const versionId = String(formData.get("versionId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const check = await assertEditable(versionId);
  if ("error" in check) return { error: check.error };

  const nameMs = String(formData.get("nameMs") ?? "").trim();
  if (!nameMs) return { error: "Nama penilaian (BM) wajib diisi." };

  const weightageRaw = String(formData.get("weightagePercent") ?? "").trim();
  const weightagePercent = validWeightage(weightageRaw);
  if (Number.isNaN(weightagePercent)) {
    return { error: "Wajaran mesti nombor antara 0 hingga 100." };
  }

  try {
    const result = await prisma.assessmentItem.updateMany({
      where: { id: assessmentId, versionId },
      data: {
        nameMs,
        nameEn: String(formData.get("nameEn") ?? "") || null,
        weightagePercent,
        hours: parseAssessmentHours(formData),
      },
    });
    if (result.count === 0) {
      return { error: "Item penilaian tidak sah untuk versi ini." };
    }
  } catch (error) {
    console.error("updateAssessmentAction failed:", error);
    return { error: "Gagal mengemaskini item penilaian. Sila cuba lagi." };
  }

  revalidateVersion(courseId, versionId);
  return {};
}
