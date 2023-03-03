import path from "node:path";
import express from "express";
import multer from "multer";
import { PrismaClient, Prisma } from "@prisma/client";
import * as ipfs from "~/services/ipfs";
import { tagsToArray } from "~/utils";

const AUDIO_MIMETYPES = [
  "audio/aac",
  "audio/mpeg",
  "audio/ogg",
  "audio/opus",
  "audio/wav",
  "audio/webm",
];

const IMAGE_MIMETYPES = ["image/jpeg", "image/png"];

const prisma = new PrismaClient();
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10mb
  },
});

const uploadMiddleware = upload.fields([
  { name: "audio", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

const router = express.Router();

router.use(uploadMiddleware);

router.get("/", async (_req, res) => {
  await prisma.track
    .findMany({
      select: {
        cid: true,
        title: true,
        artistAddress: true,
        tags: true,
      },
    })
    .then((tracks) => tracks.map(tagsToArray))
    .then((tracks) => {
      return res.status(200).json({ tracks: tracks.map(tagsToArray) });
    })
    .catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        console.log(`Prisma Error ${e.code}: ${e.message}`);
        return res.status(400).json({ message: "Track list request error" });
      } else {
        console.log(e);
        return res.status(400).json({ message: "Unknown Error" });
      }
    });
});

router.post("/", async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const { body } = req;

  // Validation
  // ========================================
  // TODO: generate zod schema from prisma
  if (!files?.audio?.length) {
    return res.status(400).json({ error: "Audio is required" });
  }

  if (!files?.image?.length) {
    return res.status(400).json({ error: "Image is required" });
  }

  if (
    !body.address ||
    !body.title ||
    !Array.isArray(body.tags) ||
    !((body.tags as string[]).length < 3)
  ) {
    return res.status(400).json({
      message: "Invalid data",
    });
  }

  const { title, address } = body;
  const tags = (body.tags as string[]).map((tag: string) =>
    tag.trim().toLowerCase()
  );

  const audio = files.audio[0];
  const image = files.image[0];

  if (!AUDIO_MIMETYPES.includes(audio.mimetype)) {
    return res
      .status(415)
      .json({ message: `${audio.mimetype} is not supported` });
  }

  if (!IMAGE_MIMETYPES.includes(image.mimetype)) {
    return res
      .status(415)
      .json({ message: `${image.mimetype} is not supported` });
  }
  // ========================================

  const audioFilename = `audio${path.extname(audio.originalname)}`;
  const imageFilename = `image${path.extname(image.originalname)}`;

  const audioData = {
    buffer: audio.buffer,
    filename: audioFilename,
    mimetype: audio.mimetype,
  };

  const imageData = {
    buffer: image.buffer,
    filename: imageFilename,
    mimetype: image.mimetype,
  };

  const cid = await ipfs.upload(audioData, imageData);

  await prisma.track
    .create({
      data: {
        cid,
        title,
        tags: {
          create: tags.map((tag) => ({
            tag: {
              connectOrCreate: {
                create: { name: tag },
                where: { name: tag },
              },
            },
          })),
        },
        artist: {
          connectOrCreate: {
            create: { address },
            where: { address },
          },
        },
      },
      select: {
        cid: true,
        title: true,
        artistAddress: true,
        tags: true,
      },
    })
    .then(tagsToArray)
    .then((track) => {
      return res.status(200).json(track);
    })
    .catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2002") {
          return res.status(400).json({ message: "Track already exists" });
        } else {
          // TODO: add logger
          console.log(`Prisma Error ${e.code}: ${e.message}`);
          return res.status(400).json({ message: "Track submitting error" });
        }
      } else {
        console.log(e);
        return res.status(400).json({ message: "Unknown Error" });
      }
    });
});

export default router;
