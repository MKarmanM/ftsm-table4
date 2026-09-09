import { notFound } from "next/navigation";
import Link from "next/link";
import { getVersionDetail } from "@/lib/proforma-detail";
import { getTable4Detail, computeSltSummary, computeGroupTotal } from "@/lib/table4-detail";
import { getAllowedActions } from "@/lib/workflow-constants";
import { getCurrentUser } from "@/lib/auth";
import { canManageDraft, filterActionsByPermission } from "@/lib/permissions";
import { getAuditEventsForVersion } from "@/lib/audit";
import { StatusBadge } from "@/components/status-badge";
import { ReviewActionButtons } from "@/components/review-action-buttons";
import { CommentThread } from "@/components/comment-thread";
import { BasicInfoFormPart1, BasicInfoFormPart2 } from "@/components/table4-basic-info-form";
import { CloEditor } from "@/components/table4-clo-editor";
import { TopicsEditor } from "@/components/table4-topics-editor";
import { AssessmentsEditor } from "@/components/table4-assessments-editor";
import { GuidanceBox } from "@/components/table4-guidance-box";
import { ExportMenu } from "@/components/export-menu";
import { buttonVariants } from "@/components/ui/button";
import { ROLE_LABEL } from "@/lib/roles";

export const dynamic = "force-dynamic";

const RECENT_HISTORY_LIMIT = 3;

function actorRoleLabel(roles: string[]): string {
  return roles.map((r) => ROLE_LABEL[r] ?? r).join(", ");
}

