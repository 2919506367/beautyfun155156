-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GroupMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "groupId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "sharedWorkId" INTEGER,
    "emoticonId" INTEGER,
    "replyToId" INTEGER,
    "readAt" DATETIME,
    "editedAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "mentionText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupChat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupMessage_sharedWorkId_fkey" FOREIGN KEY ("sharedWorkId") REFERENCES "Work" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupMessage_emoticonId_fkey" FOREIGN KEY ("emoticonId") REFERENCES "Emoticon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "GroupMessage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GroupMessage" ("content", "createdAt", "emoticonId", "groupId", "id", "replyToId", "senderId", "sharedWorkId") SELECT "content", "createdAt", "emoticonId", "groupId", "id", "replyToId", "senderId", "sharedWorkId" FROM "GroupMessage";
DROP TABLE "GroupMessage";
ALTER TABLE "new_GroupMessage" RENAME TO "GroupMessage";
CREATE TABLE "new_PrivateMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "sharedWorkId" INTEGER,
    "emoticonId" INTEGER,
    "replyToId" INTEGER,
    "readAt" DATETIME,
    "editedAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "mentionText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrivateMessage_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrivateMessage_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrivateMessage_sharedWorkId_fkey" FOREIGN KEY ("sharedWorkId") REFERENCES "Work" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PrivateMessage_emoticonId_fkey" FOREIGN KEY ("emoticonId") REFERENCES "Emoticon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PrivateMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "PrivateMessage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PrivateMessage" ("content", "createdAt", "emoticonId", "fromUserId", "id", "replyToId", "sharedWorkId", "toUserId") SELECT "content", "createdAt", "emoticonId", "fromUserId", "id", "replyToId", "sharedWorkId", "toUserId" FROM "PrivateMessage";
DROP TABLE "PrivateMessage";
ALTER TABLE "new_PrivateMessage" RENAME TO "PrivateMessage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
