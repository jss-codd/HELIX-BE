import mongoose from "mongoose";

const Sensor = mongoose.model(
  "Sensor",
  new mongoose.Schema(
    {
      device_id: String,
      code: String,
      description: String,
      gateway: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Gateway",
      },
    },
    { timestamps: true }
  )
);

export default Sensor;
