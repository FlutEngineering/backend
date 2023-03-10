import { S3 } from "@aws-sdk/client-s3";
import { Progress, Upload } from "@aws-sdk/lib-storage";
import { S3_API_KEY, S3_API_SECRET, S3_BUCKET_NAME } from "~/config";

const client = new S3({
  endpoint: "https://endpoint.4everland.co",
  credentials: {
    accessKeyId: S3_API_KEY,
    secretAccessKey: S3_API_SECRET,
  },
  region: "us-west-2",
});

interface InputFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

const uploadParamsFrom = (file: InputFile) => ({
  Bucket: S3_BUCKET_NAME,
  Key: file.filename,
  Body: file.buffer,
  ContentType: file.mimetype,
});

const showProgress = (e: Progress) => {
  const progress = ((e.loaded! / e.total!) * 100) | 0;
  console.log(e.Key, progress);
};

export async function upload(audio: InputFile, image: InputFile) {
  const audioParams = uploadParamsFrom(audio);
  const imageParams = uploadParamsFrom(image);

  const audioUploadTask = new Upload({
    client,
    queueSize: 3,
    params: audioParams,
  });

  const imageUploadTask = new Upload({
    client,
    queueSize: 3,
    params: imageParams,
  });

  audioUploadTask.on("httpUploadProgress", showProgress);
  imageUploadTask.on("httpUploadProgress", showProgress);

  await Promise.all([audioUploadTask.done(), imageUploadTask.done()]);

  const audioResult = await client.headObject(audioParams);
  const imageResult = await client.headObject(imageParams);

  if (!audioResult.Metadata || !imageResult.Metadata) {
    throw new Error("Upload error");
  }

  const result = {
    audio: audioResult.Metadata["ipfs-hash"],
    image: imageResult.Metadata["ipfs-hash"],
  };

  return result;
}
