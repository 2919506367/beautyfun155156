-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ForumPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverUrl" TEXT,
    "mediaCount" INTEGER NOT NULL DEFAULT 0,
    "ageRating" TEXT NOT NULL DEFAULT 'ALL_AGES',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" INTEGER NOT NULL,
    CONSTRAINT "ForumPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ForumPost" ("ageRating", "authorId", "content", "createdAt", "id", "isPinned", "title", "updatedAt") SELECT "ageRating", "authorId", "content", "createdAt", "id", "isPinned", "title", "updatedAt" FROM "ForumPost";
DROP TABLE "ForumPost";
ALTER TABLE "new_ForumPost" RENAME TO "ForumPost";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
