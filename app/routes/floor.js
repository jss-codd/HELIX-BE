import * as washroomController from "../controllers/washroom.js";
import * as floorController from "../controllers/floor.js";
import express from "express";
import { keycloak } from "../config/keycloak.js";

const router = express.Router();

router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

router.post(
  "/:floorId/washrooms",
  keycloak.protect(),
  washroomController.createWashrooms
);
router.put(
  "/:floorId/washrooms",
  keycloak.protect(),
  washroomController.updateWashrooms
);

export default router;
