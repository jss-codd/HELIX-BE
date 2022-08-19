import * as publishController from "../controllers/publish_data.js";

import express from "express";
import { keycloak } from "../config/keycloak.js";

const router = express.Router();

router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

router.get("/", keycloak.protect(), publishController.isExitPublish);
router.get("/:deviceId", keycloak.protect(), publishController.getPublishDataById);


export default router;