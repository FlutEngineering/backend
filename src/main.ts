import express from "express";
import cors from "cors";
import helmet from "helmet";
import { ironSession } from "iron-session/express";

import { COOKIE_PASSWORD, PORT } from "./config";

import artist from "~/routes/artist";
import tags from "~/routes/tags";
import audio from "~/routes/tracks";
import auth from "~/routes/auth";
import "~/types";

const app = express();
const session = ironSession({
  cookieName: "siwe",
  password: COOKIE_PASSWORD,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
});

app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(session);
app.use("/v1/tracks", audio);
app.use("/v1/tags", tags);
app.use("/v1/artist", artist);
app.use("/v1/auth", auth);

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://0.0.0.0:${PORT}`);
});
