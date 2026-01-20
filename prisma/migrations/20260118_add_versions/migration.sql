-- CreateTable
CREATE TABLE "Work" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mbReleaseGroupId" TEXT NOT NULL,
    "discogsMainId" TEXT,
    "discogsUrl" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "firstReleaseDate" TEXT,
    "artistId" TEXT NOT NULL,
    "primaryImageUrl" TEXT,
    "tracklistJson" TEXT,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Work_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Version" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mbReleaseId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "discogsReleaseId" TEXT,
    "discogsUrl" TEXT,
    "discogsMarketplaceUrl" TEXT,
    "country" TEXT,
    "releaseDate" TEXT,
    "formatJson" TEXT,
    "labelsJson" TEXT,
    "identifiersJson" TEXT,
    "notes" TEXT,
    "imageUrlsJson" TEXT,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Version_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MappingAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "mbid" TEXT NOT NULL,
    "discogsId" TEXT,
    "matchConfidence" REAL NOT NULL,
    "matchMethod" TEXT NOT NULL,
    "matchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Work_mbReleaseGroupId_key" ON "Work"("mbReleaseGroupId");

-- CreateIndex
CREATE INDEX "Work_artistId_idx" ON "Work"("artistId");

-- CreateIndex
CREATE INDEX "Work_discogsMainId_idx" ON "Work"("discogsMainId");

-- CreateIndex
CREATE UNIQUE INDEX "Version_mbReleaseId_key" ON "Version"("mbReleaseId");

-- CreateIndex
CREATE INDEX "Version_workId_idx" ON "Version"("workId");

-- CreateIndex
CREATE INDEX "Version_discogsReleaseId_idx" ON "Version"("discogsReleaseId");

-- CreateIndex
CREATE INDEX "MappingAudit_mbid_idx" ON "MappingAudit"("mbid");

-- CreateIndex
CREATE INDEX "MappingAudit_discogsId_idx" ON "MappingAudit"("discogsId");
