import { json as jsonParser } from "body-parser";
import express from "express";
import { generateNonce, SiweMessage } from "siwe";

const router = express.Router();
router.use(jsonParser());

router.get("/nonce", async (req, res) => {
  req.session.nonce = generateNonce();
  res.setHeader("Content-Type", "text/plain");
  await req.session.save();
  res.send(req.session.nonce);
});

router.post("/verify", async (req, res) => {
  try {
    const { message, signature } = req.body;

    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.validate(signature);

    if (fields.nonce !== req.session.nonce) {
      return res.status(422).json({ message: "Invalid nonce." });
    }

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
