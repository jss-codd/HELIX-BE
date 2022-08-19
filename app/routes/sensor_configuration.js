import * as sensorConfigController from '../controllers/sensor_configuration.js';
import express from "express";
import { keycloak } from "../config/keycloak.js";

const router = express.Router();

router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

router.get("/", keycloak.protect(), sensorConfigController.getSensorConfig);
router.post("/", keycloak.protect(), sensorConfigController.createSensorConfig);
router.get("/:id", keycloak.protect(), sensorConfigController.getSensorConfigById);
router.delete("/:id", keycloak.protect(), sensorConfigController.deleteSensorConfigById);
router.put("/:id", keycloak.protect(), sensorConfigController.updateSensorConfigById)



export default router;