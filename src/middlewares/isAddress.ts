import * as ethers from "ethers";
import { RequestHandler } from "express";

const isAddress: RequestHandler = (req, res, next) => {
  if (!ethers.utils.isAddress(req.params.address)) {
    return res.status(400).json({ error: "Invalid address" });
  }

  next();
};

export default isAddress;
