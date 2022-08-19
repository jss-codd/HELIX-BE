import * as componentController from "../controllers/component.js";
import express from "express";
import { keycloak } from "../config/keycloak.js";
import upload from "../middlewares/fileUpload.js";

const router = express.Router();

router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

router.get(
  "/",
  keycloak.protect("realm:app-admin"),
  componentController.getComponents
);
router.post(
  "/",
  [keycloak.protect("realm:app-admin"), upload.single("file")],
  componentController.createComponent
);

export default router;
