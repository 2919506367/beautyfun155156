-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Emoticon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ownerId" INTEGER NOT NULL,
    "label" TEXT,
    "imageUrl" TEXT NOT NULL,
    "copiedFromId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Emoticon_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Emoticon_copiedFromId_fkey" FOREIGN KEY ("copiedFromId") REFERENCES "Emoticon" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Emoticon" ("createdAt", "id", "imageUrl", "label", "ownerId") SELECT "createdAt", "id", "imageUrl", "label", "ownerId" FROM "Emoticon";
DROP TABLE "Emoticon";
ALTER TABLE "new_Emoticon" RENAME TO "Emoticon";
CREATE UNIQUE INDEX "Emoticon_ownerId_copiedFromId_key" ON "Emoticon"("ownerId", "copiedFromId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
