-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PrivateMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "sharedWorkId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrivateMessage_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrivateMessage_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrivateMessage_sharedWorkId_fkey" FOREIGN KEY ("sharedWorkId") REFERENCES "Work" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PrivateMessage" ("content", "createdAt", "fromUserId", "id", "toUserId") SELECT "content", "createdAt", "fromUserId", "id", "toUserId" FROM "PrivateMessage";
DROP TABLE "PrivateMessage";
ALTER TABLE "new_PrivateMessage" RENAME TO "PrivateMessage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
