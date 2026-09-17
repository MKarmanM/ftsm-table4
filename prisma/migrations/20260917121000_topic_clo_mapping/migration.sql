-- Normalize CourseTopic -> CLO references.
-- Keep CourseTopic.cloRef temporarily for backward compatibility while all
-- existing UI paths migrate to the relation table.

CREATE TABLE "TopicCloMapping" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "cloId" TEXT NOT NULL,
    CONSTRAINT "TopicCloMapping_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TopicCloMapping_topicId_cloId_key"
ON "TopicCloMapping"("topicId", "cloId");

CREATE INDEX "TopicCloMapping_cloId_idx"
ON "TopicCloMapping"("cloId");

ALTER TABLE "TopicCloMapping"
ADD CONSTRAINT "TopicCloMapping_topicId_fkey"
FOREIGN KEY ("topicId") REFERENCES "CourseTopic"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TopicCloMapping"
ADD CONSTRAINT "TopicCloMapping_cloId_fkey"
FOREIGN KEY ("cloId") REFERENCES "CourseLearningOutcome"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill legacy values such as CLO1, CLO2, ... by resolving the CLO within
-- the same ProformaVersion. Invalid/stale legacy strings are skipped.
INSERT INTO "TopicCloMapping" ("id", "topicId", "cloId")
SELECT
  'legacy_' || md5(t."id" || ':' || c."id"),
  t."id",
  c."id"
FROM "CourseTopic" t
JOIN "CourseLearningOutcome" c
  ON c."versionId" = t."versionId"
 AND ('CLO' || c."orderIndex"::text) = t."cloRef"
WHERE t."cloRef" IS NOT NULL
ON CONFLICT ("topicId", "cloId") DO NOTHING;

-- Compatibility trigger: current forms still post a single legacy cloRef.
-- Until those forms are fully migrated, mirror each write into the relational
-- table so referential data remains authoritative and cannot drift.
CREATE OR REPLACE FUNCTION sync_course_topic_clo_mapping()
RETURNS trigger AS $$
DECLARE
  resolved_clo_id TEXT;
BEGIN
  DELETE FROM "TopicCloMapping" WHERE "topicId" = NEW."id";

  IF NEW."cloRef" IS NOT NULL AND NEW."cloRef" <> '' THEN
    SELECT c."id"
      INTO resolved_clo_id
      FROM "CourseLearningOutcome" c
     WHERE c."versionId" = NEW."versionId"
       AND ('CLO' || c."orderIndex"::text) = NEW."cloRef"
     LIMIT 1;

    IF resolved_clo_id IS NOT NULL THEN
      INSERT INTO "TopicCloMapping" ("id", "topicId", "cloId")
      VALUES ('sync_' || md5(NEW."id" || ':' || resolved_clo_id), NEW."id", resolved_clo_id)
      ON CONFLICT ("topicId", "cloId") DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "CourseTopic_sync_clo_mapping"
AFTER INSERT OR UPDATE OF "cloRef" ON "CourseTopic"
FOR EACH ROW EXECUTE FUNCTION sync_course_topic_clo_mapping();
