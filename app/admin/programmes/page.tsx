import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canManageCatalog } from "@/lib/permissions";
import { getProgrammesForAdmin, getProgrammePlos } from "@/lib/catalog";
import { ProgrammeRow } from "@/components/programme-row";
import { PloManager } from "@/components/plo-manager";

export const dynamic = "force-dynamic";

export default async function AllProgrammesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !canManageCatalog(currentUser)) {
    notFound();
  }

  const programmes = await getProgrammesForAdmin();
  const plosByProgramme = await Promise.all(
    programmes.map((p) => getProgrammePlos(p.id))
  );

  return (
    <div className="w-full px-8 py-10">
      <Link
        href="/admin"
        className="text-base text-muted-foreground hover:text-foreground"
      >
        &larr; Kembali ke Urus Katalog
      </Link>

      <header className="mt-4 mb-8 border-b border-border pb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Semua Program
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          {programmes.length} program berdaftar
        </p>
      </header>

      {programmes.length === 0 ? (
        <p className="text-base text-muted-foreground italic">
          Belum ada program.
        </p>
      ) : (
        <ul className="space-y-4">
          {programmes.map((p, i) => (
            <li key={p.id}>
              <ProgrammeRow programme={p} />
              <PloManager programmeId={p.id} plos={plosByProgramme[i]} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
