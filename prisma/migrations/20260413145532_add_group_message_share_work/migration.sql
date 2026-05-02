-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GroupMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "groupId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "sharedWorkId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupChat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupMessage_sharedWorkId_fkey" FOREIGN KEY ("sharedWorkId") REFERENCES "Work" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GroupMessage" ("content", "createdAt", "groupId", "id", "senderId") SELECT "content", "createdAt", "groupId", "id", "senderId" FROM "GroupMessage";
DROP TABLE "GroupMessage";
ALTER TABLE "new_GroupMessage" RENAME TO "GroupMessage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
