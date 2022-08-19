
import * as applicationController from "../controllers/applications.js";
import * as emailController from "../controllers/email.js";
import express from "express";
import { keycloak } from "../config/keycloak.js";
import upload from "../middlewares/fileUpload.js";

const router = express.Router();

router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

router.delete("/:id", keycloak.protect(), applicationController.deleteApplicationById);
router.post("/create", [keycloak.protect(), upload.single("file")], applicationController.createApplication);
router.put("/:id",[keycloak.protect(), upload.single("file")], applicationController.updateApplicationById)
router.get("/", keycloak.protect(), applicationController.getApplications);
router.get("/isApplicationExist/:ApplicationName",keycloak.protect(),applicationController.isApplicationExist)




export default router;