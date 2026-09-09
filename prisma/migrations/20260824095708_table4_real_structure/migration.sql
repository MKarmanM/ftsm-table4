-- CreateEnum
CREATE TYPE "CourseClassification" AS ENUM ('WU_CITRA_WAJIB', 'WU_CITRA_RENTAS', 'TERAS', 'ELEKTIF', 'AUDIT');

-- CreateEnum
CREATE TYPE "AssessmentPhase" AS ENUM ('CONTINUOUS', 'FINAL');

-- AlterTable
ALTER TABLE "ProformaVersion" ADD COLUMN     "academicStaffNames" TEXT[],
ADD COLUMN     "aiElement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "classification" "CourseClassification",
ADD COLUMN     "classificationDomain" TEXT,
ADD COLUMN     "excelFramework" TEXT[],
ADD COLUMN     "facultyApprovalDate" TIMESTAMP(3),
ADD COLUMN     "futureReadyElements" TEXT[],
ADD COLUMN     "isIndustrialTraining50Elt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offeringRemarks" TEXT,
ADD COLUMN     "prerequisite" TEXT,
ADD COLUMN     "referencesText" TEXT,
ADD COLUMN     "sdgTags" TEXT[],
ADD COLUMN     "semesterOffered" INTEGER,
ADD COLUMN     "senateApprovalDate" TIMESTAMP(3),
ADD COLUMN     "specialRequirements" TEXT,
ADD COLUMN     "synopsisEn" TEXT,
ADD COLUMN     "synopsisMs" TEXT,
ADD COLUMN     "transferableSkills" TEXT[],
ADD COLUMN     "yearOffered" INTEGER;

-- CreateTable
CREATE TABLE "ProgrammePlo" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "textMs" TEXT NOT NULL,
    "textEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgrammePlo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseLearningOutcome" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "textMs" TEXT NOT NULL,
    "textEn" TEXT,
    "teachingMethods" TEXT,
    "assessmentMethods" TEXT,
    "mqfClusters" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseLearningOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloPloMapping" (
    "id" TEXT NOT NULL,
    "cloId" TEXT NOT NULL,
    "programmePloId" TEXT NOT NULL,

    CONSTRAINT "CloPloMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseTopic" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "topicMs" TEXT NOT NULL,
    "topicEn" TEXT,
    "cloRef" TEXT,
    "hours" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentItem" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "phase" "AssessmentPhase" NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "nameMs" TEXT NOT NULL,
    "nameEn" TEXT,
    "weightagePercent" DECIMAL(5,2),
    "hours" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgrammePlo_programmeId_idx" ON "ProgrammePlo"("programmeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammePlo_programmeId_orderNumber_key" ON "ProgrammePlo"("programmeId", "orderNumber");

-- CreateIndex
CREATE INDEX "CourseLearningOutcome_versionId_idx" ON "CourseLearningOutcome"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseLearningOutcome_versionId_orderIndex_key" ON "CourseLearningOutcome"("versionId", "orderIndex");

-- CreateIndex
CREATE INDEX "CloPloMapping_programmePloId_idx" ON "CloPloMapping"("programmePloId");

-- CreateIndex
CREATE UNIQUE INDEX "CloPloMapping_cloId_programmePloId_key" ON "CloPloMapping"("cloId", "programmePloId");

-- CreateIndex
CREATE INDEX "CourseTopic_versionId_idx" ON "CourseTopic"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseTopic_versionId_orderIndex_key" ON "CourseTopic"("versionId", "orderIndex");

-- CreateIndex
CREATE INDEX "AssessmentItem_versionId_idx" ON "AssessmentItem"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentItem_versionId_phase_orderIndex_key" ON "AssessmentItem"("versionId", "phase", "orderIndex");

-- AddForeignKey
ALTER TABLE "ProgrammePlo" ADD CONSTRAINT "ProgrammePlo_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseLearningOutcome" ADD CONSTRAINT "CourseLearningOutcome_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ProformaVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloPloMapping" ADD CONSTRAINT "CloPloMapping_cloId_fkey" FOREIGN KEY ("cloId") REFERENCES "CourseLearningOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloPloMapping" ADD CONSTRAINT "CloPloMapping_programmePloId_fkey" FOREIGN KEY ("programmePloId") REFERENCES "ProgrammePlo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTopic" ADD CONSTRAINT "CourseTopic_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ProformaVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentItem" ADD CONSTRAINT "AssessmentItem_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ProformaVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
