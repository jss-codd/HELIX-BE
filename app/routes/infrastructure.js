import * as infrasController from "../controllers/infrastructure.js";
import * as floorController from "../controllers/floor.js";
import express from "express";
import { keycloak } from "../config/keycloak.js";

const router = express.Router();

router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

router.get("/", keycloak.protect(), infrasController.getInfras);
router.post("/", keycloak.protect(), infrasController.createInfras);
router.put("/:infraId", keycloak.protect(), infrasController.updateInfra);
router.post(
  "/:infraId/floors",
  keycloak.protect(),
  floorController.createFloors
);

router.put(
  "/:infraId/floors",
  keycloak.protect(),
  floorController.updateFloors
);

export default router;
