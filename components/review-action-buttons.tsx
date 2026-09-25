"use client";

import { useActionState, useState } from "react";
import {
  reviewActionFormAction,
  type ReviewActionFormState,
} from "@/app/actions/proforma";
import { ACTION_LABEL } from "@/lib/workflow-constants";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { FormTextarea } from "@/components/form-field";
import type { ReviewActionType } from "@/lib/generated/prisma/enums";

const initialState: ReviewActionFormState = {};

const CONFIRM_COPY: Partial<Record<ReviewActionType, { title: string; description: string; confirmLabel: string; destructive?: boolean }>> = {
  SUBMIT: {
    title: "Hantar Table 4 untuk semakan?",
    description: "Selepas dihantar, kandungan tidak boleh diedit sehingga versi ini dipulangkan untuk pembetulan atau dibuka semula sebagai draf.",
    confirmLabel: "Ya, hantar untuk semakan",
  },
  APPROVE: {
    title: "Luluskan Table 4 ini?",
    description: "Tindakan ini merekodkan kelulusan fakulti dan memindahkan versi ini ke peringkat penerbitan.",
    confirmLabel: "Ya, luluskan",
  },
  PUBLISH: {
    title: "Terbitkan sebagai versi rasmi?",
    description: "Versi ini akan diterbitkan sebagai versi rasmi Table 4. Jika ada versi rasmi terdahulu, versi tersebut akan digantikan.",
    confirmLabel: "Ya, terbitkan",
  },
  REQUEST_CHANGES: {
    title: "Minta pembetulan?",
    description: "Versi ini akan dipulangkan untuk pembetulan. Gunakan ruangan catatan untuk terangkan perkara yang perlu dibetulkan.",
    confirmLabel: "Minta pembetulan",
  },
  ARCHIVE: {
    title: "Arkibkan versi ini?",
    description: "Versi ini akan dipindahkan ke arkib dan tidak lagi menjadi versi aktif.",
    confirmLabel: "Arkibkan",
    destructive: true,
  },
};

function inferSection(message: string): { href: string; label: string } {
  const text = message.toLowerCase();
  if (text.includes("clo") || text.includes("plo") || text.includes("taksonomi") || text.includes("penyampaian")) {
    return { href: "#clo", label: "Pergi ke CLO / PLO" };
  }
  if (text.includes("topik") || text.includes("slt") || text.includes("kredit")) {
    return { href: "#slt", label: "Pergi ke SLT" };
  }
  if (text.includes("penilaian") || text.includes("wajaran")) {
    return { href: "#assessment", label: "Pergi ke Penilaian" };
  }
  if (text.includes("rujukan")) {
    return { href: "#other", label: "Pergi ke Maklumat Lain" };
  }
  return { href: "#basic", label: "Pergi ke Maklumat Kursus" };
}

function ValidationRecovery({ error }: { error: string }) {
  const lines = error
    .split("\n")
    .map((line) => line.replace(/^•\s*/, "").trim())
    .filter((line) => line && !line.toLowerCase().startsWith("table 4 belum lengkap") && !line.includes("isu lagi"));

  if (lines.length === 0) {
    return <p role="alert" className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
      <p className="text-sm font-semibold text-destructive">Table 4 belum lengkap</p>
      <p className="mt-1 text-xs text-muted-foreground">Lengkapkan perkara berikut sebelum hantar untuk semakan.</p>
      <ul className="mt-2 space-y-2">
        {lines.map((line, index) => {
          const target = inferSection(line);
          return (
            <li key={`${line}-${index}`} className="flex flex-wrap items-start justify-between gap-2 text-sm">
              <span className="text-foreground">{line}</span>
              <a href={target.href} className="shrink-0 text-xs font-medium text-primary hover:underline">
                {target.label}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ReviewActionButtons({
  versionId,
  courseId,
  allowedActions,
  hasStatusActionsButNoPermission,
}: {
  versionId: string;
  courseId: string;
  allowedActions: ReviewActionType[];
  hasStatusActionsButNoPermission?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    reviewActionFormAction,
    initialState
  );
  const [confirmType, setConfirmType] = useState<ReviewActionType | null>(null);

  if (allowedActions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        {hasStatusActionsButNoPermission
          ? "Versi ini sedang menunggu tindakan daripada peranan seterusnya dalam proses semakan."
          : "Tiada tindakan lanjut tersedia untuk status semasa."}
      </p>
    );
  }

  const confirm = confirmType ? CONFIRM_COPY[confirmType] : undefined;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="versionId" value={versionId} />
      <input type="hidden" name="courseId" value={courseId} />

      <FormTextarea
        label="Catatan (pilihan)"
        name="note"
        rows={2}
        hint="Contoh: perlu tambah CLO untuk topik 3"
      />

      <div className="flex flex-wrap gap-2">
        {allowedActions.map((type) => {
          const isForward = type === "SUBMIT" || type === "APPROVE" || type === "PUBLISH";
          const needsConfirm = Boolean(CONFIRM_COPY[type]);
          return (
            <Button
              key={type}
              type={needsConfirm ? "button" : "submit"}
              name={needsConfirm ? undefined : "type"}
              value={needsConfirm ? undefined : type}
              variant={type === "ARCHIVE" ? "destructive" : isForward ? "default" : "outline"}
              size="sm"
              disabled={isPending}
              onClick={() => needsConfirm && setConfirmType(type)}
            >
              {ACTION_LABEL[type]}
            </Button>
          );
        })}
      </div>

      {state?.error && <ValidationRecovery error={state.error} />}

      {confirmType && confirm && (
        <ConfirmationDialog
          open
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.confirmLabel}
          confirmName="type"
          confirmValue={confirmType}
          destructive={confirm.destructive}
          pending={isPending}
          onClose={() => setConfirmType(null)}
        />
      )}
    </form>
  );
}
