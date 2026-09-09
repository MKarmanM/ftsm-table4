import { getCoursesOverview, STATUS_LABEL } from "@/lib/courses";
import { getCurrentUser } from "@/lib/auth";
import { canManageDraft } from "@/lib/permissions";
import { getPendingActionsForUser, getStatusCounts } from "@/lib/dashboard";
import { StatusBadge, STATUS_CARD_STYLE } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { CreateDraftButton } from "@/components/create-draft-button";
import { SearchBox } from "@/components/search-box";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

// Statuses where the latest version is "done" — nothing further will
// happen to it, so a new draft (next version) can be started on top of
// it. Anything still in flight (DRAFT/SUBMITTED/CHANGES_REQUESTED/
// APPROVED) must finish its own journey first.
const TERMINAL_STATUSES = new Set(["PUBLISHED", "SUPERSEDED", "ARCHIVED"]);

export const dynamic = "force-dynamic";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const [courses, currentUser] = await Promise.all([
    getCoursesOverview(q),
    getCurrentUser(),
  ]);

  const [pendingActions, statusCounts] = await Promise.all([
    currentUser ? getPendingActionsForUser(currentUser) : Promise.resolve([]),
    getStatusCounts(),
  ]);

  return (
    <div className="w-full px-8 py-10">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          FTSM &middot; UKM
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Pengurusan Proforma Kursus
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Table 4 &mdash; senarai kursus dan status semasa
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Ringkasan
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {statusCounts.map(({ status, count }) => (
            <div
              key={status}
              className={cn(
                "rounded-lg border border-border px-4 py-3",
                STATUS_CARD_STYLE[status]
              )}
            >
              <p className="text-2xl font-semibold text-foreground">
                {count}
              </p>
              <p className="text-xs text-muted-foreground">
                {STATUS_LABEL[status]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {currentUser && (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Menunggu Tindakan Anda
          </h2>
          {pendingActions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Tiada tindakan tertunggak buat masa ini.
            </p>
          ) : (
            <ul className="space-y-2">
              {pendingActions.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/courses/${p.courseId}/versions/${p.id}`}
                    className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm hover:bg-muted/30"
                  >
                    <div>
                      <span className="font-medium text-foreground">
                        {p.programmeCode} &middot; {p.courseCode}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        &mdash; {p.courseName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.status} />
                      <span className="text-xs text-muted-foreground">
                        v{p.versionNo}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Semua Kursus
      </h2>
      <SearchBox placeholder="Cari kod atau nama kursus..." defaultValue={q} />

      {courses.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">Kod</th>
                <th className="px-4 py-3 font-medium">Nama Kursus</th>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium">Kredit</th>
                <th className="px-4 py-3 font-medium">Penyelaras</th>
                <th className="px-4 py-3 font-medium">Status Table 4</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr
                  key={course.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    {course.code}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {course.nameMs}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {course.programme.code}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {course.creditHours}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {course.coordinatorName ?? (
                      <span className="italic">Belum ditetapkan</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {course.latestVersion ? (
                      <div className="flex items-center gap-2">
                        <StatusBadge status={course.latestVersion.status} />
                        <span className="text-xs text-muted-foreground">
                          v{course.latestVersion.versionNo}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Belum ada draf
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(() => {
                      const canManage =
                        !!currentUser &&
                        canManageDraft(currentUser, {
                          id: course.id,
                          programmeId: course.programme.id,
                        });
                      const isTerminalOrEmpty =
                        !course.latestVersion ||
                        TERMINAL_STATUSES.has(course.latestVersion.status);
                      const showCreateDraft = canManage && isTerminalOrEmpty;

                      return (
                        <div className="flex items-center justify-end gap-2">
                          {course.latestVersion && (
                            <Link
                              href={`/courses/${course.id}`}
                              className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                              })}
                            >
                              Sejarah
                            </Link>
                          )}
                          {course.latestVersion && (
                            <Link
                              href={`/courses/${course.id}/versions/${course.latestVersion.id}`}
                              className={buttonVariants({
                                variant: "outline",
                                size: "sm",
                              })}
                            >
                              Buka
                            </Link>
                          )}
                          {showCreateDraft && (
                            <CreateDraftButton courseId={course.id} />
                          )}
                          {!course.latestVersion && !showCreateDraft && (
                            <span className="text-xs text-muted-foreground italic">
                              &mdash;
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
      <p className="text-sm font-medium text-foreground">
        Tiada kursus lagi
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Kursus akan dipaparkan di sini sebaik sahaja ditambah ke dalam
        program.
      </p>
    </div>
  );
}
