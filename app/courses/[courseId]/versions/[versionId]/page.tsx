import { notFound } from "next/navigation";
import Link from "next/link";
import { getVersionDetail } from "@/lib/proforma-detail";
import { getTable4Detail, computeSltSummary, computeGroupTotal } from "@/lib/table4-detail";
import { computeTable4Completion } from "@/lib/table4-completion";
import { getAllowedActions } from "@/lib/workflow-constants";
import { getCurrentUser } from "@/lib/auth";
import { canManageDraft, canViewDraft, filterActionsByPermission } from "@/lib/permissions";
import { getAuditEventsForVersion } from "@/lib/audit";
import { StatusBadge } from "@/components/status-badge";
import { ReviewActionButtons } from "@/components/review-action-buttons";
import { CommentThread } from "@/components/comment-thread";
import { BasicInfoFormPart1, BasicInfoFormPart2 } from "@/components/table4-basic-info-form";
import { CloEditor } from "@/components/table4-clo-editor";
import { TopicsEditor } from "@/components/table4-topics-editor";
import { AssessmentsEditor } from "@/components/table4-assessments-editor";
import { GuidanceBox } from "@/components/table4-guidance-box";
import { Table4SectionNav } from "@/components/table4-section-nav";
import { WorkflowStepper } from "@/components/workflow-stepper";
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
  const { courseId, versionId } = await params;
  const [version, currentUser, auditEvents, table4] = await Promise.all([
    getVersionDetail(versionId),
    getCurrentUser(),
    getAuditEventsForVersion(versionId),
    getTable4Detail(versionId),
  ]);

  if (!version || !currentUser || !table4) notFound();

  const courseContext = {
    id: version.course.id,
    programmeId: version.course.programme.id,
  };

  if (version.course.id !== courseId || !canViewDraft(currentUser, courseContext)) {
    notFound();
  }

  const statusAllowedActions = getAllowedActions(version.status);
  const permittedActions = filterActionsByPermission(currentUser, statusAllowedActions, courseContext);
  const isEditable = version.status === "DRAFT" && canManageDraft(currentUser, courseContext);

  const slt = computeSltSummary(
    table4.topics,
    table4.assessments,
    table4.isIndustrialTraining50Elt
  );
  const completion = computeTable4Completion(table4);

  const recentHistory = version.reviewActions.slice(0, RECENT_HISTORY_LIMIT);
  const continuousItems = table4.assessments.filter((a) => a.phase === "CONTINUOUS");
  const finalItems = table4.assessments.filter((a) => a.phase === "FINAL");
  const topicsSubtotal = computeGroupTotal(table4.topics);
  const continuousSubtotal = computeGroupTotal(continuousItems);
  const finalSubtotal = computeGroupTotal(finalItems);

  return (
    <div className="w-full bg-background px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <Link
          href={`/courses/${version.course.id}`}
          className="inline-flex rounded-md py-1 text-sm text-secondary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          &larr; Kembali ke Sejarah Versi
        </Link>

        <header className="mt-2.5 mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:mt-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-secondary uppercase">
              {version.course.programme.code}-{version.course.code}
            </p>
            <h1 className="mt-0.5 text-xl font-semibold leading-tight text-foreground sm:text-[28px]">
              {version.course.nameMs}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-secondary">
              <StatusBadge status={version.status} />
              <span>Versi {version.versionNo}</span>
              <span className="hidden sm:inline">&middot;</span>
              <span>Dicipta oleh {version.createdBy.name}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <Link
              href={`/courses/${version.course.id}/versions/${version.id}/cetak`}
              className={buttonVariants({ size: "sm" })}
            >
              Lihat &amp; Cetak
            </Link>
            <ExportMenu versionId={version.id} />
          </div>
        </header>

        <WorkflowStepper status={version.status} />
        <GuidanceBox />

        <Table4SectionNav percentage={completion.percentage} sections={completion.sections} />

        <div className="mb-5 rounded-lg border border-border bg-card p-3.5 sm:mb-6 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground">
                Kelengkapan Table 4: {completion.percentage}%
              </p>
              <p className="text-sm text-secondary">
                {completion.completeCount} daripada {completion.totalSections} bahagian utama lengkap.
              </p>
            </div>
            <p className="text-sm font-medium text-foreground">
              Wajaran penilaian: {completion.assessmentTotal.toFixed(2)}%
            </p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {completion.sections.map((section) => (
              <a
                key={section.key}
                href={`#${section.key}`}
                className="rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-primary/20 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <p className="text-sm font-medium text-foreground">
                  <span className={section.complete ? "text-success" : "text-warning"}>
                    {section.complete ? "✓" : "⚠"}
                  </span>{" "}
                  {section.label}
                </p>
                {!section.complete && (
                  <p className="mt-1 text-xs leading-relaxed text-secondary">{section.hint}</p>
                )}
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,3fr)_minmax(300px,1fr)] xl:gap-8">
          <div className="min-w-0 space-y-7 sm:space-y-8">
            <section id="basic" className="scroll-mt-24 sm:scroll-mt-28">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                <span className="italic text-primary">Basic Information</span>/Maklumat Asas
              </h2>
              <BasicInfoFormPart1
                versionId={version.id}
                courseId={version.course.id}
                readOnly={!isEditable}
                suggestedCreditHours={slt.suggestedCreditHours}
                initial={table4}
              />
            </section>

            <section id="clo" className="scroll-mt-24 sm:scroll-mt-28">
              <h2 className="mb-1 text-base font-semibold text-foreground">
                <span className="italic text-primary">Course Learning Outcomes (CLO)</span>/Hasil Pembelajaran Kursus (HPK)
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-secondary sm:text-xs">
                <span className="italic text-primary">
                  Mapping to Programme Learning Outcomes (PLO), Teaching &amp; Assessment Methods
                </span>/Pemetaan HPP, Kaedah Penyampaian dan Kaedah Penilaian
              </p>
              <CloEditor
                versionId={version.id}
                courseId={version.course.id}
                readOnly={!isEditable}
                clos={table4.clos}
                plos={table4.programmePlos}
              />
            </section>

            <section id="slt" className="scroll-mt-24 sm:scroll-mt-28">
              <h2 className="mb-1 text-base font-semibold text-foreground">
                <span className="italic text-primary">Distribution of Student Learning Time (SLT)</span>/Agihan Masa Pembelajaran Pelajar (SLT)
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-secondary sm:text-xs">
                Jumlah SLT: {slt.grandTotal} jam &middot; F2F Fizikal: {slt.pctF2fPhysical}% &middot; Online + Kendiri: {slt.pctOnlineIndependent}% &middot; Praktikal: {slt.pctPractical}%
              </p>
              <TopicsEditor
                versionId={version.id}
                courseId={version.course.id}
                readOnly={!isEditable}
                topics={table4.topics}
                clos={table4.clos}
              />
              <p className="mt-3 text-right text-xs font-semibold text-foreground">
                SUB-TOTAL/SUB-JUMLAH SLT: {topicsSubtotal} jam
              </p>
            </section>

            <section id="assessment" className="scroll-mt-24 sm:scroll-mt-28">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                <span className="italic text-primary">Continuous Assessment</span>/Penilaian Berterusan
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

            <section id="assessment-final" className="scroll-mt-24 sm:scroll-mt-28">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                <span className="italic text-primary">Final Assessment</span>/Penilaian Akhir
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

            <section id="other" className="scroll-mt-24 sm:scroll-mt-28">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                <span className="italic text-primary">Other Information</span>/Maklumat Lain
              </h2>
              <BasicInfoFormPart2
                versionId={version.id}
                courseId={version.course.id}
                readOnly={!isEditable}
                initial={table4}
              />
            </section>

            <section id="review" className="scroll-mt-24 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:scroll-mt-28 sm:p-5">
              <h2 className="mb-4 text-base font-semibold text-foreground">Tindakan Semakan</h2>
              <ReviewActionButtons
                versionId={version.id}
                courseId={version.course.id}
                allowedActions={permittedActions}
                hasStatusActionsButNoPermission={statusAllowedActions.length > 0 && permittedActions.length === 0}
              />
            </section>
          </div>

          <aside className="min-w-0 space-y-5 rounded-lg border border-border bg-card p-4 text-sm xl:self-start">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-secondary uppercase">Sejarah Semakan</p>
              {version.reviewActions.length === 0 ? (
                <p className="text-sm text-secondary italic">Belum ada tindakan direkodkan.</p>
              ) : (
                <ul className="space-y-2.5">
                  {recentHistory.map((action) => (
                    <li key={action.id} className="border-b border-border pb-2.5 last:border-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 text-sm font-medium text-foreground">
                          {action.actorName}
                          {action.actorRoles.length > 0 && (
                            <span className="ml-1 font-normal text-secondary">({actorRoleLabel(action.actorRoles)})</span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs text-secondary">{action.createdAt.toLocaleDateString("ms-MY")}</span>
                      </div>
                      <p className="text-sm text-secondary">{action.type}</p>
                      {action.note && <p className="mt-0.5 text-sm text-foreground">{action.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
              {version.reviewActions.length > RECENT_HISTORY_LIMIT && (
                <details className="mt-2">
                  <summary className="cursor-pointer rounded-md py-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                    Lihat semua sejarah ({version.reviewActions.length})
                  </summary>
                  <ul className="mt-2 space-y-2.5">
                    {version.reviewActions.slice(RECENT_HISTORY_LIMIT).map((action) => (
                      <li key={action.id} className="border-b border-border pb-2.5 last:border-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 text-sm font-medium text-foreground">
                            {action.actorName}
                            {action.actorRoles.length > 0 && (
                              <span className="ml-1 font-normal text-secondary">({actorRoleLabel(action.actorRoles)})</span>
                            )}
                          </span>
                          <span className="shrink-0 text-xs text-secondary">{action.createdAt.toLocaleDateString("ms-MY")}</span>
                        </div>
                        <p className="text-sm text-secondary">{action.type}</p>
                        {action.note && <p className="mt-0.5 text-sm text-foreground">{action.note}</p>}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>

            <div className="border-t border-border pt-5">
              <p className="mb-2 text-xs font-semibold tracking-wide text-secondary uppercase">Komen Mengikut Bahagian</p>
              <CommentThread versionId={version.id} courseId={version.course.id} comments={version.comments} />
            </div>

            <div className="border-t border-border pt-5">
              <details>
                <summary className="cursor-pointer rounded-md py-1 text-xs font-semibold tracking-wide text-secondary uppercase focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">Log Audit</summary>
                {auditEvents.length === 0 ? (
                  <p className="mt-2 text-sm text-secondary italic">Belum ada log direkodkan.</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {auditEvents.map((e) => (
                      <li key={e.id} className="border-b border-border pb-1.5 text-xs last:border-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground">{e.actorName}</span>
                          <span className="whitespace-nowrap text-secondary">{e.createdAt.toLocaleDateString("ms-MY")}</span>
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
