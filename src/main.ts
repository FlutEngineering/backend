import cors from "cors";
import express from "express";

import { PORT } from "./config";

import tags from "~/routes/tags";
import audio from "~/routes/tracks";

const app = express();
const port = PORT;

app.use(cors({ origin: true }));
app.use("/v1/tracks", audio);
app.use("/v1/tags", tags);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
});
