"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { canManageDraft } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { validateControlledMappings } from "@/lib/table4-master-data";
import { validateCloGuidanceSelection } from "@/lib/plo-clo-master-data";
import type { TaxonomyDomainKey } from "@/lib/taxonomy-data";
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
  // page (matching where each item falls in the official Table 4 item
  // order — items 1–6 appear before the CLO section, items 9 & 11–15
  // appear after SLT/assessments). `formPart` tells us which one fired,
  // so we only touch the fields that form actually contains — otherwise
  // submitting Part 1 would silently wipe out Part 2's fields (and vice
  // versa), since a missing field in FormData is indistinguishable from
  // "user cleared this field".
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

  const dataPart1 = {
    synopsis: combineBilingual("synopsisBm", "synopsisEn"),
    academicStaffNames: splitLines(String(formData.get("academicStaffNames") ?? "")),
    yearOffered,
    semesterOffered,
    offeringRemarks: String(formData.get("offeringRemarks") ?? "") || null,
    prerequisite: String(formData.get("prerequisite") ?? "") || null,
    classification: formData.get("classification")
      ? (String(formData.get("classification")) as CourseClassification)
      : null,
    classificationDomain: String(formData.get("classificationDomain") ?? "") || null,
  };

  let dataPart2: {
    transferableSkills: string[];
    specialRequirements: string | null;
    referencesText: string | null;
    futureReadyElements: string[];
    excelFramework: string[];
    sdgTags: string[];
    aiElement: boolean;
    isIndustrialTraining50Elt: boolean;
  } | null = null;

  if (formPart === "2") {
    const mappingValidation = validateControlledMappings({
      futureReadyElements: formData.getAll("futureReadyElements").map(String),
      excelFramework: formData.getAll("excelFramework").map(String),
      sdgTags: formData.getAll("sdgTags").map(String),
    });
    if (!mappingValidation.ok) {
      return { error: mappingValidation.error };
    }

    dataPart2 = {
      transferableSkills: splitLines(String(formData.get("transferableSkills") ?? "")),
      specialRequirements: String(formData.get("specialRequirements") ?? "") || null,
      referencesText: String(formData.get("referencesText") ?? "") || null,
      ...mappingValidation.value,
      aiElement: String(formData.get("aiElement") ?? "false") === "true",
      isIndustrialTraining50Elt: formData.get("isIndustrialTraining50Elt") === "on",
    };
  }

  try {
    await prisma.proformaVersion.update({
      where: { id: versionId },
      // Approval dates are intentionally excluded here. They are governance
      // fields and can only be stamped by APPROVE/PUBLISH workflow actions.
      data: formPart === "2" ? dataPart2! : dataPart1,
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

function selectedProgrammePloIds(formData: FormData): string[] {
  return [
    ...new Set(
      formData
        .getAll("programmePloIds")
        .map(String)
        .map((value) => value.trim())
        .filter(Boolean)
    ),
  ];
}

async function validateGuidedCloInput(
  formData: FormData,
  programmeId: string
): Promise<
  | {
      ok: true;
      value: {
        programmePloIds: string[];
        taxonomyDomain: TaxonomyDomain;
        taxonomyLevel: number;
        teachingMethods: string;
        assessmentMethods: string;
      };
    }
  | { ok: false; error: string }
> {
  const programmePloIds = selectedProgrammePloIds(formData);
  if (programmePloIds.length !== 1) {
    return { ok: false, error: "Pilih satu PLO sahaja untuk setiap CLO." };
  }

  const selectedPlos = await prisma.programmePlo.findMany({
    where: {
      id: { in: programmePloIds },
      programmeId,
    },
    select: { id: true, orderNumber: true },
  });

  if (selectedPlos.length !== programmePloIds.length) {
    return { ok: false, error: "PLO yang dipilih tidak sah untuk program ini." };
  }

  const taxonomyDomainRaw = String(formData.get("taxonomyDomain") ?? "");
  const taxonomyLevelRaw = String(formData.get("taxonomyLevel") ?? "");
  const teachingMethods = String(formData.get("teachingMethods") ?? "").trim();
  const assessmentMethods = String(formData.get("assessmentMethods") ?? "").trim();
  const taxonomyLevel = taxonomyLevelRaw ? Number(taxonomyLevelRaw) : null;

  const validation = validateCloGuidanceSelection({
    ploNumbers: selectedPlos.map((plo) => plo.orderNumber),
    taxonomyDomain: taxonomyDomainRaw
      ? (taxonomyDomainRaw as TaxonomyDomainKey)
      : null,
    taxonomyLevel:
      taxonomyLevel !== null && Number.isInteger(taxonomyLevel)
        ? taxonomyLevel
        : null,
    teachingMethod: teachingMethods || null,
    assessmentMethod: assessmentMethods || null,
  });

  if (!validation.ok) return validation;

  return {
    ok: true,
    value: {
      programmePloIds,
      taxonomyDomain: taxonomyDomainRaw as TaxonomyDomain,
      taxonomyLevel: taxonomyLevel as number,
      teachingMethods,
      assessmentMethods,
    },
  };
}

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

  const guided = await validateGuidedCloInput(
    formData,
    check.course.programmeId
  );
  if (!guided.ok) return { error: guided.error };

  try {
    await withSerializableRetry(async (tx) => {
      const count = await tx.courseLearningOutcome.count({ where: { versionId } });
      const clo = await tx.courseLearningOutcome.create({
        data: {
          versionId,
          orderIndex: count + 1,
          text,
          teachingMethods: guided.value.teachingMethods,
          assessmentMethods: guided.value.assessmentMethods,
          taxonomyDomain: guided.value.taxonomyDomain,
          taxonomyLevel: guided.value.taxonomyLevel,
        },
      });

      await tx.cloPloMapping.createMany({
        data: guided.value.programmePloIds.map((programmePloId) => ({
          cloId: clo.id,
          programmePloId,
        })),
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

  const existingClo = await prisma.courseLearningOutcome.findFirst({
    where: { id: cloId, versionId },
    select: { id: true },
  });
  if (!existingClo) return { error: "CLO tidak sah untuk versi ini." };

  const textBm = String(formData.get("textBm") ?? "").trim();
  const textEn = String(formData.get("textEn") ?? "").trim();
  if (!textBm) return { error: "Teks CLO (Bahasa Malaysia) wajib diisi." };
  const text = textEn ? `${textBm}\n${textEn}` : textBm;

  const guided = await validateGuidedCloInput(
    formData,
    check.course.programmeId
  );
  if (!guided.ok) return { error: guided.error };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.courseLearningOutcome.update({
        where: { id: cloId },
        data: {
          text,
          teachingMethods: guided.value.teachingMethods,
          assessmentMethods: guided.value.assessmentMethods,
          taxonomyDomain: guided.value.taxonomyDomain,
          taxonomyLevel: guided.value.taxonomyLevel,
        },
      });

      await tx.cloPloMapping.deleteMany({ where: { cloId } });
      await tx.cloPloMapping.createMany({
        data: guided.value.programmePloIds.map((programmePloId) => ({
          cloId,
          programmePloId,
        })),
      });
    });
  } catch (error) {
    console.error("updateCloAction failed:", error);
    return { error: "Gagal mengemaskini CLO. Sila cuba lagi." };
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
