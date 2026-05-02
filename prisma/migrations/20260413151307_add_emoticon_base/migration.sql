-- CreateTable
CREATE TABLE "Emoticon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ownerId" INTEGER NOT NULL,
    "label" TEXT,
    "imageUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Emoticon_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "emoticonId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "workId" INTEGER NOT NULL,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_emoticonId_fkey" FOREIGN KEY ("emoticonId") REFERENCES "Emoticon" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("content", "createdAt", "id", "userId", "workId") SELECT "content", "createdAt", "id", "userId", "workId" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE TABLE "new_GroupMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "groupId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "sharedWorkId" INTEGER,
    "emoticonId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupChat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupMessage_sharedWorkId_fkey" FOREIGN KEY ("sharedWorkId") REFERENCES "Work" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupMessage_emoticonId_fkey" FOREIGN KEY ("emoticonId") REFERENCES "Emoticon" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GroupMessage" ("content", "createdAt", "groupId", "id", "senderId", "sharedWorkId") SELECT "content", "createdAt", "groupId", "id", "senderId", "sharedWorkId" FROM "GroupMessage";
DROP TABLE "GroupMessage";
ALTER TABLE "new_GroupMessage" RENAME TO "GroupMessage";
CREATE TABLE "new_PrivateMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "sharedWorkId" INTEGER,
    "emoticonId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrivateMessage_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrivateMessage_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrivateMessage_sharedWorkId_fkey" FOREIGN KEY ("sharedWorkId") REFERENCES "Work" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PrivateMessage_emoticonId_fkey" FOREIGN KEY ("emoticonId") REFERENCES "Emoticon" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PrivateMessage" ("content", "createdAt", "fromUserId", "id", "sharedWorkId", "toUserId") SELECT "content", "createdAt", "fromUserId", "id", "sharedWorkId", "toUserId" FROM "PrivateMessage";
DROP TABLE "PrivateMessage";
ALTER TABLE "new_PrivateMessage" RENAME TO "PrivateMessage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
