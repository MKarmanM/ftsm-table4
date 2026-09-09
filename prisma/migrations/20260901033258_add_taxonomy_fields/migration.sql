-- CreateEnum
CREATE TYPE "TaxonomyDomain" AS ENUM ('KOGNITIF', 'AFEKTIF', 'PSIKOMOTOR');

-- AlterTable
ALTER TABLE "CourseLearningOutcome" ADD COLUMN     "taxonomyDomain" "TaxonomyDomain",
ADD COLUMN     "taxonomyLevel" INTEGER;
