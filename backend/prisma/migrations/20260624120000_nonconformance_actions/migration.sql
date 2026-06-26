-- CreateEnum
CREATE TYPE "NonconformanceStatus" AS ENUM ('pending', 'draft', 'sent');

-- CreateTable
CREATE TABLE "NonconformanceAction" (
    "id" TEXT NOT NULL,
    "formResponseId" TEXT,
    "assigneeId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "NonconformanceStatus" NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "correctionAction" TEXT NOT NULL DEFAULT '',
    "responsibleEmail" TEXT,
    "responsibleName" TEXT,
    "dateCompleted" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "responseNotes" TEXT,
    "draftData" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NonconformanceAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NonconformanceAction_assigneeId_status_idx" ON "NonconformanceAction"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "NonconformanceAction_reporterId_idx" ON "NonconformanceAction"("reporterId");

-- CreateIndex
CREATE INDEX "NonconformanceAction_clientId_idx" ON "NonconformanceAction"("clientId");

-- CreateIndex
CREATE INDEX "UserNotification_userId_read_idx" ON "UserNotification"("userId", "read");

-- CreateIndex
CREATE INDEX "UserNotification_userId_createdAt_idx" ON "UserNotification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "NonconformanceAction" ADD CONSTRAINT "NonconformanceAction_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonconformanceAction" ADD CONSTRAINT "NonconformanceAction_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
