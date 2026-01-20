-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mbid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
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
INSERT INTO "new_Album" ("artistCredit", "artistId", "backCoverArtUrl", "coverArtUrl", "createdAt", "firstReleaseDate", "id", "mbid", "primaryType", "secondaryTypes", "title", "updatedAt") SELECT "artistCredit", "artistId", "backCoverArtUrl", "coverArtUrl", "createdAt", "firstReleaseDate", "id", "mbid", "primaryType", "secondaryTypes", "title", "updatedAt" FROM "Album";
DROP TABLE "Album";
ALTER TABLE "new_Album" RENAME TO "Album";
CREATE UNIQUE INDEX "Album_mbid_key" ON "Album"("mbid");
CREATE INDEX "Album_artistId_idx" ON "Album"("artistId");
CREATE INDEX "Album_primaryType_idx" ON "Album"("primaryType");
CREATE INDEX "Album_firstReleaseDate_idx" ON "Album"("firstReleaseDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
