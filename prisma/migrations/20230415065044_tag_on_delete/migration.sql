-- DropForeignKey
ALTER TABLE "tracks_tags" DROP CONSTRAINT "tracks_tags_tagName_fkey";

-- DropForeignKey
ALTER TABLE "tracks_tags" DROP CONSTRAINT "tracks_tags_trackId_fkey";

-- AddForeignKey
ALTER TABLE "tracks_tags" ADD CONSTRAINT "tracks_tags_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks_tags" ADD CONSTRAINT "tracks_tags_tagName_fkey" FOREIGN KEY ("tagName") REFERENCES "tags"("name") ON DELETE CASCADE ON UPDATE CASCADE;
