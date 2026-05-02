-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MembershipCdk" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL DEFAULT 'GOLD',
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER,
    "usedById" INTEGER
);
INSERT INTO "new_MembershipCdk" ("code", "createdAt", "createdById", "id", "isUsed", "targetRole", "usedAt", "usedById") SELECT "code", "createdAt", "createdById", "id", "isUsed", "targetRole", "usedAt", "usedById" FROM "MembershipCdk";
DROP TABLE "MembershipCdk";
ALTER TABLE "new_MembershipCdk" RENAME TO "MembershipCdk";
CREATE UNIQUE INDEX "MembershipCdk_code_key" ON "MembershipCdk"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
