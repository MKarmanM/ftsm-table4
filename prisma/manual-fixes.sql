-- ============================================================================
-- Manual additions — Prisma's schema.prisma DSL cannot express partial
-- (WHERE-clause) unique indexes, so these are written by hand and appended
-- to the generated migration.sql. See setup instructions below the SQL.
-- ============================================================================

-- 1. Only one PUBLISHED version per course.
--    Without this, a race condition (two publish actions firing near-
--    simultaneously) or an application bug could leave two versions of the
--    same course both marked PUBLISHED, with nothing in the database to
--    stop it.
CREATE UNIQUE INDEX "one_published_version_per_course"
ON "ProformaVersion" ("courseId")
WHERE "status" = 'PUBLISHED';

-- 2. UserRole: NULL-safe uniqueness for faculty-wide roles.
--    @@unique([userId, role, programmeId]) in schema.prisma does NOT stop
--    duplicates when programmeId is NULL, because Postgres treats every
--    NULL as distinct from every other NULL. That constraint only protects
--    programme-scoped roles (e.g. two PROGRAMME_COORDINATOR rows for the
--    same user at the same programme). This index closes the gap for
--    faculty-wide roles (ADMIN, FACULTY_OFFICER, LECTURER without a
--    programme attached).
CREATE UNIQUE INDEX "unique_user_role_when_no_programme"
ON "UserRole" ("userId", "role")
WHERE "programmeId" IS NULL;
