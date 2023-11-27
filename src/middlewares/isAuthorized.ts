import { RequestHandler } from "express";
import { ADMINS } from "~/config";

const isAuthorized: RequestHandler = (req, res, next) => {
  const address = req.session.siwe?.address;

  if (!address) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // eslint-disable-next-line functional/immutable-data
  res.locals.address = address;

  if (ADMINS.includes(address)) {
    // eslint-disable-next-line functional/immutable-data
    res.locals.isAdmin = true;
  }

  next();
};

export default isAuthorized;
