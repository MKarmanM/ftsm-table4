import { ProformaStatus } from "@/lib/generated/prisma/enums";
import { STATUS_LABEL } from "@/lib/courses";
import { cn } from "@/lib/utils";

export const STATUS_BADGE_STYLE: Record<ProformaStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-blue-100 text-blue-900",
  CHANGES_REQUESTED: "bg-warning/10 text-warning",
  APPROVED: "bg-success/10 text-success",
  PUBLISHED: "bg-primary text-primary-foreground",
  SUPERSEDED: "bg-muted text-muted-foreground",
  ARCHIVED: "bg-muted text-muted-foreground",
};

// Same semantic colour per status, but a subtle left-border + tint
// treatment suited to a large summary card rather than a small chip —
// keeps the dashboard readable at a glance without looking like a
// flashy consumer dashboard.
export const STATUS_CARD_STYLE: Record<ProformaStatus, string> = {
  DRAFT: "border-l-4 border-l-muted-foreground/40 bg-muted/20",
  SUBMITTED: "border-l-4 border-l-blue-500 bg-blue-50",
  CHANGES_REQUESTED: "border-l-4 border-l-warning bg-warning/5",
  APPROVED: "border-l-4 border-l-success bg-success/5",
  PUBLISHED: "border-l-4 border-l-primary bg-primary/5",
  SUPERSEDED: "border-l-4 border-l-muted-foreground/40 bg-muted/20",
  ARCHIVED: "border-l-4 border-l-muted-foreground/40 bg-muted/20",
};

export function StatusBadge({ status }: { status: ProformaStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide uppercase",
        STATUS_BADGE_STYLE[status]
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
