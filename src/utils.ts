import { createHash } from "node:crypto";
import type { TagsOnTracks } from "@prisma/client";

type HasTags = { tags: TagsOnTracks[] };

export function tagsToArray<T>(track: T & HasTags) {
  return {
    ...track,
    tags: track.tags.map((tag) => tag.tagName),
  };
}

export function sha256(input: string | Buffer) {
  return createHash("sha256").update(input).digest("hex");
}
