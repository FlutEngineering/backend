import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ASSETS_PATH } from "~/config";

export async function generateThumbnail(buffer: Buffer, cid: string) {
  const filename = `${ASSETS_PATH}/thumbnails/${cid}_160.jpg`;
  if (!fs.existsSync(filename)) {
    const start = performance.now();
    await sharp(buffer)
      .resize({ width: 160, height: 160 })
      .jpeg()
      .timeout({ seconds: 5 })
      .toFile(filename);
    const elapsed = performance.now() - start;
    console.log("👾", `Image resized in ${elapsed}ms`);
  } else {
    console.log("👾", `File ${path.basename(filename)} already exists`);
  }
}
