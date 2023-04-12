import express from "express";
import { json as jsonParser } from "body-parser";
import { generateNonce, SiweMessage } from "siwe";
import isAuthorized from "~/middlewares/isAuthorized";

const router = express.Router();
router.use(jsonParser());

router.get("/nonce", async (req, res) => {
  // eslint-disable-next-line functional/immutable-data
  req.session.nonce = generateNonce();
  res.setHeader("Content-Type", "text/plain");
  await req.session.save();
  res.send(req.session.nonce);
});

router.get("/status", isAuthorized, async (_req, res) => {
  const address = res.locals.address;
  return res.send({ ok: true, address });
});

router.post("/verify", async (req, res) => {
  try {
    const { message, signature } = req.body;

    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.validate(signature);

    if (fields.nonce !== req.session.nonce) {
      return res.status(422).json({ message: "Invalid nonce." });
    }

    // eslint-disable-next-line functional/immutable-data
    req.session.siwe = fields;
    await req.session.save();
    return res.json({ ok: true });
  } catch (e) {
    console.log(e);
    return res.json({ ok: false });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  return res.send({ ok: true });
});

export default router;
