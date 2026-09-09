-- CourseLearningOutcome: merge textMs/textEn into a single "text" column,
-- preserving existing data (Ms content kept, En content dropped).
ALTER TABLE "CourseLearningOutcome" ADD COLUMN "text" TEXT;
UPDATE "CourseLearningOutcome" SET "text" = "textMs";
ALTER TABLE "CourseLearningOutcome" ALTER COLUMN "text" SET NOT NULL;
ALTER TABLE "CourseLearningOutcome" DROP COLUMN "textMs";
ALTER TABLE "CourseLearningOutcome" DROP COLUMN "textEn";

-- ProformaVersion: merge synopsisMs/synopsisEn into a single "synopsis"
-- column, preserving existing data.
ALTER TABLE "ProformaVersion" ADD COLUMN "synopsis" TEXT;
UPDATE "ProformaVersion" SET "synopsis" = "synopsisMs";
ALTER TABLE "ProformaVersion" DROP COLUMN "synopsisMs";
ALTER TABLE "ProformaVersion" DROP COLUMN "synopsisEn";