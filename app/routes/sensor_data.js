import * as sensorDataController from "../controllers/sensor_data.js";
import express from "express";
import { keycloak } from "../config/keycloak.js";

const router = express.Router();

router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

router.get("/", keycloak.protect(), sensorDataController.getSensorData);
// router.get("/pub_data/:topicId", keycloak.protect(), sensorDataController.pub_data);
// router.get("/getPublishList", keycloak.protect(), sensorDataController.getPublishList);
router.get("/getFilterSensorData", keycloak.protect(), sensorDataController.getfilterSensorData);
// router.get("/tableList", keycloak.protect(), sensorDataController.getTableList);




export default router;
