import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseVersionHistory } from "@/lib/course-history";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth";
import { canViewDraft } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function CourseHistoryPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const [data, currentUser] = await Promise.all([
    getCourseVersionHistory(courseId),
    getCurrentUser(),
  ]);

  if (
    !data ||
    !currentUser ||
    !canViewDraft(currentUser, {
      id: data.course.id,
      programmeId: data.course.programme.id,
    })
  ) {
    notFound();
  }

  return (
    <div className="w-full px-8 py-10">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Kembali ke senarai kursus
      </Link>

      <header className="mt-4 mb-8 border-b border-border pb-6">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {data.course.programme.code} &middot; {data.course.code}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          {data.course.nameMs}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sejarah Versi Table 4
        </p>
      </header>

      {data.versions.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Belum ada draf dicipta untuk kursus ini.
        </p>
      ) : (
        <ul className="space-y-2">
          {data.versions.map((v) => (
            <li key={v.id}>
              <Link
                href={`/courses/${courseId}/versions/${v.id}`}
                className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground">
                    Versi {v.versionNo}
                  </span>
                  <StatusBadge status={v.status} />
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>Dicipta oleh {v.createdByName}</p>
                  <p>{v.createdAt.toLocaleDateString("ms-MY")}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
