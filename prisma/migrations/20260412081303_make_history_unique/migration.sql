-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ViewHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "workId" INTEGER NOT NULL,
    "viewedAt" DATETIME NOT NULL,
    CONSTRAINT "ViewHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViewHistory_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ViewHistory" ("id", "userId", "viewedAt", "workId") SELECT "id", "userId", "viewedAt", "workId" FROM "ViewHistory";
DROP TABLE "ViewHistory";
ALTER TABLE "new_ViewHistory" RENAME TO "ViewHistory";
CREATE UNIQUE INDEX "ViewHistory_userId_workId_key" ON "ViewHistory"("userId", "workId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
