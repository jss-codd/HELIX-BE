import mongoose from "mongoose";

const PlotlyDashboard = mongoose.model(
  "PlotlyDashboard",
  new mongoose.Schema(
    {
      deviceId:String,
      userSubId: String,
      data: [Object]
    },
  )
);

export default PlotlyDashboard;
