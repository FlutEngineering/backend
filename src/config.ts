import * as dotenv from "dotenv";
import { isAddress } from "ethers/lib/utils";

const config = dotenv.config();

export const TRACK_FIELDS = {
  id: true,
  audio: true,
  image: true,
  title: true,
  slug: true,
  artistAddress: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { playEvents: true } },
};

export const PLAYLIST_FIELDS = {
  id: true,
  title: true,
  slug: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  tracks: {
    select: {
      track: {
        select: TRACK_FIELDS,
      },
    },
  },
};

// TODO: add validation
export const PORT = config.parsed?.PORT || 8001;
export const S3_ENDPOINT_URL = config.parsed?.S3_ENDPOINT_URL || "";
export const S3_API_KEY = config.parsed?.S3_API_KEY || "";
export const S3_API_SECRET = config.parsed?.S3_API_SECRET || "";
export const S3_BUCKET_NAME = config.parsed?.S3_BUCKET_NAME || "";
export const COOKIE_PASSWORD = config.parsed?.COOKIE_PASSWORD || "";
export const ASSETS_PATH = config.parsed?.ASSETS_PATH || "../flute-assets";
export const ADMINS = (config.parsed?.ADMINS || "")
  .replace(/\s/g, "")
  .split(",")
  .filter(isAddress);

console.log("👾", "Admins:", ADMINS);
