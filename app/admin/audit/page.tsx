import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canManageCatalog } from "@/lib/permissions";
import { getAuditActionSummary, getRecentAuditEvents } from "@/lib/audit";
import { SearchBox } from "@/components/search-box";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  SUBMIT: "Menghantar untuk semakan",
  REQUEST_CHANGES: "Meminta pembetulan",
  APPROVE: "Meluluskan",
  PUBLISH: "Menerbitkan",
  ARCHIVE: "Mengarkibkan",
  REOPEN_DRAFT: "Membuka semula sebagai draf",
  UPDATE_PAYLOAD: "Mengemaskini kandungan",
  AUTO_SUPERSEDE: "Digantikan secara automatik",
  COPY_VERSION: "Menyalin versi terdahulu",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !canManageCatalog(currentUser)) {
    notFound();
  }

  const { q, action } = await searchParams;
  const [events, actionSummary] = await Promise.all([
    getRecentAuditEvents(150, q, action),
    getAuditActionSummary(),
  ]);

  return (
    <div className="w-full px-8 py-10">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          FTSM &middot; UKM
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Log Audit
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rekod tindakan merentasi sistem &mdash; {events.length} rekod dipaparkan
        </p>
      </header>

      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Ringkasan Tindakan</h2>
          {action && (
            <Link href="/admin/audit" className="text-xs font-medium text-primary hover:underline">
              Kosongkan filter
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/audit"
            className={`rounded-md border px-3 py-2 text-xs ${
              !action ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/40"
            }`}
          >
            Semua
          </Link>
          {actionSummary.map((item) => (
            <Link
              key={item.action}
              href={`/admin/audit?action=${encodeURIComponent(item.action)}`}
              className={`rounded-md border px-3 py-2 text-xs ${
                action === item.action
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {ACTION_LABEL[item.action] ?? item.action} · {item.count}
            </Link>
          ))}
        </div>
      </section>

      <SearchBox
        placeholder="Cari nama pengguna, tindakan, atau kod kursus..."
        defaultValue={q}
      />

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Tiada rekod audit sepadan dengan carian/filter ini.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">Masa</th>
                <th className="px-4 py-3 font-medium">Pengguna</th>
                <th className="px-4 py-3 font-medium">Tindakan</th>
                <th className="px-4 py-3 font-medium">Kursus</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                    {e.createdAt.toLocaleString("ms-MY")}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {e.actorName}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {ACTION_LABEL[e.action] ?? e.action}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {e.courseCode && e.courseId && e.versionId ? (
                      <Link
                        href={`/courses/${e.courseId}/versions/${e.versionId}`}
                        className="font-medium text-primary hover:underline"
                        title={e.courseName ?? undefined}
                      >
                        {e.courseCode}
                        {e.versionNo && (
                          <span className="text-xs"> (v{e.versionNo})</span>
                        )}
                      </Link>
                    ) : (
                      <span className="italic">&mdash;</span>
                    )}
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
