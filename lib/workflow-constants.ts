import {
  ProformaStatus,
  type ReviewActionType,
} from "./generated/prisma/enums";

// Pure data only — deliberately does NOT import "./prisma" or anything
// that pulls in the pg driver. This file gets imported by Client
// Components (review-action-buttons.tsx), and Client Components can't
// bundle Node-only packages like `pg` (which needs `fs`). Server-only
// logic that actually touches the database lives in proforma-workflow.ts.

export const VALID_TRANSITIONS: Record<ProformaStatus, ProformaStatus[]> = {
  [ProformaStatus.DRAFT]: [ProformaStatus.SUBMITTED],
  [ProformaStatus.SUBMITTED]: [
    ProformaStatus.CHANGES_REQUESTED,
    ProformaStatus.APPROVED,
  ],
  [ProformaStatus.CHANGES_REQUESTED]: [
    ProformaStatus.DRAFT,
    ProformaStatus.SUBMITTED,
  ],
  [ProformaStatus.APPROVED]: [
    ProformaStatus.PUBLISHED,
    ProformaStatus.CHANGES_REQUESTED,
  ],
  [ProformaStatus.PUBLISHED]: [
    ProformaStatus.SUPERSEDED,
    ProformaStatus.ARCHIVED,
  ],
  [ProformaStatus.SUPERSEDED]: [ProformaStatus.ARCHIVED],
  [ProformaStatus.ARCHIVED]: [],
};

export const ACTION_TO_STATUS: Record<ReviewActionType, ProformaStatus> = {
  SUBMIT: ProformaStatus.SUBMITTED,
  REQUEST_CHANGES: ProformaStatus.CHANGES_REQUESTED,
  APPROVE: ProformaStatus.APPROVED,
  PUBLISH: ProformaStatus.PUBLISHED,
  ARCHIVE: ProformaStatus.ARCHIVED,
  REOPEN_DRAFT: ProformaStatus.DRAFT,
};

export const ACTION_LABEL: Record<ReviewActionType, string> = {
  SUBMIT: "Hantar untuk Semakan",
  REQUEST_CHANGES: "Minta Pembetulan",
  APPROVE: "Luluskan",
  PUBLISH: "Terbitkan",
  ARCHIVE: "Arkibkan",
  REOPEN_DRAFT: "Buka Semula sebagai Draf",
};

export function getAllowedActions(
  status: ProformaStatus
): ReviewActionType[] {
  const reachableStatuses = new Set(VALID_TRANSITIONS[status]);
  return (Object.keys(ACTION_TO_STATUS) as ReviewActionType[]).filter(
    (type) => reachableStatuses.has(ACTION_TO_STATUS[type])
  );
}
