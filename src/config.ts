import * as dotenv from "dotenv";

const config = dotenv.config();

// TODO: add validation
export const PORT = config.parsed?.PORT || 8001;
export const S3_ENDPOINT_URL = config.parsed?.S3_ENDPOINT_URL || "";
export const S3_API_KEY = config.parsed?.S3_API_KEY || "";
export const S3_API_SECRET = config.parsed?.S3_API_SECRET || "";
export const S3_BUCKET_NAME = config.parsed?.S3_BUCKET_NAME || "";
