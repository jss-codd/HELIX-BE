import * as PlotlyDashboard from "../controllers/plotly_dash.js";
import express from "express";
import { keycloak } from "../config/keycloak.js";

const router = express.Router();

router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

router.get("/", keycloak.protect(),PlotlyDashboard.getPlotlyData);
router.post("/createPlotlyDash", keycloak.protect(), PlotlyDashboard.createPlotlyDashboard);



export default router;