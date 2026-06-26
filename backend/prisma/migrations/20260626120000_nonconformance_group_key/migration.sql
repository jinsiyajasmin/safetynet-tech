-- AlterTable
ALTER TABLE "NonconformanceAction" ADD COLUMN IF NOT EXISTS "groupKey" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NonconformanceAction_groupKey_createdAt_idx" ON "NonconformanceAction"("groupKey", "createdAt");
