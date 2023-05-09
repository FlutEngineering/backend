import { createHash } from "node:crypto";
import * as R from "ramda";

interface RelationToCollect<N, K> {
  collect: N;
  by: K;
}

export const collectRelations =
  <N extends string, K extends string>(relations: RelationToCollect<N, K>[]) =>
  <T extends Record<N, Array<Record<K, any>>>>(track: T) =>
    relations.reduce(
      (acc, relation) => ({
        ...acc,
        [relation.collect]: R.pluck(relation.by, acc[relation.collect]),
      }),
      track
    );

export const collectTags = collectRelations([
  { collect: "tags", by: "tagName" },
]);

export const collectFollows = collectRelations([
  { collect: "following", by: "followingId" },
  { collect: "followedBy", by: "followerId" },
]);

export const countRelations =
  <R extends string, As extends string>(relationName: R, as: As) =>
  <T extends { _count: { [K in R]: number } }>({ _count, ...track }: T) =>
    R.assoc(as, _count[relationName], track);

export function sha256(input: string | Buffer) {
  return createHash("sha256").update(input).digest("hex");
}
