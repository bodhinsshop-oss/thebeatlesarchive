/*
  Warnings:

  - Added the required column `artistId` to the `Album` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "musicbrainzArtistId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Insert The Beatles as the default artist
INSERT INTO "Artist" ("id", "name", "slug", "musicbrainzArtistId", "type", "createdAt", "updatedAt")
VALUES ('beatles-group-id', 'The Beatles', 'the-beatles', 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d', 'group', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mbid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artistId" TEXT NOT NULL DEFAULT 'beatles-group-id',
    "artistCredit" TEXT NOT NULL,
    "firstReleaseDate" TEXT,
    "primaryType" TEXT,
    "secondaryTypes" TEXT,
    "coverArtUrl" TEXT,
    "backCoverArtUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Album_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Album" ("artistId", "artistCredit", "backCoverArtUrl", "coverArtUrl", "createdAt", "firstReleaseDate", "id", "mbid", "primaryType", "secondaryTypes", "title", "updatedAt") 
SELECT 'beatles-group-id', "artistCredit", "backCoverArtUrl", "coverArtUrl", "createdAt", "firstReleaseDate", "id", "mbid", "primaryType", "secondaryTypes", "title", "updatedAt" FROM "Album";
DROP TABLE "Album";
ALTER TABLE "new_Album" RENAME TO "Album";
CREATE UNIQUE INDEX "Album_mbid_key" ON "Album"("mbid");
CREATE INDEX "Album_artistId_idx" ON "Album"("artistId");
CREATE INDEX "Album_primaryType_idx" ON "Album"("primaryType");
CREATE INDEX "Album_firstReleaseDate_idx" ON "Album"("firstReleaseDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Artist_slug_key" ON "Artist"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_musicbrainzArtistId_key" ON "Artist"("musicbrainzArtistId");

-- CreateIndex
CREATE INDEX "Artist_slug_idx" ON "Artist"("slug");

-- CreateIndex
CREATE INDEX "Artist_type_idx" ON "Artist"("type");
