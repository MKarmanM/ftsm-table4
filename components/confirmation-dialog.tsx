"use client";

import { Button } from "@/components/ui/button";

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmName,
  confirmValue,
  destructive = false,
  pending = false,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmName?: string;
  confirmValue?: string;
  destructive?: boolean;
  pending?: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="w-full max-w-md rounded-lg border border-border bg-background p-5 shadow-xl"
      >
        <h3 id="confirm-title" className="text-base font-semibold text-foreground">
          {title}
        </h3>
        <p id="confirm-description" className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Batal
          </Button>
          <Button
            type="submit"
            name={confirmName}
            value={confirmValue}
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
          >
            {pending ? "Memproses..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
