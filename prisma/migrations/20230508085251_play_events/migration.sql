/*
  Warnings:

  - You are about to drop the column `playCount` on the `tracks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tracks" DROP COLUMN "playCount";

-- CreateTable
CREATE TABLE "play_events" (
    "userId" VARCHAR(42) NOT NULL,
    "trackId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "play_events_pkey" PRIMARY KEY ("userId","trackId","createdAt")
);

-- AddForeignKey
ALTER TABLE "play_events" ADD CONSTRAINT "play_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "play_events" ADD CONSTRAINT "play_events_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
