import dotenv from "dotenv";

const config = dotenv.config();

export const PORT = config.parsed?.PORT || 8001;
export const FILEBASE_API_TOKEN = config.parsed?.FILEBASE_API_TOKEN || ""; // TODO: add validation
