import path from "node:path";
import express from "express";
import multer from "multer";
import * as ipfs from "~/services/ipfs";

const AUDIO_MIMETYPES = [
  "audio/aac",
  "audio/mpeg",
  "audio/ogg",
  "audio/opus",
  "audio/wav",
  "audio/webm",
];

const IMAGE_MIMETYPES = ["image/jpeg", "image/png"];

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10mb
  },
});

const uploadMiddleware = upload.fields([
  { name: "audio", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

const router = express.Router();

router.use(uploadMiddleware);

// router.get("/", (req, res) => {
//   res.send("GET audio");
// });

router.post("/", async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files?.audio?.length) {
    return res.status(400).json({ error: "Audio is required" });
  }

  if (!files?.image?.length) {
    return res.status(400).json({ error: "Image is required" });
  }

  const audio = files.audio[0];
  const image = files.image[0];

  if (!AUDIO_MIMETYPES.includes(audio.mimetype)) {
    return res
      .status(415)
      .json({ error: `${audio.mimetype} is not supported` });
  }

  if (!IMAGE_MIMETYPES.includes(image.mimetype)) {
    return res
      .status(415)
      .json({ error: `${image.mimetype} is not supported` });
  }

  const audioFilename = `audio${path.extname(audio.originalname)}`;
  const imageFilename = `image${path.extname(image.originalname)}`;

  const audioData = {
    buffer: audio.buffer,
    filename: audioFilename,
    mimetype: audio.mimetype,
  };

  const imageData = {
    buffer: image.buffer,
    filename: imageFilename,
    mimetype: image.mimetype,
  };

  const cid = await ipfs.upload(audioData, imageData);

  console.log("cid =>", cid);

  return res
    .status(200)
    .json({ cid, audio: audioFilename, image: imageFilename });
});

export default router;