export default async function VersionDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; versionId: string }>;
}) {
  const { versionId } = await params;
  const [version, currentUser, auditEvents, table4] = await Promise.all([
    getVersionDetail(versionId),
    getCurrentUser(),
    getAuditEventsForVersion(versionId),
    getTable4Detail(versionId),
  ]);

  if (!version || !currentUser || !table4) {
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

  const slt = computeSltSummary(
    table4.topics,
    table4.assessments,
    table4.isIndustrialTraining50Elt
  );

  const recentHistory = version.reviewActions.slice(0, RECENT_HISTORY_LIMIT);

  const continuousItems = table4.assessments.filter((a) => a.phase === "CONTINUOUS");
  const finalItems = table4.assessments.filter((a) => a.phase === "FINAL");
  const topicsSubtotal = computeGroupTotal(table4.topics);
  const continuousSubtotal = computeGroupTotal(continuousItems);
  const finalSubtotal = computeGroupTotal(finalItems);

  return (
    <div className="w-full bg-background px-8 py-8">
      <div className="mx-auto max-w-[1400px]">
        <Link
          href={`/courses/${version.course.id}`}
          className="text-sm text-secondary hover:text-foreground"
        >
          &larr; Kembali ke Sejarah Versi
        </Link>

        {/* Header hierarchy: small course code -> big title -> status
            badge + version metadata, actions on the right. */}
        <header className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-xs font-medium tracking-wide text-secondary uppercase">
              {version.course.programme.code}-{version.course.code}
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold text-foreground sm:text-[28px]">
              {version.course.nameMs}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-secondary">
              <StatusBadge status={version.status} />
              <span>Versi {version.versionNo}</span>
              <span>&middot; Dicipta oleh {version.createdBy.name}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/courses/${version.course.id}/versions/${version.id}/cetak`}
              className={buttonVariants({ size: "sm" })}
            >
              Lihat &amp; Cetak
            </Link>
            <ExportMenu versionId={version.id} />
          </div>
        </header>

        <GuidanceBox />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[3fr_1fr]">
          {/* Main content — primary visual focus */}
          <div className="min-w-0 space-y-8">
            <section>
              <h2 className="mb-4 text-base font-semibold text-foreground">
                <span className="italic text-primary">Basic Information</span>
                /Maklumat Asas
              </h2>
              <BasicInfoFormPart1
                versionId={version.id}
                courseId={version.course.id}
                readOnly={!isEditable}
                suggestedCreditHours={slt.suggestedCreditHours}
                initial={table4}
              />
            </section>

            <section>
              <h2 className="mb-1 text-base font-semibold text-foreground">
                <span className="italic text-primary">
                  Course Learning Outcomes (CLO)
                </span>
                /Hasil Pembelajaran Kursus (HPK)
              </h2>
              <p className="mb-4 text-xs text-secondary">
                <span className="italic text-primary">
                  Mapping to Programme Learning Outcomes (PLO), Teaching &amp; Assessment Methods
                </span>
                /Pemetaan HPP, Kaedah Penyampaian dan Kaedah Penilaian
              </p>
              <CloEditor
                versionId={version.id}
                courseId={version.course.id}
                readOnly={!isEditable}
                clos={table4.clos}
                plos={table4.programmePlos}
              />
            </section>

            <section>
              <h2 className="mb-1 text-base font-semibold text-foreground">
                <span className="italic text-primary">
                  Distribution of Student Learning Time (SLT)
                </span>
                /Agihan Masa Pembelajaran Pelajar (SLT)
              </h2>
              <p className="mb-4 text-xs text-secondary">
                Jumlah SLT: {slt.grandTotal} jam &middot; F2F Fizikal:{" "}
                {slt.pctF2fPhysical}% &middot; Online + Kendiri:{" "}
                {slt.pctOnlineIndependent}% &middot; Praktikal:{" "}
                {slt.pctPractical}%
              </p>
              <TopicsEditor
                versionId={version.id}
                courseId={version.course.id}
                readOnly={!isEditable}
                topics={table4.topics}
              />
              <p className="mt-3 text-right text-xs font-semibold text-foreground">
                SUB-TOTAL/SUB-JUMLAH SLT: {topicsSubtotal} jam
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-base font-semibold text-foreground">
                <span className="italic text-primary">Continuous Assessment</span>
                /Penilaian Berterusan
              </h2>
              <AssessmentsEditor
                versionId={version.id}
                courseId={version.course.id}
                readOnly={!isEditable}
                phase="CONTINUOUS"
                items={continuousItems}
              />
              <p className="mt-3 text-right text-xs font-semibold text-foreground">
                SUB-TOTAL/SUB-JUMLAH SLT: {continuousSubtotal} jam
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-base font-semibold text-foreground">
                <span className="italic text-primary">Final Assessment</span>
                /Penilaian Akhir
              </h2>
              <AssessmentsEditor
                versionId={version.id}
                courseId={version.course.id}
                readOnly={!isEditable}
                phase="FINAL"
                items={finalItems}
              />
              <p className="mt-3 text-right text-xs font-semibold text-foreground">
                SUB-TOTAL/SUB-JUMLAH SLT: {finalSubtotal} jam
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-base font-semibold text-foreground">
                <span className="italic text-primary">Other Information</span>
                /Maklumat Lain
              </h2>
              <BasicInfoFormPart2
                versionId={version.id}
                courseId={version.course.id}
                readOnly={!isEditable}
                initial={table4}
              />
            </section>

            <section className="rounded-md border border-primary/20 bg-primary/5 p-5">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                Tindakan
              </h2>
              <ReviewActionButtons
                versionId={version.id}
                courseId={version.course.id}
                allowedActions={permittedActions}
                hasStatusActionsButNoPermission={
                  statusAllowedActions.length > 0 &&
                  permittedActions.length === 0
                }
              />
            </section>
          </div>

          {/* Sidebar — secondary information, lighter visual weight */}
          <aside className="min-w-0 space-y-6 text-sm">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-secondary uppercase">
                Sejarah Semakan
              </p>
              {version.reviewActions.length === 0 ? (
                <p className="text-sm text-secondary italic">
                  Belum ada tindakan direkodkan.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {recentHistory.map((action) => (
                    <li key={action.id} className="border-b border-border pb-2.5 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {action.actorName}
                          {action.actorRoles.length > 0 && (
                            <span className="ml-1 font-normal text-secondary">
                              ({actorRoleLabel(action.actorRoles)})
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-secondary">
                          {action.createdAt.toLocaleDateString("ms-MY")}
                        </span>
                      </div>
                      <p className="text-sm text-secondary">{action.type}</p>
                      {action.note && (
                        <p className="mt-0.5 text-sm text-foreground">{action.note}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {version.reviewActions.length > RECENT_HISTORY_LIMIT && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">
                    Lihat semua sejarah ({version.reviewActions.length})
                  </summary>
                  <ul className="mt-2 space-y-2.5">
                    {version.reviewActions.slice(RECENT_HISTORY_LIMIT).map((action) => (
                      <li key={action.id} className="border-b border-border pb-2.5 last:border-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {action.actorName}
                            {action.actorRoles.length > 0 && (
                              <span className="ml-1 font-normal text-secondary">
                                ({actorRoleLabel(action.actorRoles)})
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-secondary">
                            {action.createdAt.toLocaleDateString("ms-MY")}
                          </span>
                        </div>
                        <p className="text-sm text-secondary">{action.type}</p>
                        {action.note && (
                          <p className="mt-0.5 text-sm text-foreground">{action.note}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>

            <div className="border-t border-border pt-5">
              <p className="mb-2 text-xs font-semibold tracking-wide text-secondary uppercase">
                Komen
              </p>
              <CommentThread
                versionId={version.id}
                courseId={version.course.id}
                comments={version.comments}
              />
            </div>

            <div className="border-t border-border pt-5">
              <details>
                <summary className="cursor-pointer text-xs font-semibold tracking-wide text-secondary uppercase">
                  Log Audit
                </summary>
                {auditEvents.length === 0 ? (
                  <p className="mt-2 text-sm text-secondary italic">
                    Belum ada log direkodkan.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {auditEvents.map((e) => (
                      <li key={e.id} className="border-b border-border pb-1.5 text-xs last:border-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground">{e.actorName}</span>
                          <span className="whitespace-nowrap text-secondary">
                            {e.createdAt.toLocaleDateString("ms-MY")}
                          </span>
                        </div>
                        <span className="text-secondary">{e.action}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
