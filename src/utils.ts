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
    following: artist.following.map(({ followingId }) => followingId),
    followedBy: artist.followedBy.map(({ followerId }) => followerId),
  };
}

export function countRelations<T, P extends string>(
  { _count, ...track }: T & { _count: { [K in P]: number } },
  relationName: P,
  fieldName: string = relationName
) {
  return {
    ...track,
    [fieldName]: _count[relationName],
  };
}

export function sha256(input: string | Buffer) {
  return createHash("sha256").update(input).digest("hex");
}
