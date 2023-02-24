import express from "express";

import audio from "~/routes/audio";
import { PORT } from "./config";

const app = express();
const port = PORT;

app.use("/v1/audio", audio);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
});
