import * as sensorController from "../controllers/sensor.js";
import express from "express";
import { keycloak } from "../config/keycloak.js";

const router = express.Router();

router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

router.get("/", keycloak.protect(), sensorController.getSensors);
router.get("/downloadCobie", keycloak.protect(), sensorController.downloadCobie);
router.post("/uploadIfc", keycloak.protect(), sensorController.uploadIfc);
// router.get("/:sensorId", keycloak.protect(), sensorController.getSensorData);
router.get("/:sensorId", keycloak.protect(), sensorController.getWellnessSensorData);
router.post("/", keycloak.protect(), sensorController.createSensor);
router.put("/:sensorId", keycloak.protect(), sensorController.updateSensor);
router.delete("/:sensorId", keycloak.protect(), sensorController.deleteSensor);
router.get("/:sensorId/certificates", keycloak.protect(), sensorController.downloadCertificates);
router.get("/getS3CerificatesByGatewayId/:gatewayId",keycloak.protect(),sensorController.s3GatewayCertificates)
router.post("/generateTopic",keycloak.protect(),sensorController.generateTopic)
router.get("/isSensorExist/:deviceId",keycloak.protect(),sensorController.isSensorExist)
router.post("/updateSensor/:sensorId",keycloak.protect(),sensorController.update_Sensor)
router.get("/parentSensorList",keycloak.protect(),sensorController.parentSensorList)





export default router;
