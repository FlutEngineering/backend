import { Prisma, PrismaClient } from "@prisma/client";
import express from "express";
import isAddress from "~/middlewares/isAddress";
import { followsToArrays } from "~/utils";

const prisma = new PrismaClient();

const router = express.Router();

router.get("/", async (_req, res) => {
  await prisma.user
    .findMany({
      select: {
        address: true,
        _count: { select: { followedBy: true } },
      },
    })
    .then((artists) =>
      artists.map((artist) => ({
        address: artist.address,
        followers: artist._count.followedBy,
      }))
    )
    .then((artists) => {
      return res.status(200).json({ artists });
    })
    .catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        console.log(`Prisma Error ${e.code}: ${e.message}`);
        return res.status(400).json({ error: "Artist list request error" });
      } else {
        console.log(e);
        return res.status(400).json({ error: "Unknown Error" });
      }
    });
});

router.get("/:address", isAddress, async (req, res) => {
  const { address } = req.params;

  await prisma.user
    .findUniqueOrThrow({
      where: { address },
      select: {
        address: true,
        followedBy: true,
        following: true,
      },
    })
    .then((artist) => followsToArrays(artist))
    .then((artist) => {
      return res.status(200).json({ artist });
    })
    .catch((e) => {
      if (e.code === "P2025") {
        return res.status(404).json({ error: "Artist not found" });
      } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
        console.log(`Prisma Error ${e.code}: ${e.message}`);
        return res.status(400).json({ error: "Artist request error" });
      } else {
        console.log(e);
        return res.status(400).json({ error: "Unknown Error" });
      }
    });
});

export default router;
