import express from "express";
import cors from "cors";
import helmet from "helmet";
import { ironSession } from "iron-session/express";

import { COOKIE_PASSWORD, PORT } from "./config";

import auth from "~/routes/auth";
import me from "~/routes/me";
import artists from "~/routes/artists";
import tracks from "~/routes/tracks";
import tags from "~/routes/tags";
import playlists from "~/routes/playlists";
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
app.use("/v1/auth", auth);
app.use("/v1/me", me);
app.use("/v1/artists", artists);
app.use("/v1/tracks", tracks);
app.use("/v1/tags", tags);
app.use("/v1/playlists", playlists);

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://0.0.0.0:${PORT}`);
});
