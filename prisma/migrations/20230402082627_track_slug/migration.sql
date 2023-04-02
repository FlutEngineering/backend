/*
  Warnings:

  - A unique constraint covering the columns `[artistAddress,slug]` on the table `tracks` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tracks_artistAddress_slug_key" ON "tracks"("artistAddress", "slug");
