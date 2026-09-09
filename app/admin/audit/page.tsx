import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canManageCatalog } from "@/lib/permissions";
import { getRecentAuditEvents } from "@/lib/audit";
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
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !canManageCatalog(currentUser)) {
    notFound();
  }

  const { q } = await searchParams;
  const events = await getRecentAuditEvents(150, q);

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
          Rekod tindakan terkini merentasi sistem &mdash; {events.length}{" "}
          rekod terbaharu
        </p>
      </header>

      <SearchBox
        placeholder="Cari nama pengguna, tindakan, atau kod kursus..."
        defaultValue={q}
      />

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Belum ada log direkodkan.
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
                  className="border-b border-border last:border-0"
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
                    {e.courseCode ? (
                      <>
                        {e.courseCode}
                        {e.versionNo && (
                          <span className="text-xs"> (v{e.versionNo})</span>
                        )}
                      </>
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
