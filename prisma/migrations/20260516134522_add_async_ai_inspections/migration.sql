-- CreateEnum
CREATE TYPE "AiInspectionRunStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AiClassification" AS ENUM ('APPROVED', 'MANUAL_REVIEW', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'INSPECTION_AI_QUEUED';
ALTER TYPE "EventType" ADD VALUE 'INSPECTION_AI_STARTED';
ALTER TYPE "EventType" ADD VALUE 'INSPECTION_AI_COMPLETED';
ALTER TYPE "EventType" ADD VALUE 'INSPECTION_AI_FAILED';
ALTER TYPE "EventType" ADD VALUE 'INSPECTION_CERTIFICATION_REQUESTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WashOrderStatus" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "WashOrderStatus" ADD VALUE 'REJECTED_PENDING_INFO';
ALTER TYPE "WashOrderStatus" ADD VALUE 'APPROVED';
ALTER TYPE "WashOrderStatus" ADD VALUE 'PREPARATION';
ALTER TYPE "WashOrderStatus" ADD VALUE 'CLEANING';
ALTER TYPE "WashOrderStatus" ADD VALUE 'DRYING';
ALTER TYPE "WashOrderStatus" ADD VALUE 'PRE_INSPECTION';
ALTER TYPE "WashOrderStatus" ADD VALUE 'IA_REVIEW';
ALTER TYPE "WashOrderStatus" ADD VALUE 'PENDING_CERTIFICATION';

-- CreateTable
CREATE TABLE "ai_inspection_runs" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "washOrderId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" "AiInspectionRunStatus" NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "model" TEXT,
    "score" INTEGER,
    "classification" "AiClassification",
    "summary" TEXT,
    "findingsJson" JSONB,
    "risksJson" JSONB,
    "rawResponse" JSONB,
    "errorMessage" TEXT,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correlationId" TEXT,
    "evidenceHash" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_inspection_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_inspection_runs_inspectionId_createdAt_idx" ON "ai_inspection_runs"("inspectionId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_inspection_runs_washOrderId_createdAt_idx" ON "ai_inspection_runs"("washOrderId", "createdAt");

-- AddForeignKey
ALTER TABLE "ai_inspection_runs" ADD CONSTRAINT "ai_inspection_runs_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_inspection_runs" ADD CONSTRAINT "ai_inspection_runs_washOrderId_fkey" FOREIGN KEY ("washOrderId") REFERENCES "wash_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_inspection_runs" ADD CONSTRAINT "ai_inspection_runs_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
