export const REVIEW_COMMENT_SECTIONS = [
  { value: "", label: "Umum / General" },
  { value: "basic.synopsis", label: "Maklumat Kursus — Sinopsis" },
  { value: "basic.staff", label: "Maklumat Kursus — Staf Akademik" },
  { value: "clo", label: "CLO / PLO" },
  { value: "slt", label: "SLT / Topik" },
  { value: "assessment.continuous", label: "Penilaian Berterusan" },
  { value: "assessment.final", label: "Penilaian Akhir" },
  { value: "other.references", label: "Maklumat Lain — Rujukan" },
  { value: "other", label: "Maklumat Lain" },
] as const;

export const REVIEW_COMMENT_SECTION_KEYS = new Set<string>(
  REVIEW_COMMENT_SECTIONS.map((section) => section.value).filter(Boolean)
);

export function getReviewCommentSectionLabel(value: string | null): string {
  if (!value) return "Umum";
  return (
    REVIEW_COMMENT_SECTIONS.find((section) => section.value === value)?.label ??
    value
  );
}
