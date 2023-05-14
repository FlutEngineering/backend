-- CreateTable
CREATE TABLE "playlists" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v1mc(),
    "title" VARCHAR(30) NOT NULL,
    "slug" TEXT NOT NULL,
    "userId" VARCHAR(42) NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlists_tracks" (
    "trackId" UUID NOT NULL,
    "playlistId" UUID NOT NULL,

    CONSTRAINT "playlists_tracks_pkey" PRIMARY KEY ("trackId","playlistId")
);

-- CreateIndex
CREATE UNIQUE INDEX "playlists_userId_slug_key" ON "playlists"("userId", "slug");

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists_tracks" ADD CONSTRAINT "playlists_tracks_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists_tracks" ADD CONSTRAINT "playlists_tracks_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
