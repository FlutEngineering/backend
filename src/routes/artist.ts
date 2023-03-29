import { Prisma, PrismaClient } from "@prisma/client";
import express from "express";
import * as ethers from "ethers";

const prisma = new PrismaClient();

const router = express.Router();

router.get("/:address", async (req, res) => {
  const { address } = req.params;

  if (!ethers.utils.isAddress(address)) {
    return res.status(400).json({ error: "Invalid address" });
  }

  await prisma.user
    .findUniqueOrThrow({
      where: { address },
      select: {
        address: true,
        followedBy: true,
        following: true,
      },
    })
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
