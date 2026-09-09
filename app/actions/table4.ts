"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { canManageDraft } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CourseClassification, AssessmentPhase, TaxonomyDomain } from "@/lib/generated/prisma/client";

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

  const dataPart1 = {
    synopsis: combineBilingual("synopsisBm", "synopsisEn"),
    academicStaffNames: splitLines(String(formData.get("academicStaffNames") ?? "")),
    yearOffered: formData.get("yearOffered") ? Number(formData.get("yearOffered")) : null,
    semesterOffered: formData.get("semesterOffered")
      ? Number(formData.get("semesterOffered"))
      : null,
    offeringRemarks: String(formData.get("offeringRemarks") ?? "") || null,
    prerequisite: String(formData.get("prerequisite") ?? "") || null,
    classification: formData.get("classification")
      ? (String(formData.get("classification")) as CourseClassification)
      : null,
    classificationDomain: String(formData.get("classificationDomain") ?? "") || null,
  };

  const dataPart2 = {
    transferableSkills: splitLines(String(formData.get("transferableSkills") ?? "")),
    specialRequirements: String(formData.get("specialRequirements") ?? "") || null,
    referencesText: String(formData.get("referencesText") ?? "") || null,
    // Checkbox groups — multiple values can share the same field name.
    futureReadyElements: formData.getAll("futureReadyElements").map(String),
    excelFramework: formData.getAll("excelFramework").map(String),
    sdgTags: formData.getAll("sdgTags").map(String),
    aiElement: formData.get("aiElement") === "on",
    isIndustrialTraining50Elt: formData.get("isIndustrialTraining50Elt") === "on",
    facultyApprovalDate: formData.get("facultyApprovalDate")
      ? new Date(String(formData.get("facultyApprovalDate")))
      : null,
    senateApprovalDate: formData.get("senateApprovalDate")
      ? new Date(String(formData.get("senateApprovalDate")))
      : null,
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

  const taxonomyDomainRaw = String(formData.get("taxonomyDomain") ?? "");
  const taxonomyLevelRaw = String(formData.get("taxonomyLevel") ?? "");
  const taxonomyDomain = taxonomyDomainRaw ? (taxonomyDomainRaw as TaxonomyDomain) : null;
  const taxonomyLevel = taxonomyLevelRaw ? Number(taxonomyLevelRaw) : null;

  const count = await prisma.courseLearningOutcome.count({ where: { versionId } });

  await prisma.courseLearningOutcome.create({
    data: {
      versionId,
      orderIndex: count + 1,
      text,
      teachingMethods: String(formData.get("teachingMethods") ?? "") || null,
      assessmentMethods: String(formData.get("assessmentMethods") ?? "") || null,
      taxonomyDomain,
      taxonomyLevel,
    },
  });

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

  await prisma.courseLearningOutcome.delete({ where: { id: cloId } });

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

  const taxonomyDomainRaw = String(formData.get("taxonomyDomain") ?? "");
  const taxonomyLevelRaw = String(formData.get("taxonomyLevel") ?? "");
  const taxonomyDomain = taxonomyDomainRaw ? (taxonomyDomainRaw as TaxonomyDomain) : null;
  const taxonomyLevel = taxonomyLevelRaw ? Number(taxonomyLevelRaw) : null;

  await prisma.courseLearningOutcome.update({
    where: { id: cloId },
    data: {
      text,
      teachingMethods: String(formData.get("teachingMethods") ?? "") || null,
      assessmentMethods: String(formData.get("assessmentMethods") ?? "") || null,
      taxonomyDomain,
      taxonomyLevel,
    },
  });

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

  const count = await prisma.courseTopic.count({ where: { versionId } });

  await prisma.courseTopic.create({
    data: {
      versionId,
      orderIndex: count + 1,
      topicMs,
      topicEn: String(formData.get("topicEn") ?? "") || null,
      cloRef: String(formData.get("cloRef") ?? "") || null,
      hours: parseHours(formData, "topic"),
    },
  });

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

  await prisma.courseTopic.delete({ where: { id: topicId } });

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

  await prisma.courseTopic.update({
    where: { id: topicId },
    data: {
      topicMs,
      topicEn: String(formData.get("topicEn") ?? "") || null,
      cloRef: String(formData.get("cloRef") ?? "") || null,
      hours: parseHours(formData, "topic"),
    },
  });

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

  const phase = String(formData.get("phase") ?? "CONTINUOUS") as AssessmentPhase;
  const weightageRaw = String(formData.get("weightagePercent") ?? "").trim();

  const count = await prisma.assessmentItem.count({ where: { versionId, phase } });

  await prisma.assessmentItem.create({
    data: {
      versionId,
      phase,
      orderIndex: count + 1,
      nameMs,
      nameEn: String(formData.get("nameEn") ?? "") || null,
      weightagePercent: weightageRaw ? weightageRaw : null,
      hours: parseAssessmentHours(formData),
    },
  });

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

  await prisma.assessmentItem.delete({ where: { id: assessmentId } });

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

  await prisma.assessmentItem.update({
    where: { id: assessmentId },
    data: {
      nameMs,
      nameEn: String(formData.get("nameEn") ?? "") || null,
      weightagePercent: weightageRaw ? weightageRaw : null,
      hours: parseAssessmentHours(formData),
    },
  });

  revalidateVersion(courseId, versionId);
  return {};
}
