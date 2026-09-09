import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { getAllUsersWithRoles } from "@/lib/user-admin";
import { getAllProgrammes } from "@/lib/catalog";
import { AddUserForm } from "@/components/add-user-form";
import { AssignRoleForm } from "@/components/assign-role-form";
import { UsersTable } from "@/components/users-table";
import { SearchBox } from "@/components/search-box";

export const dynamic = "force-dynamic";

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canManageUsers(currentUser)) {
    notFound();
  }

  const { q } = await searchParams;

  // The "assign role" dropdown must always list every user regardless of
  // the search box — only the table below gets filtered.
  const [usersForDropdown, filteredUsers, programmes] = await Promise.all([
    getAllUsersWithRoles(),
    q ? getAllUsersWithRoles(q) : Promise.resolve(null),
    getAllProgrammes(),
  ]);
  const displayedUsers = filteredUsers ?? usersForDropdown;

  return (
    <div className="w-full px-8 py-10">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          FTSM &middot; UKM
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Urus Pengguna
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tambah pengguna dan urus peranan
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Left column: forms */}
        <div className="space-y-6">
          <section className="rounded-lg border border-border p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Tambah Pengguna
            </h2>
            <AddUserForm />
          </section>

          <section className="rounded-lg border border-border p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Beri Peranan
            </h2>
            <AssignRoleForm users={usersForDropdown} programmes={programmes} />
          </section>
        </div>

        {/* Right column: user list */}
        <section className="rounded-lg border border-border bg-muted/20 p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Senarai Pengguna
            </h2>
            <span className="text-xs text-muted-foreground">
              {usersForDropdown.length} jumlah
            </span>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Klik peranan untuk buang.
          </p>
          <SearchBox placeholder="Cari nama atau emel..." defaultValue={q} />
          <UsersTable users={displayedUsers} currentUserId={currentUser.id} />
        </section>
      </div>
    </div>
  );
}
