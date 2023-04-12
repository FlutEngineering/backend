import { RequestHandler } from "express";

const isAuthorized: RequestHandler = (req, res, next) => {
  const address = req.session.siwe?.address;

  if (!address) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // eslint-disable-next-line functional/immutable-data
  res.locals.address = address;
  next();
};

export default isAuthorized;
