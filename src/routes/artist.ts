import path from "node:path";

import { Prisma, PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();

const router = express.Router();

router.get("/", async (req, res) => {
  const artist = Array.isArray(req.query.artist)
    ? req.query.artist.at(0)
    : req.query.artist;

  console.log("req.query", req.query);
  console.log("artist", artist);

  await prisma.user
    .findUnique({
      where: {
        address: artist as string,
      },
      select: {
        followedBy: true,
        following: true,
      },
    })

    .then((artist) => {
      return res.status(200).json({ artist });
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

export default router;
