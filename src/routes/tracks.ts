import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import express from "express";
import multer from "multer";
import { json as jsonParser } from "body-parser";
import slugify from "slugify";
import * as ipfs from "~/services/ipfs";
import { countRelations, collectTags } from "~/utils";
import isAuthorized from "~/middlewares/isAuthorized";
import isAddress from "~/middlewares/isAddress";

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

router.use(jsonParser());

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
        id: true,
        audio: true,
        image: true,
        title: true,
        slug: true,
        artistAddress: true,
        tags: true,
        createdAt: true,
        _count: { select: { playEvents: true } },
       
      },
    })
    .then((tracks) => tracks.map(collectTags))
    .then((tracks) => tracks.map(countRelations("playEvents", "playCount")))
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

router.get("/:address/:slug", isAddress, async (req, res) => {
  const { address, slug } = req.params;

  await prisma.track
    .findUniqueOrThrow({
      where: {
        artistAddress_slug: { artistAddress: address, slug },
      },
      select: {
        id: true,
        audio: true,
        image: true,
        title: true,
        slug: true,
        artistAddress: true,
        tags: true,
        _count: { select: { playEvents: true } },
      },
    })
    .then(collectTags)
    .then(countRelations("playEvents", "playCount"))
    .then((track) => {
      return res.status(200).json({ track });
    })
    .catch((e) => {
      if (e.code === "P2025") {
        return res.status(404).json({ error: "Track not found" });
      } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
        console.log(`Prisma Error ${e.code}: ${e.message}`);
        return res.status(400).json({ error: "Track request error" });
      } else {
        console.log(e);
        return res.status(400).json({ error: "Unknown Error" });
      }
    });
});

router.post("/", isAuthorized, async (req, res) => {
  const address = res.locals.address;

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
                where: { name: tag },
                create: { name: tag },
              },
            },
          })),
        },
        artist: {
          connectOrCreate: {
            where: { address },
            create: { address },
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
    .then(collectTags)
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

router.put("/:address/:slug", isAddress, isAuthorized, async (req, res) => {
  const { address, slug } = req.params;
  const { body } = req;
  console.log("🐌", slug);
  if (address !== res.locals.address) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Validation
  // ========================================
  if (Array.isArray(body.tags) && (body.tags as readonly string[]).length < 3) {
    console.log("👾", "body =>", body);
    return res.status(400).json({
      error: "Invalid data",
    });
  }
  // ========================================

  const title = body.title;
  const newSlug = body.title && slugify(title, { lower: true, strict: true });
  const newTags = (body.tags as readonly string[]).map((tag: string) =>
    tag.trim().toLowerCase()
  );

  await prisma.$transaction(async () => {
    try {
      // Delete old tags
      if (newTags.length) {
        await prisma.tagsOnTracks.deleteMany({
          where: { track: { artistAddress: address, slug } },
        });
      }

      const updatedTrack = await prisma.track
        .update({
          where: {
            artistAddress_slug: { artistAddress: address, slug },
          },
          data: {
            title,
            slug: newSlug,
            tags: newTags.length
              ? {
                  create: newTags.map((tag) => ({
                    tag: {
                      connectOrCreate: {
                        where: { name: tag },
                        create: { name: tag },
                      },
                    },
                  })),
                }
              : undefined,
          },
          select: {
            audio: true,
            image: true,
            title: true,
            slug: true,
            artistAddress: true,
            tags: true,
            _count: { select: { playEvents: true } },
          },
        })
        .then(collectTags)
        .then(countRelations("playEvents", "playCount"));

      return res.status(200).json({ ok: true, track: updatedTrack });
    } catch (e: any) {
      if (e.code === "P2025") {
        return res.status(404).json({ error: "Track not found" });
      } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
        console.log(`Prisma Error ${e.code}: ${e.message}`);
        return res.status(400).json({ error: "Track updating error" });
      } else {
        console.log(e);
        return res.status(400).json({ error: "Unknown Error" });
      }
    }
  });
});

router.delete("/:address/:slug", isAddress, isAuthorized, async (req, res) => {
  const { address, slug } = req.params;

  if (address !== res.locals.address) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await prisma.track
    .delete({
      where: { artistAddress_slug: { artistAddress: address, slug } },
    })
    .then(() => {
      return res.status(200).json({ ok: true });
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

// Update playcount
router.post("/playcount/:id", isAuthorized, async (req, res) => {
  const { id } = req.params;

  await prisma.playEvent
    .create({
      data: {
        track: { connect: { id } },
        user: { connect: { address: res.locals.address } },
      },
      select: {
        track: {
          select: {
            audio: true,
            image: true,
            title: true,
            slug: true,
            artistAddress: true,
            tags: true,
            _count: { select: { playEvents: true } },
          },
        },
      },
    })
    .then((event) => event.track)
    .then(collectTags)
    .then(countRelations("playEvents", "playCount"))
    .then((track) => {
      return res.status(200).json({ ok: true, track });
    })
    .catch((e: any) => {
      if (e.code === "P2025") {
        return res.status(404).json({ error: "Track not found" });
      } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
        console.log(`Prisma Error ${e.code}: ${e.message}`);
        return res.status(400).json({ error: "Playcount increasing error" });
      } else {
        console.log(e);
        return res.status(400).json({ error: "Unknown Error" });
      }
    });
});

export default router;
