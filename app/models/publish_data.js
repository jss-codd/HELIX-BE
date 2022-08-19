import mongoose from "mongoose";

const PublishData = mongoose.model(
  "PublishData",
  new mongoose.Schema(
    {
      device_id: String,
      topic: String,
      parent_gateway_topic: String,
      host: String,
      port: String,
      keyPath: String,
      crtPath: String,
      rootCAPath: String
    },
  )
);

export default PublishData;
