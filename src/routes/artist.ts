import { Prisma, PrismaClient } from "@prisma/client";
import * as ethers from "ethers";
import express from "express";
import isAuthorized from "~/middlewares/isAuthorized";
import { followsToArrays } from "~/utils";

const prisma = new PrismaClient();

const router = express.Router();

router.get("/follow/:toFollow", isAuthorized, async (req, res) => {
  const address = res.locals.address;
  const { toFollow } = req.params;

  if (!ethers.utils.isAddress(toFollow)) {
    return res.status(400).json({ error: "Invalid address" });
  }

  await prisma.follows
    .create({
      data: {
        follower: {
          connectOrCreate: {
            where: { address },
            create: { address },
          },
        },
        following: {
          connect: {
            address: toFollow,
          },
        },
      },
    })
    .then((newFollow) => {
      console.log(newFollow);
      return res.status(200).json({ ok: true });
    })
    .catch((e) => {
      if (e.code === "P2025") {
        return res.status(404).json({ error: "Artist not found" });
      } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
        console.log(`Prisma Error ${e.code}: ${e.message}`);
        return res.status(400).json({ error: "Artist follow error" });
      } else {
        console.log(e);
        return res.status(400).json({ error: "Unknown Error" });
      }
    });
});

router.get("/unfollow/:toUnfollow", isAuthorized, async (req, res) => {
  const address = res.locals.address;
  const { toUnfollow } = req.params;

  if (!ethers.utils.isAddress(toUnfollow)) {
    return res.status(400).json({ error: "Invalid address" });
  }

  await prisma.follows
    .delete({
      where: {
        followerId_followingId: {
          followerId: address,
          followingId: toUnfollow,
        },
      },
    })
    .then((deletedFollow) => {
      console.log(deletedFollow);
      return res.status(200).json({ ok: true });
    })
    .catch((e) => {
      if (e.code === "P2025") {
        return res.status(404).json({ error: "Artist not found" });
      } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
        console.log(`Prisma Error ${e.code}: ${e.message}`);
        return res.status(400).json({ error: "Artist unfollow error" });
      } else {
        console.log(e);
        return res.status(400).json({ error: "Unknown Error" });
      }
    });
});

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
