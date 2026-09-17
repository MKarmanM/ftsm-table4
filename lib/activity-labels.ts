const REVIEW_ACTION_LABELS: Record<string, string> = {
  SUBMIT: "Hantar untuk semakan",
  REQUEST_CHANGES: "Minta pindaan",
  APPROVE: "Lulus di peringkat fakulti",
  PUBLISH: "Terbit / kelulusan Senat",
  ARCHIVE: "Arkibkan versi",
  REOPEN_DRAFT: "Buka semula sebagai draf",
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  SUBMIT: "Draf dihantar untuk semakan",
  REQUEST_CHANGES: "Pindaan diminta",
  APPROVE: "Versi diluluskan",
  PUBLISH: "Versi diterbitkan",
  ARCHIVE: "Versi diarkibkan",
  REOPEN_DRAFT: "Versi dibuka semula",
  AUTO_SUPERSEDE: "Versi terdahulu diganti secara automatik",
  UPDATE_PAYLOAD: "Kandungan dikemas kini",
};

export function reviewActionLabel(action: string) {
  return REVIEW_ACTION_LABELS[action] ?? action.replaceAll("_", " ");
}

export function auditActionLabel(action: string) {
  return AUDIT_ACTION_LABELS[action] ?? action.replaceAll("_", " ");
}
