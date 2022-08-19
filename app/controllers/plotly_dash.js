import db from "../models/index.js";
const Ploty = db.ploty_dash;

export const getPlotlyData = async (req, res) => {
  const { sub, given_name, family_name, email, roles } =
    req.kauth.grant.access_token.content;

  const PlotlyDashboardData = await Ploty.findOne({ userSubId: sub,deviceId:req.query.deviceId });
  res.status(200).send(PlotlyDashboardData);
};

export const createPlotlyDashboard = async (req, res) => {
  const { sub, given_name, family_name, email, roles } =
    req.kauth.grant.access_token.content;

  const data = req.body;

  const upsert = await Ploty.findOneAndUpdate(
    { userSubId: sub ,deviceId:req.query.deviceId },
    { userSubId: sub, data: data,deviceId:req.query.deviceId },
    { upsert: true }
  );
  res.status(201).send("dashboard save sucessfully")
};


