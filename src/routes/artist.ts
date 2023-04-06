import { Prisma, PrismaClient } from "@prisma/client";
import * as ethers from "ethers";
import express from "express";

const prisma = new PrismaClient();

const router = express.Router();

router.post("/:toFollow/:followedBy", async (req, res) => {
  console.log("/follow=>", req.params);
  const { toFollow: toFollowAddress, followedBy: followedByAddress } =
    req.params;

  if (
    !ethers.utils.isAddress(toFollowAddress) ||
    !ethers.utils.isAddress(followedByAddress)
  ) {
    return res.status(400).json({ error: "Invalid address" });
  }

  await prisma.follows
    .create({
      data: {
        follower: {
          connectOrCreate: {
            where: { address: followedByAddress },
            create: { address: followedByAddress },
          },
        },
        following: {
          connect: {
            address: toFollowAddress,
          },
        },
      },
    })
    .then((newFollow) => {
      console.log(newFollow);
      return res.status(200).json({ newFollow });
    })
    .catch((e) => {
      console.log(e);
      return res.status(400).json({ error: "Unknown Error" });
    });
});

router.post("/unfollow/:toFollow/:followedBy", async (req, res) => {
  // console.log("unfollow");
  const { toFollow: toFollowAddress, followedBy: followedByAddress } =
    req.params;

  if (
    !ethers.utils.isAddress(toFollowAddress) ||
    !ethers.utils.isAddress(followedByAddress)
  ) {
    return res.status(400).json({ error: "Invalid address" });
  }

  await prisma.follows
    .delete({
      where: {
        followerId_followingId: {
          followerId: followedByAddress,
          followingId: toFollowAddress,
        },
      },
    })
    .then((deletedFollow) => {
      console.log(deletedFollow);
      return res.status(200).json({ deletedFollow });
    })
    .catch((e) => {
      console.log(e);
      return res.status(400).json({ error: "Unknown Error" });
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
