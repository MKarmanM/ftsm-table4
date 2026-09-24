import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { getAllUsersWithRoles } from "@/lib/user-admin";
import { getAllProgrammes, getCoursesForAdmin } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { AddUserForm } from "@/components/add-user-form";
import { AssignRoleForm } from "@/components/assign-role-form";
import { AssignCourseForm } from "@/components/assign-course-form";
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
  const [usersForDropdown, filteredUsers, programmes, allCourses, courseAssignments] = await Promise.all([
    getAllUsersWithRoles(),
    q ? getAllUsersWithRoles(q) : Promise.resolve(null),
    getAllProgrammes(),
    getCoursesForAdmin(),
    prisma.courseAssignment.findMany({
      where: { isCoordinator: false, user: { roles: { some: { role: Role.LECTURER } } } },
      include: { course: { select: { code: true } }, user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const displayedUsers = filteredUsers ?? usersForDropdown;
  const lecturers = usersForDropdown.filter((u) => u.isActive && u.roles.some((r) => r.role === Role.LECTURER))
    .map((u) => ({ id: u.id, name: u.name, email: u.email, programmeCodes: [] as string[] }));
  const courses = allCourses.filter((c) => c.isActive).map((c) => ({
    id: c.id, code: c.code, nameMs: c.nameMs, programmeCode: c.programmeCode,
  }));
  const assignments = courseAssignments.map((a) => ({
    id: a.id, userName: a.user.name, courseCode: a.course.code,
  }));

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

          <section className="rounded-lg border border-border p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Tugasan Kursus Pensyarah</h2>
            <AssignCourseForm lecturers={lecturers} courses={courses} assignments={assignments} />
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
