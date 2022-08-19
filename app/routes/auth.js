import verifySignUp from "../middlewares/verifySignUp.js";
import { signup, signin } from "../controllers/auth.js";
import express from "express";

const router = express.Router();

router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

router.post("/signup", [verifySignUp.checkDuplicateEmail], signup);

router.post("/signin", signin);

export default router;
