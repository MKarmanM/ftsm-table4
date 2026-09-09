import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { canManageCatalog } from "@/lib/permissions";
import {
  getAllProgrammes,
  getProgrammesForAdmin,
  getCoursesForAdmin,
} from "@/lib/catalog";
import { AddProgrammeForm } from "@/components/add-programme-form";
import { AddCourseForm } from "@/components/add-course-form";
import { ProgrammeRow } from "@/components/programme-row";
import { CourseRow } from "@/components/course-row";

export const dynamic = "force-dynamic";

const PREVIEW_LIMIT = 5;

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !canManageCatalog(currentUser)) {
    notFound();
  }

  const [programmesForDropdown, allProgrammes, allCourses] = await Promise.all([
    getAllProgrammes(),
    getProgrammesForAdmin(),
    getCoursesForAdmin(),
  ]);

  const programmes = allProgrammes.slice(0, PREVIEW_LIMIT);
  const courses = allCourses.slice(0, PREVIEW_LIMIT);

  return (
    <div className="w-full px-8 py-10">
      <header className="mb-10 border-b border-border pb-6">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          FTSM &middot; UKM
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Urus Katalog
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tambah program dan kursus baharu
        </p>
      </header>

      {/* Programme section: form left, list right */}
      <section className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-5 text-sm font-semibold text-foreground">
            Tambah Program
          </h2>
          <AddProgrammeForm />
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Senarai Program
            </h2>
            <Link
              href="/admin/programmes"
              className="text-sm font-medium text-primary hover:underline"
            >
              Urus PLO &amp; lihat semua ({allProgrammes.length}) &rarr;
            </Link>
          </div>
          {programmes.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Belum ada program.
            </p>
          ) : (
            <div className="space-y-2">
              {programmes.map((p) => (
                <ProgrammeRow key={p.id} programme={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Course section: form left, list right */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-5 text-sm font-semibold text-foreground">
            Tambah Kursus
          </h2>
          <AddCourseForm programmes={programmesForDropdown} />
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Senarai Kursus
            </h2>
            <span className="text-sm text-muted-foreground">
              {allCourses.length} jumlah
            </span>
          </div>
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Belum ada kursus.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {courses.map((c) => (
                  <CourseRow
                    key={c.id}
                    course={c}
                    programmes={programmesForDropdown}
                  />
                ))}
              </div>
              {allCourses.length > PREVIEW_LIMIT && (
                <Link
                  href="/admin/courses"
                  className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Lihat semua {allCourses.length} kursus &rarr;
                </Link>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
