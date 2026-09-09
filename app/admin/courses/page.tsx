import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canManageCatalog } from "@/lib/permissions";
import { getCoursesForAdmin, getAllProgrammes } from "@/lib/catalog";
import { CourseRow } from "@/components/course-row";

export const dynamic = "force-dynamic";

export default async function AllCoursesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !canManageCatalog(currentUser)) {
    notFound();
  }

  const [courses, programmes] = await Promise.all([
    getCoursesForAdmin(),
    getAllProgrammes(),
  ]);

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
          Semua Kursus
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          {courses.length} kursus berdaftar
        </p>
      </header>

      {courses.length === 0 ? (
        <p className="text-base text-muted-foreground italic">
          Belum ada kursus.
        </p>
      ) : (
        <ul className="space-y-2">
          {courses.map((c) => (
            <CourseRow key={c.id} course={c} programmes={programmes} />
          ))}
        </ul>
      )}
    </div>
  );
}
