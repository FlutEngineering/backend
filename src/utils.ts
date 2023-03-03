import { TagsOnTracks } from "@prisma/client";

type HasTags = { tags: TagsOnTracks[] };

export function tagsToArray<T>(track: T & HasTags) {
  return {
    ...track,
    tags: track.tags.map((tag) => tag.tagName),
  };
}
