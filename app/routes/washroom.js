import * as washroomController from "../controllers/washroom.js";
import * as sensorController from "../controllers/sensor.js";
import express from "express";
import { keycloak } from "../config/keycloak.js";

const router = express.Router();

router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

router.get("/", keycloak.protect(), washroomController.getWashrooms);
router.post(
  "/statistic",
  keycloak.protect(),
  washroomController.getWashroomStatistic
);
router.post("/predict", keycloak.protect(), washroomController.predict);

router.post(
  "/:washroomId/components",
  keycloak.protect(),
  washroomController.createComponent
);

router.put(
  "/:washroomId/components/:componentId",
  keycloak.protect(),
  washroomController.updateComponent
);

router.delete(
  "/:washroomId/components/:componentId",
  keycloak.protect(),
  washroomController.deleteComponent
);

router.post(
  "/:washroomId/sensors",
  keycloak.protect(),
  sensorController.createSensor
);

router.get(
  "/:washroomId/sensors",
  keycloak.protect(),
  sensorController.getSensorData
);

router.get(
  "/:washroomId/keys",
  keycloak.protect(),
  sensorController.getSensorKeys
);

export default router;
