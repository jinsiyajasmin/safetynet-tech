-- AlterTable
ALTER TABLE "SiteSubfolder" ADD COLUMN "monitoringSection" TEXT;

-- CreateIndex
CREATE INDEX "SiteSubfolder_siteId_monitoringSection_idx" ON "SiteSubfolder"("siteId", "monitoringSection");
