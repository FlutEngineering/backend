import { Prisma, PrismaClient } from "@prisma/client";
import express from "express";
import isAddress from "~/middlewares/isAddress";
import isAuthorized from "~/middlewares/isAuthorized";
import { collectFollows, collectLikes } from "~/utils";

const prisma = new PrismaClient();

const router = express.Router();

router.get("/like/:id", isAuthorized, async (req, res) => {
  const address = res.locals.address;
  const trackId = req.params.id;

  await prisma.like
    .create({
      data: {
        user: {
          connect: {
            address,
          },
        },
        track: {
          connect: {
            id: trackId,
          },
        },
      },
    })
    .then(() => {
      return res.status(200).json({ ok: true });
    })
    .catch((e) => {
      if (e.code === "P2025") {
        return res.status(404).json({ error: "Track not found" });
      } else if (e.code === "P2002") {
        return res.status(400).json({ error: "Already liked" });
      } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
        console.log(`Prisma Error ${e.code}: ${e.message}`);
        return res.status(400).json({ error: "Track like error" });
      } else {
        console.log(e);
        return res.status(400).json({ error: "Unknown Error" });
      }
    });
});

router.get("/unlike/:id", isAuthorized, async (req, res) => {
  const address = res.locals.address;
  const trackId = req.params.id;

  await prisma.like
    .delete({
      where: {
        userId_trackId: {
          userId: address,
          trackId,
        },
      },
    })
    .then(() => {
      return res.status(200).json({ ok: true });
    })
    .catch((e) => {
      if (e.code === "P2025") {
        return res.status(404).json({ error: "Track not found" });
      } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
        console.log(`Prisma Error ${e.code}: ${e.message}`);
        return res.status(400).json({ error: "Track unlike error" });
      } else {
        console.log(e);
        return res.status(400).json({ error: "Unknown Error" });
      }
    });
});

router.get("/follow/:address", isAddress, isAuthorized, async (req, res) => {
  const address = res.locals.address;
  const toFollow = req.params.address;

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
    .then(() => {
      return res.status(200).json({ ok: true });
    })
    .catch((e) => {
      if (e.code === "P2025") {
        return res.status(404).json({ error: "Artist not found" });
      } else if (e.code === "P2002") {
        return res.status(400).json({ error: "Already following" });
      } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
        console.log(`Prisma Error ${e.code}: ${e.message}`);
        return res.status(400).json({ error: "Artist follow error" });
      } else {
        console.log(e);
        return res.status(400).json({ error: "Unknown Error" });
      }
    });
});

router.get("/unfollow/:address", isAddress, isAuthorized, async (req, res) => {
  const address = res.locals.address;
  const toUnfollow = req.params.address;

  await prisma.follows
    .delete({
      where: {
        followerId_followingId: {
          followerId: address,
          followingId: toUnfollow,
        },
      },
    })
    .then(() => {
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

router.get("/", isAuthorized, async (_req, res) => {
  const address = res.locals.address;

  await prisma.user
    .findUniqueOrThrow({
      where: { address },
      select: {
        address: true,
        followedBy: true,
        following: true,
        likes: true,
        playlists: { include: { _count: { select: { tracks: true } } } },
      },
    })
    .then((user) => ({
      ...user,
      playlists: user.playlists.map((playlist) => ({
        ...playlist,
        _count: undefined,
        trackCount: playlist._count.tracks,
      })),
    }))
    .then(collectFollows)
    .then(collectLikes)
    .then((user) => {
      return res.status(200).json({
        user: {
          ...user,
          isAdmin: res.locals.isAdmin,
        },
      });
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
