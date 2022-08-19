import mongoose from "mongoose";

const SensorData = mongoose.model(
  "SensorData",
  new mongoose.Schema(
    {
      topic: String,
      data: Object
    },
  )
);

export default SensorData;
