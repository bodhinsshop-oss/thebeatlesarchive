-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mbid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artistCredit" TEXT NOT NULL,
    "firstReleaseDate" TEXT,
    "primaryType" TEXT,
    "secondaryTypes" TEXT,
    "coverArtUrl" TEXT,
    "backCoverArtUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "albumId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "length" INTEGER,
    CONSTRAINT "Track_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "albumId" TEXT NOT NULL,
    "mbid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT,
    "country" TEXT,
    "label" TEXT,
    "catalogNum" TEXT,
    "format" TEXT,
    CONSTRAINT "Release_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Album_mbid_key" ON "Album"("mbid");

-- CreateIndex
CREATE INDEX "Album_primaryType_idx" ON "Album"("primaryType");

-- CreateIndex
CREATE INDEX "Album_firstReleaseDate_idx" ON "Album"("firstReleaseDate");

-- CreateIndex
CREATE INDEX "Track_albumId_idx" ON "Track"("albumId");

-- CreateIndex
CREATE UNIQUE INDEX "Release_mbid_key" ON "Release"("mbid");

-- CreateIndex
CREATE INDEX "Release_albumId_idx" ON "Release"("albumId");
