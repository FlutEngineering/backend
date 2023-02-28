-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "Audio" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v1mc(),
    "cid" TEXT NOT NULL,
    "title" VARCHAR(30) NOT NULL,
    "artistAddress" VARCHAR(42) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Audio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "address" VARCHAR(42) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Tag" (
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("name")
);

-- AddForeignKey
ALTER TABLE "Audio" ADD CONSTRAINT "Audio_artistAddress_fkey" FOREIGN KEY ("artistAddress") REFERENCES "User"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
