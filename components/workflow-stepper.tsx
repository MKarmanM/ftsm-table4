import { ProformaStatus } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "DRAFT", label: "Draf" },
  { key: "SUBMITTED", label: "Semakan" },
  { key: "APPROVED", label: "Diluluskan" },
  { key: "PUBLISHED", label: "Diterbitkan" },
] as const;

const STAGE_INDEX: Record<ProformaStatus, number> = {
  DRAFT: 0,
  CHANGES_REQUESTED: 1,
  SUBMITTED: 1,
  APPROVED: 2,
  PUBLISHED: 3,
  SUPERSEDED: 3,
  ARCHIVED: 3,
};

export function workflowWaitingText(status: ProformaStatus): string {
  switch (status) {
    case ProformaStatus.DRAFT:
      return "Tindakan anda: lengkapkan Table 4 dan hantar untuk semakan.";
    case ProformaStatus.SUBMITTED:
      return "Menunggu semakan Penyelaras Program.";
    case ProformaStatus.CHANGES_REQUESTED:
      return "Tindakan anda diperlukan: buat pembetulan dan hantar semula.";
    case ProformaStatus.APPROVED:
      return "Diluluskan. Menunggu Pegawai Akademik menerbitkan versi ini.";
    case ProformaStatus.PUBLISHED:
      return "Versi ini telah diterbitkan sebagai versi rasmi.";
    case ProformaStatus.SUPERSEDED:
      return "Versi ini telah digantikan oleh versi rasmi yang lebih baharu.";
    case ProformaStatus.ARCHIVED:
      return "Versi ini telah diarkibkan.";
  }
}

export function WorkflowStepper({ status }: { status: ProformaStatus }) {
  const current = STAGE_INDEX[status];

  return (
    <div className="mb-6 rounded-md border border-border bg-card p-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1" aria-label="Kemajuan aliran kerja Table 4">
        {STEPS.map((step, index) => {
          const completed = index < current || status === ProformaStatus.PUBLISHED;
          const active = index === current && status !== ProformaStatus.PUBLISHED;
          return (
            <div key={step.key} className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  completed && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-primary/10 text-primary",
                  !completed && !active && "border-border bg-background text-muted-foreground"
                )}
              >
                {completed ? "✓" : index + 1}
              </div>
              <span className={cn("whitespace-nowrap text-sm", (completed || active) ? "font-medium text-foreground" : "text-muted-foreground")}>
                {step.label}
              </span>
              {index < STEPS.length - 1 && <div className="h-px min-w-6 flex-1 bg-border" />}
            </div>
          );
        })}
      </div>
      <p className={cn(
        "mt-3 rounded-md px-3 py-2 text-sm",
        status === ProformaStatus.CHANGES_REQUESTED ? "bg-warning/10 text-warning" : "bg-muted/50 text-foreground"
      )}>
        {workflowWaitingText(status)}
      </p>
    </div>
  );
}
