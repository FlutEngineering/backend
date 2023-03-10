import express from "express";
import cors from "cors";
import audio from "~/routes/tracks";
import { PORT } from "./config";

const app = express();
const port = PORT;

app.use(cors());
app.use("/v1/tracks", audio);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
});
