import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { S3 } from "@aws-sdk/client-s3";
import { generateThumbnail } from "~/services/images";
import {
  ASSETS_PATH,
  S3_API_KEY,
  S3_API_SECRET,
  S3_BUCKET_NAME,
  S3_ENDPOINT_URL,
} from "~/config";

const client = new S3({
  endpoint: S3_ENDPOINT_URL,
  credentials: {
    accessKeyId: S3_API_KEY,
    secretAccessKey: S3_API_SECRET,
  },
  region: "us-west-2",
});

const prisma = new PrismaClient();

async function main() {
  const images = await prisma.track
    .findMany({
      where: {},
      select: { image: true },
    })
    .then((tracks) => tracks.map((track) => track.image));

  const bucketObjects = await client.listObjects({ Bucket: S3_BUCKET_NAME });
  if (!bucketObjects.Contents) return "No content in the bucket";

  const keys: Record<string, string> = {};
  for (const object of bucketObjects.Contents) {
    if (object.ETag && object.Key) {
      keys[object.ETag.slice(1, -1)] = object.Key;
    }
  }

  for (const cid of images) {
    const filename = `${ASSETS_PATH}/thumbnails/${cid}_160.jpg`;
    const key = keys[cid];

    if (!key) {
      console.log("👾", `Key not found: ${cid}`);
      continue;
    }

    if (fs.existsSync(filename)) {
      console.log("👾", `Skipping existing: ${cid}`);
      continue;
    }

    const file = await client.getObject({
      Key: key,
      Bucket: S3_BUCKET_NAME,
    });
    const data = await file.Body?.transformToByteArray();
    if (data) {
      console.log("👾", `Generating thumbnail for ${cid}...`);
      await generateThumbnail(Buffer.from(data), cid);
    }
  }
  console.log("👾", "Done.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })

  .catch(async (e) => {
    console.error(e);

    await prisma.$disconnect();

    process.exit(1);
  });
