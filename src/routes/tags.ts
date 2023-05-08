import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { countRelations } from "~/utils";

const prisma = new PrismaClient();

const router = express.Router();

router.get("/", async (_req, res) => {
  await prisma.tag
    .findMany({
      select: {
        name: true,
        _count: { select: { tracks: true } },
      },
    })
    .then((tags) =>
      tags.map((tag) => countRelations(tag, "tracks", "trackCount"))
    )
    .then((tags) => {
      return res.status(200).json({ tags });
    })
    .catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        console.log(`Prisma Error ${e.code}: ${e.message}`);
        return res.status(400).json({ error: "Tag list request error" });
      } else {
        console.log(e);
        return res.status(400).json({ error: "Unknown Error" });
      }
    });
});

export default router;
