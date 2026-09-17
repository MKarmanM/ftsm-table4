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
  const needsChanges = status === ProformaStatus.CHANGES_REQUESTED;

  return (
    <div className="mb-5 rounded-lg border border-border bg-card p-3 sm:mb-6 sm:p-4">
      <div
        className="flex items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Kemajuan aliran kerja Table 4"
      >
        {STEPS.map((step, index) => {
          const completed = index < current || status === ProformaStatus.PUBLISHED;
          const active = index === current && status !== ProformaStatus.PUBLISHED;
          const warningActive = active && needsChanges;
          return (
            <div key={step.key} className="flex min-w-max flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  completed && "border-primary bg-primary text-primary-foreground",
                  active && !warningActive && "border-primary bg-primary/10 text-primary ring-4 ring-primary/5",
                  warningActive && "border-warning bg-warning/10 text-warning ring-4 ring-warning/5",
                  !completed && !active && "border-border bg-background text-muted-foreground"
                )}
              >
                {completed ? "✓" : index + 1}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap text-sm",
                  completed && "font-medium text-foreground",
                  active && !warningActive && "font-semibold text-primary",
                  warningActive && "font-semibold text-warning",
                  !completed && !active && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 min-w-8 flex-1 rounded-full transition-colors",
                    index < current || status === ProformaStatus.PUBLISHED
                      ? "bg-primary"
                      : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <p
        className={cn(
          "mt-3 rounded-md border px-3 py-2 text-sm leading-relaxed",
          needsChanges
            ? "border-warning/20 bg-warning/8 text-warning"
            : status === ProformaStatus.PUBLISHED
              ? "border-success/20 bg-success/5 text-success"
              : "border-border/70 bg-muted/40 text-foreground"
        )}
      >
        {workflowWaitingText(status)}
      </p>
    </div>
  );
}
