import { FilebaseClient, File } from "@filebase/client";
import { FILEBASE_API_TOKEN } from "~/config";
// import { S3, S3Client } from "@aws-sdk/client-s3";

// const client = new S3({
//   accessKeyId: "",
// });
//

interface InputFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

const client = new FilebaseClient({ token: FILEBASE_API_TOKEN });

const fileFrom = (file: InputFile): File =>
  new File([file.buffer], file.filename, {
    type: file.mimetype,
  });

export function upload(audio: InputFile, image: InputFile) {
  return client.storeDirectory([
    fileFrom(audio),
    fileFrom(image),
    // new File(
    //   [JSON.stringify({ title: "some title" }, null, 2)],
    //   "metadata.json"
    // ),
  ]);
}
