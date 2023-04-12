import { createHash } from "node:crypto";
import type { Follows, TagsOnTracks } from "@prisma/client";

type HasTags = { tags: TagsOnTracks[] };
type HasFollows = { following: Follows[]; followedBy: Follows[] };

export function tagsToArray<T>(track: T & HasTags) {
  return {
    ...track,
    tags: track.tags.map((tag) => tag.tagName),
  };
}

export function followsToArrays<T>(artist: T & HasFollows) {
  return {
    ...artist,
    following: artist.following.map(({ followerId }) => followerId),
    followedBy: artist.followedBy.map(({ followingId }) => followingId),
  };
}

export function sha256(input: string | Buffer) {
  return createHash("sha256").update(input).digest("hex");
}
