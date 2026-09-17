import { prisma } from "./prisma";
import { computeSltSummary, normalizeHours } from "./table4-detail";

export type Table4ValidationIssue = {
  code: string;
  message: string;
};

export async function validateTable4ForSubmission(
  versionId: string
): Promise<Table4ValidationIssue[]> {
  const version = await prisma.proformaVersion.findUnique({
    where: { id: versionId },
    include: {
      course: { select: { creditHours: true } },
      clos: { include: { mappings: true } },
      topics: { include: { cloMappings: true } },
      assessments: true,
    },
  });

  if (!version) {
    return [{ code: "VERSION_NOT_FOUND", message: "Versi Table 4 tidak dijumpai." }];
  }

  const issues: Table4ValidationIssue[] = [];
  const requiredText = (value: string | null | undefined) => Boolean(value?.trim());

  if (!requiredText(version.synopsis)) {
    issues.push({ code: "SYNOPSIS_REQUIRED", message: "Sinopsis kursus wajib dilengkapkan." });
  }
  if (version.academicStaffNames.length === 0) {
    issues.push({ code: "STAFF_REQUIRED", message: "Sekurang-kurangnya seorang staf akademik perlu dinyatakan." });
  }
  if (!version.yearOffered || !version.semesterOffered) {
    issues.push({ code: "OFFERING_REQUIRED", message: "Tahun dan semester penawaran wajib dilengkapkan." });
  }
  if (!version.classification) {
    issues.push({ code: "CLASSIFICATION_REQUIRED", message: "Klasifikasi kursus wajib dipilih." });
  }
  if (version.clos.length === 0) {
    issues.push({ code: "CLO_REQUIRED", message: "Sekurang-kurangnya satu CLO diperlukan." });
  }

  for (const clo of version.clos) {
    const label = `CLO${clo.orderIndex}`;
    if (!requiredText(clo.text)) {
      issues.push({ code: "CLO_TEXT_REQUIRED", message: `${label}: teks CLO wajib diisi.` });
    }
    if (!requiredText(clo.teachingMethods)) {
      issues.push({ code: "CLO_TEACHING_REQUIRED", message: `${label}: kaedah penyampaian wajib diisi.` });
    }
    if (!requiredText(clo.assessmentMethods)) {
      issues.push({ code: "CLO_ASSESSMENT_REQUIRED", message: `${label}: kaedah penilaian wajib diisi.` });
    }
    if (!clo.taxonomyDomain || !clo.taxonomyLevel) {
      issues.push({ code: "CLO_TAXONOMY_REQUIRED", message: `${label}: domain dan aras taksonomi wajib dipilih.` });
    }
    if (clo.mappings.length === 0) {
      issues.push({ code: "CLO_PLO_REQUIRED", message: `${label}: mesti dipetakan kepada sekurang-kurangnya satu PLO.` });
    }
  }

  if (version.topics.length === 0) {
    issues.push({ code: "TOPIC_REQUIRED", message: "Sekurang-kurangnya satu topik/kandungan kursus diperlukan." });
  }
  for (const topic of version.topics) {
    if (topic.cloMappings.length === 0) {
      issues.push({
        code: "TOPIC_CLO_REQUIRED",
        message: `Topik ${topic.orderIndex}: mesti dipetakan kepada sekurang-kurangnya satu CLO.`,
      });
    }
  }

  if (version.assessments.length === 0) {
    issues.push({ code: "ASSESSMENT_REQUIRED", message: "Sekurang-kurangnya satu item penilaian diperlukan." });
  }

  const assessmentWeightage = version.assessments.reduce(
    (sum, item) => sum + Number(item.weightagePercent ?? 0),
    0
  );
  if (Math.abs(assessmentWeightage - 100) > 0.01) {
    issues.push({
      code: "ASSESSMENT_WEIGHTAGE_100",
      message: `Jumlah wajaran penilaian mesti 100%. Jumlah semasa: ${assessmentWeightage.toFixed(2)}%.`,
    });
  }

  const slt = computeSltSummary(
    version.topics.map((topic) => ({ hours: normalizeHours(topic.hours) })),
    version.assessments.map((item) => ({ hours: normalizeHours(item.hours) })),
    version.isIndustrialTraining50Elt
  );

  const expectedCredit = Number(version.course.creditHours);
  if (slt.grandTotal <= 0) {
    issues.push({ code: "SLT_REQUIRED", message: "Jumlah SLT mestilah lebih daripada 0 jam." });
  } else if (slt.suggestedCreditHours !== expectedCredit) {
    issues.push({
      code: "SLT_CREDIT_MISMATCH",
      message: `Jumlah SLT (${slt.grandTotal} jam) menghasilkan ${slt.suggestedCreditHours} kredit, tetapi kursus ditetapkan ${expectedCredit} kredit.`,
    });
  }

  if (!requiredText(version.referencesText)) {
    issues.push({ code: "REFERENCES_REQUIRED", message: "Rujukan kursus wajib dilengkapkan." });
  }

  return issues;
}

export function formatValidationIssues(issues: Table4ValidationIssue[]): string {
  if (issues.length === 0) return "";
  const preview = issues.slice(0, 5).map((issue) => `• ${issue.message}`).join("\n");
  const remaining = issues.length - 5;
  return remaining > 0
    ? `Table 4 belum lengkap:\n${preview}\n• dan ${remaining} isu lagi.`
    : `Table 4 belum lengkap:\n${preview}`;
}
