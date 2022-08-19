import * as sensorTypeController from "../controllers/sensor_type.js";
import express from "express";
import { keycloak } from "../config/keycloak.js";

const router = express.Router();

router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

router.get("/", keycloak.protect(), sensorTypeController.getSensorTypes);
router.put("/:sensorTypeId", keycloak.protect(), sensorTypeController.updateSensorType);
router.post("/", keycloak.protect(), sensorTypeController.createSensorType);
router.delete("/:sensorTypeId", keycloak.protect(), sensorTypeController.deleteSensorType);


export default router;
