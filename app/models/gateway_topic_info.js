import mongoose from "mongoose";

const GatewayTopicInfo = mongoose.model(
  "GatewayTopicInfo",
  new mongoose.Schema(
    {
      device_id: String,
      gatewayTopicName: String,
      subId: String,
      
      
    },
    { timestamps: true }
  )
);

export default GatewayTopicInfo;