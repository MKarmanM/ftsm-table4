-- Normalize CourseTopic -> CLO references.
-- Keep CourseTopic.cloRef temporarily for backward compatibility; new application
-- writes use TopicCloMapping and legacy data is backfilled below.

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
-- the same ProformaVersion. Invalid/stale legacy strings are intentionally skipped.
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
