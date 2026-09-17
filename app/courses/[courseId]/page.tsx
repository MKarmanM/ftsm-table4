import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseVersionHistory } from "@/lib/course-history";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth";
import { canManageDraft, canViewDraft } from "@/lib/permissions";
import { CopyVersionButton } from "@/components/copy-version-button";

export const dynamic = "force-dynamic";

export default async function CourseHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ copyError?: string }>;
}) {
  const { courseId } = await params;
  const query = await searchParams;
  const [data, currentUser] = await Promise.all([
    getCourseVersionHistory(courseId),
    getCurrentUser(),
  ]);

  if (!data || !currentUser) notFound();

  const courseContext = {
    id: data.course.id,
    programmeId: data.course.programme.id,
  };

  if (!canViewDraft(currentUser, courseContext)) notFound();
  const canCopy = canManageDraft(currentUser, courseContext);
  const latestVersionId = data.versions[0]?.id ?? null;

  return (
    <div className="w-full px-8 py-10">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Kembali ke senarai kursus
      </Link>

      <header className="mt-4 mb-8 border-b border-border pb-6">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {data.course.programme.code} &middot; {data.course.code}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          {data.course.nameMs}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Sejarah Versi Table 4</p>
      </header>

      {query.copyError && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Versi tidak dapat disalin. Sila cuba semula.
        </div>
      )}

      {canCopy && data.versions.length > 0 && (
        <div className="mb-5 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          <p className="font-medium">Salin Versi Terdahulu</p>
          <p className="mt-1 text-muted-foreground">
            Gunakan versi terdahulu sebagai asas draf baharu. Sejarah semakan, komen dan tarikh kelulusan tidak akan disalin.
          </p>
        </div>
      )}

      {data.versions.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Belum ada draf dicipta untuk kursus ini.
        </p>
      ) : (
        <ul className="space-y-3">
          {data.versions.map((v) => {
            const isLatest = v.id === latestVersionId;
            return (
              <li key={v.id} className="rounded-md border border-border px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link href={`/courses/${courseId}/versions/${v.id}`} className="min-w-0 flex-1 hover:opacity-80">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-medium text-foreground">Versi {v.versionNo}</span>
                      <StatusBadge status={v.status} />
                      {isLatest && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Versi Terkini
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Dicipta oleh {v.createdByName} &middot; {v.createdAt.toLocaleDateString("ms-MY")}
                    </div>
                  </Link>

                  {canCopy && (
                    <CopyVersionButton
                      courseId={courseId}
                      sourceVersionId={v.id}
                      sourceLabel={`Versi ${v.versionNo} (${v.status === "PUBLISHED" ? "Diterbitkan" : v.status === "APPROVED" ? "Diluluskan" : v.status === "DRAFT" ? "Draf" : "versi terdahulu"}, ${v.createdAt.toLocaleDateString("ms-MY")})`}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
