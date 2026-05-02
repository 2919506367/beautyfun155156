-- CreateTable
CREATE TABLE "RegisterInviteCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER,
    "usedById" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "RegisterInviteCode_code_key" ON "RegisterInviteCode"("code");
