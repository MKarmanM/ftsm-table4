import { notFound } from "next/navigation";
import Link from "next/link";
import { getVersionDetail } from "@/lib/proforma-detail";
import { getAllowedActions } from "@/lib/workflow-constants";
import { getCurrentUser } from "@/lib/auth";
import { canManageDraft, filterActionsByPermission } from "@/lib/permissions";
import { getAuditEventsForVersion } from "@/lib/audit";
import { StatusBadge } from "@/components/status-badge";
import { PayloadEditor } from "@/components/payload-editor";
import { ReviewActionButtons } from "@/components/review-action-buttons";
import { CommentThread } from "@/components/comment-thread";

export const dynamic = "force-dynamic";

export default async function VersionDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; versionId: string }>;
}) {
  const { versionId } = await params;
  const [version, currentUser, auditEvents] = await Promise.all([
    getVersionDetail(versionId),
    getCurrentUser(),
    getAuditEventsForVersion(versionId),
  ]);

  if (!version || !currentUser) {
    notFound();
  }

  const courseContext = {
    id: version.course.id,
    programmeId: version.course.programme.id,
  };

  const statusAllowedActions = getAllowedActions(version.status);
  const permittedActions = filterActionsByPermission(
    currentUser,
    statusAllowedActions,
    courseContext
  );
  const isEditable =
    version.status === "DRAFT" && canManageDraft(currentUser, courseContext);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href={`/courses/${version.course.id}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Kembali ke sejarah versi
      </Link>

      <header className="mt-4 mb-8 border-b border-border pb-6">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {version.course.programme.code} &middot; {version.course.code}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          {version.course.nameMs}
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <StatusBadge status={version.status} />
          <span className="text-sm text-muted-foreground">
            Versi {version.versionNo}
          </span>
          <span className="text-sm text-muted-foreground">
            &middot; Dicipta oleh {version.createdBy.name}
          </span>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Kandungan Table 4 (payload)
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Format Table 4 rasmi belum disahkan oleh FTSM, jadi kandungan
          disimpan sebagai JSON buat masa ini.
        </p>
        <PayloadEditor
          versionId={version.id}
          courseId={version.course.id}
          initialPayload={version.payload}
          readOnly={!isEditable}
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Tindakan
        </h2>
        <ReviewActionButtons
          versionId={version.id}
          courseId={version.course.id}
          allowedActions={permittedActions}
          hasStatusActionsButNoPermission={
            statusAllowedActions.length > 0 && permittedActions.length === 0
          }
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Sejarah Semakan
        </h2>
        {version.reviewActions.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Belum ada tindakan direkodkan.
          </p>
        ) : (
          <ul className="space-y-2">
            {version.reviewActions.map((action) => (
              <li
                key={action.id}
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    {action.actorName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {action.createdAt.toLocaleString("ms-MY")}
                  </span>
                </div>
                <p className="text-muted-foreground">{action.type}</p>
                {action.note && (
                  <p className="mt-1 text-foreground">{action.note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Komen Semakan
        </h2>
        <CommentThread
          versionId={version.id}
          courseId={version.course.id}
          comments={version.comments}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Log Audit
        </h2>
        {auditEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Belum ada log direkodkan.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {auditEvents.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-xs"
              >
                <span className="text-foreground">
                  <span className="font-medium">{e.actorName}</span>
                  {" "}&mdash;{" "}
                  <span className="text-muted-foreground">{e.action}</span>
                </span>
                <span className="text-muted-foreground">
                  {e.createdAt.toLocaleString("ms-MY")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
