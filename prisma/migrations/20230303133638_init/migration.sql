-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "tracks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v1mc(),
    "cid" TEXT NOT NULL,
    "title" VARCHAR(30) NOT NULL,
    "artistAddress" VARCHAR(42) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "address" VARCHAR(42) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "tags" (
    "name" VARCHAR(20) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "tracks_tags" (
    "trackId" UUID NOT NULL,
    "tagName" VARCHAR(20) NOT NULL,

    CONSTRAINT "tracks_tags_pkey" PRIMARY KEY ("trackId","tagName")
);

-- CreateIndex
CREATE UNIQUE INDEX "tracks_artistAddress_title_key" ON "tracks"("artistAddress", "title");

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_artistAddress_fkey" FOREIGN KEY ("artistAddress") REFERENCES "users"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks_tags" ADD CONSTRAINT "tracks_tags_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks_tags" ADD CONSTRAINT "tracks_tags_tagName_fkey" FOREIGN KEY ("tagName") REFERENCES "tags"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
