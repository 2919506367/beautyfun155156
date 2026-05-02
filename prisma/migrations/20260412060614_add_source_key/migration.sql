/*
  Warnings:

  - A unique constraint covering the columns `[sourceKey]` on the table `Work` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Work" ADD COLUMN "sourceKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Work_sourceKey_key" ON "Work"("sourceKey");
