/*
  Warnings:

  - A unique constraint covering the columns `[telegramChatId,telegramMessageId]` on the table `ForumPost` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ForumPost" ADD COLUMN "importedAt" DATETIME;
ALTER TABLE "ForumPost" ADD COLUMN "importedFrom" TEXT;
ALTER TABLE "ForumPost" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "ForumPost" ADD COLUMN "telegramGroupedId" TEXT;
ALTER TABLE "ForumPost" ADD COLUMN "telegramMessageId" INTEGER;
ALTER TABLE "ForumPost" ADD COLUMN "telegramPostUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ForumPost_telegramChatId_telegramMessageId_key" ON "ForumPost"("telegramChatId", "telegramMessageId");
