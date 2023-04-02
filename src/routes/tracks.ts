import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import express from "express";
import multer from "multer";
import slugify from "slugify";
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

router.use((req, res, next) =>
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File too large" });
      } else {
        return res.status(400).json({ error: err.message });
      }
    } else if (err) {
      return res.status(400).json({ error: "Upload error" });
    }
    next();
  })
);

router.get("/", async (req, res) => {
  const tag = Array.isArray(req.query.tag)
    ? req.query.tag.at(0)
    : req.query.tag;

  const artist = Array.isArray(req.query.artist)
    ? req.query.artist.at(0)
    : req.query.artist;

  await prisma.track
    .findMany({
      where: {
        tags: tag ? { some: { tag: { name: tag } } } : undefined,
        artistAddress: artist,
      },
      select: {
        audio: true,
        image: true,
        title: true,
        artistAddress: true,
        tags: true,
      },
    })
    .then((tracks) => tracks.map(tagsToArray))
    .then((tracks) => {
      return res.status(200).json({ tracks });
    })
    .catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        console.log(`Prisma Error ${e.code}: ${e.message}`);
        return res.status(400).json({ error: "Track list request error" });
      } else {
        console.log(e);
        return res.status(400).json({ error: "Unknown Error" });
      }
    });
});

router.post("/", async (req, res) => {
  // Auth
  // ========================================
  const address = req.session.siwe?.address;

  if (!address) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // ========================================

  const files = req.files as {
    readonly [fieldname: string]: readonly Express.Multer.File[];
  };
  const { body } = req;

  // Validation
  // ========================================
  // TODO: generate zod schema from prisma
  if (!files?.audio?.length) {
    console.log("👾", "files =>", files);
    return res.status(400).json({ error: "Audio is required" });
  }

  if (!files?.image?.length) {
    console.log("👾", "files =>", files);
    return res.status(400).json({ error: "Image is required" });
  }

  if (
    !body.title ||
    !Array.isArray(body.tags) ||
    (body.tags as readonly string[]).length < 3
  ) {
    console.log("👾", "body =>", body);
    return res.status(400).json({
      error: "Invalid data",
    });
  }

  const { title } = body;
  const slug = slugify(title, { lower: true, strict: true });
  const tags = (body.tags as readonly string[]).map((tag: string) =>
    tag.trim().toLowerCase()
  );

  const audio = files.audio[0];
  const image = files.image[0];

  if (!AUDIO_MIMETYPES.includes(audio.mimetype)) {
    return res
      .status(415)
      .json({ error: `${audio.mimetype} is not supported` });
  }

  if (!IMAGE_MIMETYPES.includes(image.mimetype)) {
    return res
      .status(415)
      .json({ error: `${image.mimetype} is not supported` });
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

  const cids = await ipfs.upload(audioData, imageData);

  await prisma.track
    .create({
      data: {
        audio: cids.audio,
        image: cids.image,
        title,
        slug,
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
        audio: true,
        image: true,
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
          return res.status(400).json({ error: "Track already exists" });
        } else {
          // TODO: add logger
          console.log(`Prisma Error ${e.code}: ${e.message}`);
          return res.status(400).json({ error: "Track submitting error" });
        }
      } else {
        console.log(e);
        return res.status(400).json({ error: "Unknown Error" });
      }
    });
});

export default router;
