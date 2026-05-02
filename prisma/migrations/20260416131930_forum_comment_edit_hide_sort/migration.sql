-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ForumComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "postId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "content" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ForumComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ForumComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ForumComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ForumComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ForumComment" ("content", "createdAt", "id", "parentId", "postId", "userId") SELECT "content", "createdAt", "id", "parentId", "postId", "userId" FROM "ForumComment";
DROP TABLE "ForumComment";
ALTER TABLE "new_ForumComment" RENAME TO "ForumComment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
