import authJwt from "../middlewares/authJwt.js";
import verifySitePermission from "../middlewares/verifySitePermission.js";
import * as imUserController from "../controllers/im_users.js";
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


router.post("/createImUser", [keycloak.protect(), upload.single("file")], imUserController.createImUsers);

router.get("/getImUser", keycloak.protect(), imUserController.getImUsers);
router.get("/getImUserByUsername", keycloak.protect(), imUserController.getImUsersByUserName);
router.get("/getImUsersByParentId", keycloak.protect(), imUserController.getImUsersByParentId);
// router.get("/getImUserCustomerLogo", keycloak.protect(), imUserController.getCustomerLogo);




export default router;