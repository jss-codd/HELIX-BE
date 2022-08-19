import authJwt from "../middlewares/authJwt.js";
import verifySitePermission from "../middlewares/verifySitePermission.js";
import * as userController from "../controllers/user.js";
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

router.get("/:subId/logo/:fileName", userController.getLogo);
router.post("/verify", keycloak.protect(), userController.verifyToken);

router.get("/version", function(req,res){ res.send({ version : '1.0.16'})});

router.get("/info", keycloak.protect(), userController.getUserInfo);
router.get("/sites", keycloak.protect(), userController.getSites);
router.get(
  "/sites/:siteId",
  [keycloak.protect(), verifySitePermission.verify],
  userController.getSite
);

router.post("/solutions", keycloak.protect(), userController.addSolution);
router.delete("/solutions", keycloak.protect(), userController.removeSolution);

router.post(
  "/logo",
  [keycloak.protect(), upload.single("file")],
  userController.uploadLogo
);

router.post("/:email/reset_password", emailController.sendPasswordResetEmail);

router.get("/getCustomerLogo/:subId", userController.getCustomerLogo);
router.post("/profileLogo", [keycloak.protect(), upload.single("file")],userController.profileLogo);
router.get("/getUserInfoBySub/:subId", userController.getUserInfoBySub);
router.get("/subUserInfo", userController.subUserInfo);


// router.post(
//   "/:userId/receive_new_password/:token",
//   emailController.receiveNewPassword
// );

export default router;

